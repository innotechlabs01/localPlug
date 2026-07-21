import { getDb } from '@/lib/db'

export interface DriverDashboardMetrics {
  totalTrips: number
  pendingTrips: number
  activeTrips: number
  completedTrips: number
  cancelledTrips: number
  totalEarnings: number
  commissionRate: number
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

  // Earnings from completed trips
  const earningsResult = await db.execute({
    sql: `SELECT
            COALESCE(SUM(o.package_price), 0) AS total_revenue
          FROM assignments da
          JOIN orders o ON da.order_id = o.id
          WHERE da.driver_id = ?
            AND da.status = 'completed'`,
    args: [driverId],
  })

  const totalEarnings = Number(earningsResult.rows[0]?.total_revenue || 0)

  // Driver's commission rate
  const driverResult = await db.execute({
    sql: `SELECT commission_rate FROM drivers WHERE id = ?`,
    args: [driverId],
  })

  const commissionRate = Number(driverResult.rows[0]?.commission_rate || 0.30)
  const driverEarnings = totalEarnings * commissionRate
  const platformTake = totalEarnings - driverEarnings

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
    activeTrips: (tripMap['accepted'] || 0) + (tripMap['confirmed'] || 0),
    completedTrips: tripMap['completed'] || 0,
    cancelledTrips: (tripMap['cancelled'] || 0) + (tripMap['declined'] || 0),
    totalEarnings,
    commissionRate,
    driverEarnings,
    platformTake,
    recentTrips,
  }
}
