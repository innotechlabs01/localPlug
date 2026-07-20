import { getDb } from '@/lib/db'

export interface HotelDashboardMetrics {
  totalReservations: number
  pendingReservations: number
  confirmedReservations: number
  completedReservations: number
  cancelledReservations: number
  totalRooms: number
  availableRooms: number
  bookedRooms: number
  totalServices: number
  activeServices: number
  totalRevenue: number
  commissionEarned: number
  recentReservations: Array<{
    id: number
    customerName: string
    arrivalDate: string
    status: string
    packagePrice: number
  }>
}

/**
 * Aggregate dashboard metrics for a specific hotel.
 */
export async function getHotelDashboardMetrics(hotelId: number): Promise<HotelDashboardMetrics> {
  const db = getDb()

  // Reservation stats
  const resStats = await db.execute({
    sql: `SELECT status, COUNT(*) AS cnt
          FROM orders WHERE hotel_id = ?
          GROUP BY status`,
    args: [hotelId],
  })

  const resMap: Record<string, number> = {}
  let totalRes = 0
  for (const row of resStats.rows) {
    const cnt = Number(row.cnt)
    resMap[row.status as string] = cnt
    totalRes += cnt
  }

  // Room stats
  const roomStats = await db.execute({
    sql: `SELECT status, COUNT(*) AS cnt
          FROM rooms WHERE hotel_id = ?
          GROUP BY status`,
    args: [hotelId],
  })

  const roomMap: Record<string, number> = {}
  let totalRooms = 0
  for (const row of roomStats.rows) {
    const cnt = Number(row.cnt)
    roomMap[row.status as string] = cnt
    totalRooms += cnt
  }

  // Service stats
  const svcStats = await db.execute({
    sql: `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_count
          FROM hotel_services WHERE hotel_id = ?`,
    args: [hotelId],
  })

  const totalServices = Number(svcStats.rows[0]?.total || 0)
  const activeServices = Number(svcStats.rows[0]?.active_count || 0)

  // Revenue (paid/completed orders)
  const revResult = await db.execute({
    sql: `SELECT
            COALESCE(SUM(package_price), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN package_price ELSE 0 END), 0) AS completed_revenue
          FROM orders
          WHERE hotel_id = ?
            AND payment_status IN ('paid', 'completed')`,
    args: [hotelId],
  })

  const totalRevenue = Number(revResult.rows[0]?.total_revenue || 0)

  // Commission — fetch hotel's commission_rate
  const hotelResult = await db.execute({
    sql: `SELECT commission_rate FROM hotels WHERE id = ?`,
    args: [hotelId],
  })
  const commissionRate = Number(hotelResult.rows[0]?.commission_rate || 0)
  const commissionEarned = totalRevenue * commissionRate

  // Recent reservations (last 5)
  const recentResult = await db.execute({
    sql: `SELECT id, customer_name, arrival_date, status, package_price
          FROM orders
          WHERE hotel_id = ?
          ORDER BY created_at DESC
          LIMIT 5`,
    args: [hotelId],
  })

  const recentReservations = recentResult.rows.map((r: any) => ({
    id: r.id,
    customerName: r.customer_name || 'Unknown',
    arrivalDate: r.arrival_date || '',
    status: r.status || 'pending',
    packagePrice: r.package_price || 0,
  }))

  return {
    totalReservations: totalRes,
    pendingReservations: resMap['pending'] || 0,
    confirmedReservations: resMap['confirmed'] || 0,
    completedReservations: resMap['completed'] || 0,
    cancelledReservations: resMap['cancelled'] || 0,
    totalRooms,
    availableRooms: roomMap['available'] || 0,
    bookedRooms: roomMap['booked'] || 0,
    totalServices,
    activeServices,
    totalRevenue,
    commissionEarned,
    recentReservations,
  }
}
