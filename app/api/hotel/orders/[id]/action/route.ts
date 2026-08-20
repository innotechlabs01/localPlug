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

    if (!action || !['accept', 'check-in', 'check-out', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const db = getDb()

    // Verify order belongs to this hotel
    const orderCheck = await db.execute({
      sql: `SELECT id, room_id FROM orders WHERE id = ? AND hotel_id = ?`,
      args: [Number(id), result.hotel.id],
    })
    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const statusMap: Record<string, string> = {
      'accept': 'accepted',
      'check-in': 'checked_in',
      'check-out': 'completed',
      'cancel': 'cancelled',
    }

    const newStatus = statusMap[action]

    // Handle cancel: free room + update room_bookings
    if (action === 'cancel') {
      const orderId = Number(id)

      // Set order to cancelled
      await db.execute({
        sql: `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', status_changed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        args: [orderId],
      })

      // Cancel room booking and free room
      try {
        const rb = await db.execute({
          sql: `SELECT room_id FROM room_bookings WHERE order_id = ? AND status IN ('confirmed', 'checked_in') LIMIT 1`,
          args: [orderId],
        })
        const roomId = rb.rows[0]?.room_id as number | undefined
        if (roomId) {
          await db.execute({
            sql: `UPDATE room_bookings SET status = 'cancelled', updated_at = datetime('now') WHERE order_id = ? AND status IN ('confirmed', 'checked_in')`,
            args: [orderId],
          })
          await db.execute({
            sql: `UPDATE rooms SET status = 'available', available_from = NULL, current_order_id = NULL, updated_at = datetime('now') WHERE id = ? AND current_order_id = ?`,
            args: [roomId, orderId],
          })
        }
      } catch (roomErr) {
        console.error('[hotel cancel] room cleanup failed:', roomErr)
      }

      return NextResponse.json({ success: true, orderId, action })
    }

    await db.execute({
      sql: `UPDATE orders SET status = ?, status_changed_at = datetime('now') WHERE id = ?`,
      args: [newStatus, Number(id)],
    })

    // Update room_bookings and room availability on check-in / check-out
    try {
      if (action === 'check-in') {
        await db.execute({
          sql: `UPDATE room_bookings SET status = 'checked_in', updated_at = datetime('now') WHERE order_id = ?`,
          args: [Number(id)],
        })
        // Also mark room as occupied
        const rb = await db.execute({
          sql: `SELECT room_id, check_out FROM room_bookings WHERE order_id = ? LIMIT 1`,
          args: [Number(id)],
        })
        const roomId = rb.rows[0]?.room_id as number | undefined
        const checkOut = rb.rows[0]?.check_out as string | undefined
        if (roomId) {
          await db.execute({
            sql: `UPDATE rooms SET status = 'occupied', available_from = ?, current_order_id = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [checkOut || null, Number(id), roomId],
          })
        }
      } else if (action === 'check-out') {
        await db.execute({
          sql: `UPDATE room_bookings SET status = 'checked_out', updated_at = datetime('now') WHERE order_id = ?`,
          args: [Number(id)],
        })
        // Free the room
        const rb = await db.execute({
          sql: `SELECT room_id FROM room_bookings WHERE order_id = ? LIMIT 1`,
          args: [Number(id)],
        })
        const roomId = rb.rows[0]?.room_id as number | undefined
        if (roomId) {
          await db.execute({
            sql: `UPDATE rooms SET status = 'available', available_from = NULL, current_order_id = NULL, updated_at = datetime('now') WHERE id = ?`,
            args: [roomId],
          })
        }
      }
    } catch (roomErr) {
      console.error('[hotel action] room_bookings update failed:', roomErr)
    }

    return NextResponse.json({ success: true, orderId: Number(id), action })
  } catch (err) {
    console.error('[hotel action]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
