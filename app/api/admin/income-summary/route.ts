import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

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

  // Driver/hotel payouts — real liabilities from the payout ledger
  const ledgerPayouts = await db.execute({
    sql: `SELECT
            COALESCE(SUM(CASE WHEN payee_type = 'driver' THEN amount_usd ELSE 0 END), 0) AS driver,
            COALESCE(SUM(CASE WHEN payee_type = 'hotel' THEN amount_usd ELSE 0 END), 0) AS hotel
          FROM payout_ledger WHERE status != 'written_off'`,
    args: [],
  })
  const driverPayouts = Math.round(Number(ledgerPayouts.rows[0]?.driver || 0) * 100) / 100
  const hotelPayouts = Math.round(Number(ledgerPayouts.rows[0]?.hotel || 0) * 100) / 100

  // Refunds / disputes (write-offs and pre-milestone returns)
  const refundsAgg = await db.execute({
    sql: `SELECT COALESCE(SUM(amount_usd), 0) AS total FROM refunds_disputes`,
    args: [],
  })
  const refundsTotal = Math.round(Number(refundsAgg.rows[0]?.total || 0) * 100) / 100

  // Precise net platform margin: gross − driver − hotel − refunds.
  const grossRevenue = totalRevenue
  const platformTake = Math.round((grossRevenue - driverPayouts - hotelPayouts - refundsTotal) * 100) / 100
  const driverPayoutsPct = totalRevenue > 0 ? ((driverPayouts / totalRevenue) * 100).toFixed(1) : '0'
  const hotelPayoutsPct = totalRevenue > 0 ? ((hotelPayouts / totalRevenue) * 100).toFixed(1) : '0'
  const refundsPct = totalRevenue > 0 ? ((refundsTotal / totalRevenue) * 100).toFixed(1) : '0'
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

  // Per-driver payout breakdown from the ledger
  const payoutsResult = await db.execute({
    sql: `SELECT d.name AS driver_name, COUNT(pl.id) AS trips, COALESCE(SUM(pl.amount_usd), 0) AS payout
          FROM payout_ledger pl
          JOIN drivers d ON d.id = pl.payee_id
          WHERE pl.payee_type = 'driver' AND pl.status != 'written_off'
          GROUP BY d.id, d.name
          ORDER BY payout DESC`,
    args: [],
  })
  const payoutBreakdown = payoutsResult.rows.map(r => ({
    driver_name: r.driver_name as string,
    trips: Number(r.trips || 0),
    payout: Math.round(Number(r.payout || 0) * 100) / 100,
  }))

  // Per-hotel payout breakdown from the ledger
  const hotelPayoutsResult = await db.execute({
    sql: `SELECT h.name AS hotel_name, COUNT(pl.id) AS bookings, COALESCE(SUM(pl.amount_usd), 0) AS payout
          FROM payout_ledger pl
          JOIN hotels h ON h.id = pl.payee_id
          WHERE pl.payee_type = 'hotel' AND pl.status != 'written_off'
          GROUP BY h.id, h.name
          ORDER BY payout DESC`,
    args: [],
  })
  const hotelPayoutBreakdown = hotelPayoutsResult.rows.map(r => ({
    hotel_name: r.hotel_name as string,
    bookings: Number(r.bookings || 0),
    payout: Math.round(Number(r.payout || 0) * 100) / 100,
  }))

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
      hotelPayouts,
      refundsTotal,
      driverPayoutsPct,
      hotelPayoutsPct,
      refundsPct,
      platformTake,
      platformTakePct,
      successfulPayments,
      failedPayments,
      pendingPayments,
      successRate,
    },
    monthlyRevenue,
    payoutBreakdown,
    hotelPayoutBreakdown,
    servicePopularity,
  })
}