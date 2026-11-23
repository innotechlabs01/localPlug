import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    const hotelId = result.hotel.id

    // Today's bookings
    const today = new Date().toISOString().split('T')[0]
    const todayResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM orders WHERE hotel_id = ? AND arrival_date = ?`,
      args: [hotelId, today],
    })
    const todayBookings = Number(todayResult.rows[0].count) || 0

    // Currently checked in
    const checkedInResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM orders WHERE hotel_id = ? AND status = 'checked_in'`,
      args: [hotelId],
    })
    const currentlyStaying = Number(checkedInResult.rows[0].count) || 0

    // Total bookings
    const totalResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM orders WHERE hotel_id = ?`,
      args: [hotelId],
    })
    const totalBookings = Number(totalResult.rows[0].count) || 0

    // Completed bookings
    const completedResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM orders WHERE hotel_id = ? AND status = 'completed'`,
      args: [hotelId],
    })
    const completed = Number(completedResult.rows[0].count) || 0

    // Revenue (hotel payout from payments)
    const revenueResult = await db.execute({
      sql: `SELECT COALESCE(SUM(p.hotel_payout_cents), 0) as total
            FROM payments p
            JOIN orders o ON p.booking_reference = o.booking_reference
            WHERE o.hotel_id = ? AND p.status = 'completed'`,
      args: [hotelId],
    })
    const revenueCents = Number(revenueResult.rows[0].total) || 0
    const revenue = Math.round(revenueCents / 100)

    // Rooms count
    const roomsResult = await db.execute({
      sql: `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
        FROM rooms WHERE hotel_id = ?`,
      args: [hotelId],
    })
    const totalRooms = Number(roomsResult.rows[0].total) || 0
    const availableRooms = Number(roomsResult.rows[0].available) || 0
    const occupancy = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0

    return NextResponse.json({
      stats: {
        todayBookings,
        currentlyStaying,
        totalBookings,
        completed,
        revenue,
        totalRooms,
        availableRooms,
        occupancy,
      },
    })
  } catch (err) {
    console.error('[Hotel Metrics]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
