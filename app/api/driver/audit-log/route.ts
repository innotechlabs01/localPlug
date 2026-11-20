import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Resolve driver profile from clerk_user_id
    const driverRes = await db.execute({
      sql: `SELECT id FROM drivers WHERE clerk_user_id = ?`,
      args: [clerkId],
    })
    if (driverRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })
    }
    const driverId = Number(driverRes.rows[0].id)

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500)

    let sql = `
      SELECT
        a.id, a.assignment_id, a.order_id, a.driver_id, a.actor_type, a.actor_id,
        a.actor_name, a.action, a.from_status, a.to_status, a.reason, a.metadata,
        a.created_at,
        o.order_number, o.booking_reference
      FROM driver_audit_log a
      LEFT JOIN orders o ON o.id = a.order_id
      WHERE a.driver_id = ?
    `
    const args: (string | number)[] = [driverId]

    if (assignmentId) {
      sql += ' AND a.assignment_id = ?'
      args.push(assignmentId)
    }

    sql += ' ORDER BY a.id DESC LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql, args })
    return NextResponse.json({ audit: result.rows || [], total: (result.rows || []).length })
  } catch (err) {
    console.error('[driver audit-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
