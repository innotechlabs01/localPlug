import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getHotelFromSession } from '@/lib/hotel/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body

    if (!action || !['accept', 'check-in', 'check-out'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const db = getDb()

    // Verify order belongs to this hotel
    const orderCheck = await db.execute({
      sql: `SELECT id FROM orders WHERE id = ? AND hotel_id = ?`,
      args: [Number(id), result.hotel.id],
    })
    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const statusMap: Record<string, string> = {
      'accept': 'accepted',
      'check-in': 'checked_in',
      'check-out': 'completed',
    }

    const newStatus = statusMap[action]

    await db.execute({
      sql: `UPDATE orders SET status = ?, status_changed_at = datetime('now') WHERE id = ?`,
      args: [newStatus, Number(id)],
    })

    return NextResponse.json({ success: true, orderId: Number(id), action })
  } catch (err) {
    console.error('[hotel action]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
