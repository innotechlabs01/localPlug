import { getDb } from '@/lib/db'
import { getDriverBaseTripCompensation, getDriverParkingReimbursement } from '@/lib/settings'

export interface DriverDashboardMetrics {
  totalTrips: number
  pendingTrips: number
  activeTrips: number
  completedTrips: number
  cancelledTrips: number
   totalEarnings: number
  commissionRate: number
  tripCompensation: number
  driverEarnings: number
  platformTake: number
  recentTrips: Array<{
    id: number
    orderId: number
    customerName: string
    status: string
    createdAt: string
  }>
}

/**
 * Aggregate dashboard metrics for a specific driver.
 */
export async function getDriverDashboardMetrics(driverId: number): Promise<DriverDashboardMetrics> {
  const db = getDb()

  // Trip stats from assignments
  const tripStats = await db.execute({
    sql: `SELECT status, COUNT(*) AS cnt
          FROM assignments
          WHERE driver_id = ?
          GROUP BY status`,
    args: [driverId],
  })

  const tripMap: Record<string, number> = {}
  let totalTrips = 0
  for (const row of tripStats.rows) {
    const cnt = Number(row.cnt)
    tripMap[row.status as string] = cnt
    totalTrips += cnt
  }

  // Earnings from completed trips (per-order: base + parking reimbursement when approved)
  const [base, reinf] = await Promise.all([
    getDriverBaseTripCompensation(),
    getDriverParkingReimbursement(),
  ])

  const compResult = await db.execute({
    sql: `SELECT
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN o.airport_parking = 1 AND o.parking_proof_status = 'approved' THEN 1 ELSE 0 END), 0) AS parked
          FROM assignments da
          JOIN orders o ON da.order_id = o.id
          WHERE da.driver_id = ?
            AND da.status = 'completed'`,
    args: [driverId],
  })

  const completedTrips = Number(compResult.rows[0]?.total || 0)
  const parkedTrips = Number(compResult.rows[0]?.parked || 0)
  const driverEarnings = Math.round((completedTrips * base + parkedTrips * reinf) * 100) / 100

  // Gross revenue of completed trips (for platform-take display)
  const grossResult = await db.execute({
    sql: `SELECT COALESCE(SUM(o.package_price), 0) AS total_revenue
          FROM assignments da
          JOIN orders o ON da.order_id = o.id
          WHERE da.driver_id = ? AND da.status = 'completed'`,
    args: [driverId],
  })
  const totalEarnings = Number(grossResult.rows[0]?.total_revenue || 0)

  // Driver's commission rate (legacy field, kept for display/back-compat)
  const driverResult = await db.execute({
    sql: `SELECT commission_rate FROM drivers WHERE id = ?`,
    args: [driverId],
  })

  const commissionRate = Number(driverResult.rows[0]?.commission_rate || 0.30)
  const tripCompensation = base
  const platformTake = Math.round((totalEarnings - driverEarnings) * 100) / 100

  // Recent trips (last 5)
  const recentResult = await db.execute({
    sql: `SELECT da.id, da.order_id, da.status, da.created_at,
                 o.customer_name
          FROM assignments da
          JOIN orders o ON da.order_id = o.id
          WHERE da.driver_id = ?
          ORDER BY da.created_at DESC
          LIMIT 5`,
    args: [driverId],
  })

  const recentTrips = recentResult.rows.map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    customerName: r.customer_name || 'Unknown',
    status: r.status || 'pending',
    createdAt: r.created_at || new Date().toISOString(),
  }))

  return {
    totalTrips,
    pendingTrips: (tripMap['pending_acceptance'] || 0) + (tripMap['offered'] || 0),
    activeTrips: (tripMap['accepted'] || 0) + (tripMap['confirmed'] || 0) + (tripMap['en_route'] || 0),
    completedTrips,
    cancelledTrips: (tripMap['cancelled'] || 0) + (tripMap['declined'] || 0),
    totalEarnings,
    commissionRate,
    tripCompensation,
    driverEarnings,
    platformTake,
    recentTrips,
  }
}
