import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db/migrate-auto'

export type RoleName = 'admin' | 'manager' | 'concierge' | 'viewer'

async function autoRegisterUser(clerkId: string): Promise<{ roleId: number; roleName: string } | null> {
  const db = getDb()

  const roles = await db.execute("SELECT id, name FROM roles WHERE name = 'viewer'")
  if (!roles.rows.length) return null

  const viewerRoleId = roles.rows[0].id as number
  const now = new Date().toISOString()

  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
          VALUES (?, ?, ?, '', ?, 'active', ?, ?)`,
    args: [clerkId, 'New User', '', viewerRoleId, now, now],
  })

  if (Number(result.lastInsertRowid) > 0) {
    const userId = Number(result.lastInsertRowid)
    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
      args: [userId, viewerRoleId],
    })
    console.log(`[Auth] Auto-registered user ${clerkId} as viewer`)
  }

  return { roleId: viewerRoleId, roleName: 'viewer' }
}

export async function requireRole(allowedRoles: RoleName[]) {
  await ensureSchema()

  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  let user = await db.execute({
    sql: `SELECT u.id, r.name as role_name
          FROM users u LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  if (!user.rows.length) {
    const registered = await autoRegisterUser(clerkId)
    if (!registered) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
    user = await db.execute({
      sql: `SELECT u.id, r.name as role_name
            FROM users u LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.clerk_id = ? AND u.status = 'active'`,
      args: [clerkId],
    })
    if (!user.rows.length) {
      return NextResponse.json({ error: 'User not found after registration' }, { status: 500 })
    }
  }

  const roleName = user.rows[0].role_name as string
  if (!allowedRoles.includes(roleName as RoleName)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
