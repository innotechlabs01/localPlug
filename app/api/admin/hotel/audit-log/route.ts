import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('reservations', 'view')
    if (authError) return authError

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')
    const hotelId = searchParams.get('hotel_id')
    const action = searchParams.get('action')
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)

    let sql = `
      SELECT
        a.id, a.order_id, a.hotel_id, a.room_id, a.actor_type, a.actor_id,
        a.actor_name, a.action, a.from_status, a.to_status, a.reason, a.metadata,
        a.created_at,
        o.order_number, o.booking_reference,
        h.name as hotel_name,
        r.name as room_name
      FROM hotel_audit_log a
      LEFT JOIN orders o ON o.id = a.order_id
      LEFT JOIN hotels h ON h.id = a.hotel_id
      LEFT JOIN rooms r ON r.id = a.room_id
      WHERE 1=1
    `
    const args: (string | number)[] = []

    if (orderId) {
      sql += ' AND a.order_id = ?'
      args.push(orderId)
    }
    if (hotelId) {
      sql += ' AND a.hotel_id = ?'
      args.push(hotelId)
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
    console.error('[admin hotel audit-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
