import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const db = getDb()

  const result = await db.execute(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.status,
      u.last_login_at,
      u.created_at,
      GROUP_CONCAT(r.name) as roles,
      (SELECT COUNT(*) FROM orders WHERE assigned_to = u.id) as orders_assigned
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
    ORDER BY u.name
  `)

  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json({ success: true, id: newUserId })
  } catch (error) {
    console.error('[Team API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
