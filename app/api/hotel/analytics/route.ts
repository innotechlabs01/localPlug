import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getHotelFromSession } from '@/lib/hotel/auth'

export const dynamic = 'force-dynamic'

/**
 * Hotel analytics — occupancy, revenue, and reservation resolution stats
 * for the authenticated hotel.
 */
export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const hotelId = result.hotel.id
    const db = getDb()

    const [resAgg, revenueAgg, monthly, roomStats, services] = await Promise.all([
      db.execute({
        sql: `SELECT
                COUNT(*) AS total_orders,
                COALESCE(SUM(status = 'completed'), 0) AS completed,
                COALESCE(SUM(status = 'cancelled'), 0) AS cancelled,
                COALESCE(SUM(status IN ('accepted', 'checked_in', 'completed')), 0) AS accepted
              FROM orders WHERE hotel_id = ?`,
        args: [hotelId],
      }),
      db.execute({
        sql: `SELECT COALESCE(SUM(package_price), 0) AS revenue FROM orders
              WHERE hotel_id = ? AND status = 'completed'`,
        args: [hotelId],
      }),
      db.execute({
        sql: `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count,
                     COALESCE(SUM(package_price), 0) AS revenue
              FROM orders WHERE hotel_id = ? AND status != 'cancelled'
              GROUP BY month ORDER BY month`,
        args: [hotelId],
      }),
      db.execute({
        sql: `SELECT
                COUNT(*) AS total_rooms,
                COALESCE(SUM(status = 'occupied'), 0) AS occupied
              FROM rooms WHERE hotel_id = ?`,
        args: [hotelId],
      }),
      db.execute({
        sql: `SELECT name, base_price, active FROM services WHERE hotel_id = ? AND active = 1 ORDER BY name`,
        args: [hotelId],
      }),
    ])

    const totalOrders = Number(resAgg.rows[0]?.total_orders || 0)
    const completedOrders = Number(resAgg.rows[0]?.completed || 0)
    const cancelledOrders = Number(resAgg.rows[0]?.cancelled || 0)
    const acceptedOrders = Number(resAgg.rows[0]?.accepted || 0)
    const totalRevenue = Number(revenueAgg.rows[0]?.revenue || 0)

    const totalRooms = Number(roomStats.rows[0]?.total_rooms || 0)
    const occupiedRooms = Number(roomStats.rows[0]?.occupied || 0)
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    return NextResponse.json({
      analytics: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        acceptedOrders,
        acceptanceRate: totalOrders > 0 ? Math.round((acceptedOrders / totalOrders) * 100) : 0,
        totalRevenue,
        avgOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
        occupancyRate,
        totalRooms,
        occupiedRooms,
        byMonth: monthly.rows,
        services: services.rows,
      },
    })
  } catch (err) {
    console.error('[hotel analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}