import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { getDriverBaseTripCompensation, getDriverParkingReimbursement } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/**
 * Consolidated detailed income summary for the admin dashboard.
 * Revenue is derived from real completed payments (whole units). Payouts follow
 * the same per-order compensation model used by /api/admin/payments.
 */
export async function GET() {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError
  const db = getDb()

  const [completed, failed, pending, total] = await Promise.all([
    db.execute("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'completed'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'failed'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'completed'"),
  ])

  const totalRevenue = Number(completed.rows[0]?.total || 0)
  const successfulPayments = Number(total.rows[0]?.count || 0)
  const failedPayments = Number(failed.rows[0]?.count || 0)
  const pendingPayments = Number(pending.rows[0]?.count || 0)
  const successRate = successfulPayments + failedPayments > 0
    ? ((successfulPayments / (successfulPayments + failedPayments)) * 100).toFixed(1)
    : '0'

  // Driver payouts (same model as payments API: base + parking reimbursement, completed only)
  const [base, reinf] = await Promise.all([
    getDriverBaseTripCompensation(),
    getDriverParkingReimbursement(),
  ])
  const payoutAgg = await db.execute({
    sql: `SELECT
            COUNT(*) AS cnt,
            COALESCE(SUM(CASE WHEN o.airport_parking = 1 AND o.parking_proof_status = 'approved' THEN 1 ELSE 0 END), 0) AS parked
          FROM orders o
          JOIN assignments a ON a.order_id = o.id
          WHERE o.assigned_to IS NOT NULL AND a.status = 'completed'`,
    args: [],
  })
  const completedAssigned = Number(payoutAgg.rows[0]?.cnt || 0)
  const parkedAssigned = Number(payoutAgg.rows[0]?.parked || 0)
  const driverPayouts = Math.round((completedAssigned * base + parkedAssigned * reinf) * 100) / 100

  const platformTake = Math.round((totalRevenue - driverPayouts) * 100) / 100
  const driverPayoutsPct = totalRevenue > 0 ? ((driverPayouts / totalRevenue) * 100).toFixed(1) : '0'
  const platformTakePct = totalRevenue > 0 ? ((platformTake / totalRevenue) * 100).toFixed(1) : '0'

  // Revenue by source from orders (whole-unit columns)
  const sourceAgg = await db.execute(
    `SELECT
       COALESCE(SUM(o.package_price), 0) AS base_services,
       COALESCE(SUM(o.return_trip_charge), 0) AS return_transport,
       COALESCE(SUM(CASE WHEN o.is_hotel_booking = 1 THEN o.package_price ELSE 0 END), 0) AS hotel
     FROM orders o
     WHERE o.payment_status = 'paid' AND o.status != 'cancelled'`,
  )
  const baseServices = Number(sourceAgg.rows[0]?.base_services || 0)
  const returnTransport = Number(sourceAgg.rows[0]?.return_transport || 0)
  const hotelAccommodation = Number(sourceAgg.rows[0]?.hotel || 0)

  // Monthly revenue
  const monthly = await db.execute(
    `SELECT strftime('%Y-%m', created_at) AS month, COALESCE(SUM(amount), 0) AS revenue
     FROM payments WHERE status = 'completed'
     GROUP BY month ORDER BY month`,
  )
  const monthlyRevenue = monthly.rows.map(r => ({
    month: r.month as string,
    revenue: Number(r.revenue),
  }))

  // Per-driver payout breakdown
  const payoutsResult = await db.execute(
    `SELECT d.name AS driver_name, COUNT(*) AS trips,
            COALESCE(SUM(CASE WHEN o.airport_parking = 1 AND o.parking_proof_status = 'approved' THEN 1 ELSE 0 END), 0) AS parked
     FROM orders o
     JOIN assignments a ON a.order_id = o.id
     JOIN drivers d ON o.assigned_to = d.id
     WHERE a.status = 'completed'
     GROUP BY d.id, d.name
     ORDER BY trips DESC`,
  )
  const payoutBreakdown = payoutsResult.rows.map(r => {
    const trips = Number(r.trips || 0)
    const parked = Number(r.parked || 0)
    const payout = Math.round((trips * base + parked * reinf) * 100) / 100
    return {
      driver_name: r.driver_name as string,
      trips,
      payout,
    }
  })

  // Service popularity (revenue by package)
  const services = await db.execute(
    `SELECT o.package_name AS name, COUNT(*) AS count, COALESCE(SUM(o.package_price), 0) AS revenue
     FROM orders o WHERE o.payment_status = 'paid' AND o.status != 'cancelled' AND o.package_name IS NOT NULL
     GROUP BY o.package_name ORDER BY revenue DESC LIMIT 10`,
  )
  const servicePopularity = services.rows.map(r => ({
    name: r.name as string,
    count: Number(r.count),
    revenue: Number(r.revenue),
  }))

  return NextResponse.json({
    summary: {
      totalRevenue,
      baseServices,
      returnTransport,
      hotelAccommodation,
      driverPayouts,
      driverPayoutsPct,
      platformTake,
      platformTakePct,
      successfulPayments,
      failedPayments,
      pendingPayments,
      successRate,
    },
    monthlyRevenue,
    payoutBreakdown,
    servicePopularity,
  })
}