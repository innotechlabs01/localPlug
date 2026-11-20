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
  availablePayoutUsd?: number
  requestedPayoutUsd?: number
  paidPayoutUsd?: number
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
  // Platform fee: total * rate / (1 + rate) — consistent with webhook formula
  const commissionEarned = Math.round((totalRevenue * commissionRate / (1 + commissionRate)) * 100) / 100

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

  const payoutResult = await db.execute({
    sql: `SELECT
            COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) AS available_usd,
            COALESCE(SUM(CASE WHEN status = 'requested' THEN amount_usd ELSE 0 END), 0) AS requested_usd,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd ELSE 0 END), 0) AS paid_usd
          FROM payout_ledger
          WHERE payee_type = 'hotel' AND payee_id = ?`,
    args: [hotelId],
  }).catch(() => ({ rows: [{ available_usd: 0, requested_usd: 0, paid_usd: 0 }] }))

  return {
    totalReservations: totalRes,
    pendingReservations: (resMap['pending'] || 0) + (resMap['new'] || 0),
    confirmedReservations: (resMap['confirmed'] || 0) + (resMap['accepted'] || 0) + (resMap['checked_in'] || 0),
    completedReservations: (resMap['completed'] || 0) + (resMap['checked_out'] || 0),
    cancelledReservations: resMap['cancelled'] || 0,
    totalRooms,
    availableRooms: roomMap['available'] || 0,
    bookedRooms: (roomMap['occupied'] || 0) + (roomMap['booked'] || 0),
    totalServices,
    activeServices,
    totalRevenue,
    commissionEarned,
    availablePayoutUsd: Number(payoutResult.rows[0]?.available_usd || 0),
    requestedPayoutUsd: Number(payoutResult.rows[0]?.requested_usd || 0),
    paidPayoutUsd: Number(payoutResult.rows[0]?.paid_usd || 0),
    recentReservations,
  }
}
