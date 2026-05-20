import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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
