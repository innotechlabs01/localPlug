import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('dispatch', 'view')
    if (authError) return authError

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')
    const orderId = searchParams.get('order_id')
    const driverId = searchParams.get('driver_id')
    const action = searchParams.get('action')
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500)

    let sql = `
      SELECT
        a.id, a.assignment_id, a.order_id, a.driver_id, a.actor_type, a.actor_id,
        a.actor_name, a.action, a.from_status, a.to_status, a.reason, a.metadata,
        a.created_at,
        o.order_number, o.booking_reference,
        d.name as driver_name
      FROM driver_audit_log a
      LEFT JOIN orders o ON o.id = a.order_id
      LEFT JOIN drivers d ON d.id = a.driver_id
      WHERE 1=1
    `
    const args: (string | number)[] = []

    if (assignmentId) {
      sql += ' AND a.assignment_id = ?'
      args.push(assignmentId)
    }
    if (orderId) {
      sql += ' AND a.order_id = ?'
      args.push(orderId)
    }
    if (driverId) {
      sql += ' AND a.driver_id = ?'
      args.push(driverId)
    }
    if (action && action !== 'all') {
      sql += ' AND a.action = ?'
      args.push(action)
    }

    sql += ' ORDER BY a.id DESC LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql, args })
    return NextResponse.json({ audit: result.rows || [], total: (result.rows || []).length })
  } catch (err) {
    console.error('[admin dispatch audit-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
