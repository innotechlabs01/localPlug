import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission, syncClerkUserRole } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('employees', 'view')
  if (authError) return authError

  const db = getDb()

  const result = await db.execute(`
    SELECT
      u.id,
      u.clerk_id,
      u.name,
      u.email,
      u.status,
      u.last_login_at,
      u.created_at,
      r.id as role_id,
      r.name as role_name,
      (SELECT COUNT(*) FROM orders WHERE assigned_to = u.id) as orders_assigned
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.name
  `)

  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('employees', 'create')
    if (authError) return authError

    const body = await req.json()
    const { name, email, role_id } = body

    if (!name || !email || !role_id) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    const db = getDb()

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const result = await db.execute({
      sql: `INSERT INTO users (name, email, role_id, status, created_at, updated_at)
            VALUES (?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      args: [name, email, role_id],
    })

    const newUserId = Number(result.lastInsertRowid)

    // Also add to user_roles table
    await db.execute({
      sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      args: [newUserId, role_id],
    })

    // Sync role to Clerk if the user already has a clerk_id (Clerk-authenticated user)
    const newUser = await db.execute({
      sql: 'SELECT clerk_id FROM users WHERE id = ?',
      args: [newUserId],
    })
    const clerkId = newUser.rows?.[0]?.clerk_id as string | undefined
    const roleRes = await db.execute({
      sql: 'SELECT name FROM roles WHERE id = ?',
      args: [role_id],
    })
    const roleName = roleRes.rows?.[0]?.name as string | undefined
    if (clerkId && roleName) {
      await syncClerkUserRole(clerkId, roleName)
    }

    return NextResponse.json({ success: true, id: newUserId })
  } catch (error) {
    console.error('[Team API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('employees', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, role_id } = body

    if (!id || !role_id) {
      return NextResponse.json({ error: 'User id and role_id are required' }, { status: 400 })
    }

    const db = getDb()

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [id],
    })
    if (!existing.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update role in BD (fuente de verdad)
    await db.execute({
      sql: `UPDATE users SET role_id = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [role_id, id],
    })

    // Keep user_roles in sync
    await db.execute({
      sql: 'DELETE FROM user_roles WHERE user_id = ?',
      args: [id],
    })
    await db.execute({
      sql: 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      args: [id, role_id],
    })

    // Sync role to Clerk metadata
    const userRow = await db.execute({
      sql: `SELECT u.clerk_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      args: [id],
    })
    const clerkId = userRow.rows?.[0]?.clerk_id as string | undefined
    const roleName = userRow.rows?.[0]?.role_name as string | undefined
    if (clerkId && roleName) {
      await syncClerkUserRole(clerkId, roleName)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
  }
}
