import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requirePermission('reservations', 'update')
    if (authError) return authError

    const { id: reservationId } = await params
    
    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 })
    }

    const body = await req.json()
    const { driverId } = body

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID required' }, { status: 400 })
    }

    const db = getDb()

    // Verify driver exists and is available
    const driverCheck = await db.execute({
      sql: `SELECT * FROM drivers WHERE id = ? AND status = 'available'`,
      args: [driverId]
    })

    if (!driverCheck.rows || driverCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found or not available' }, { status: 404 })
    }

    // Verify reservation exists
    const reservationCheck = await db.execute({
      sql: `SELECT * FROM orders WHERE id = ?`,
      args: [reservationId]
    })

    if (!reservationCheck.rows || reservationCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Update order with driver assignment
    const now = new Date().toISOString()
    await db.execute({
      sql: `UPDATE orders 
            SET assigned_to = ?, 
                assigned_at = ?,
                dispatch_status = 'assigned',
                status = 'assigned',
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [driverId, now, reservationId]
    })

    // Get updated reservation info for response
    const updated = await db.execute({
      sql: `SELECT o.*, d.name as driver_name, d.phone as driver_phone
            FROM orders o
            LEFT JOIN drivers d ON o.assigned_to = d.id
            WHERE o.id = ?`,
      args: [reservationId]
    })

    return NextResponse.json({ 
      success: true,
      message: 'Driver assigned successfully',
      reservation: updated.rows?.[0]
    })
  } catch (error) {
    console.error('[Assign Driver API] error:', error)
    return NextResponse.json({ error: 'Failed to assign driver' }, { status: 500 })
  }
}
