import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getTrmRate } from '@/lib/trm'
import { requirePermission } from '@/lib/admin/permissions'
import { getDriverBaseTripCompensation, getDriverParkingReimbursement } from '@/lib/settings'

export async function GET() {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError
  const db = getDb()
  const trmRate = await getTrmRate()

    const kpiQueries = await Promise.all([
      db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"),
      db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'completed'"),
      db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'failed'"),
      db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'"),
      db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments"),
      db.execute("SELECT COUNT(*) as count FROM orders WHERE assigned_to IS NOT NULL"),
    ])

  const completedAgg = kpiQueries[0].rows[0]
  const successfulCount = Number(kpiQueries[1].rows[0].count)
  const failedCount = Number(kpiQueries[2].rows[0].count)
  const pendingCount = Number(kpiQueries[3].rows[0].count)
  const totalAgg = kpiQueries[4].rows[0]

  const totalRevenue = Number(completedAgg.total) / 100
  const successfulRate = (successfulCount + failedCount) > 0
    ? ((successfulCount / (successfulCount + failedCount)) * 100).toFixed(1)
    : '0'
  const failureRate = (successfulCount + failedCount) > 0
    ? ((failedCount / (successfulCount + failedCount)) * 100).toFixed(1)
    : '0'

  // Driver payouts: per-order base compensation + parking reimbursement (only for completed trips)
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
  const driverPayoutsPct = totalRevenue > 0 ? ((driverPayouts / totalRevenue) * 100).toFixed(0) : '0'

  const kpis = {
    totalRevenue,
    successfulCount,
    failedCount,
    pendingCount,
    successfulRate,
    failureRate,
    driverPayouts,
    driverPayoutsPct,
    platformBalance: totalRevenue - driverPayouts,
  }

  const revenueResult = await db.execute(
    "SELECT package_name, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE status = 'completed' GROUP BY package_name ORDER BY total DESC"
  )
  const grandTotal = revenueResult.rows.reduce((acc, r) => acc + Number(r.total), 0)
  const revenueByService = revenueResult.rows.map(r => ({
    package_name: r.package_name as string,
    amount: Number(r.total) / 100,
    percentage: grandTotal > 0 ? ((Number(r.total) / grandTotal) * 100).toFixed(1) : '0',
    count: Number(r.count),
  }))

  const transactionsResult = await db.execute(
    "SELECT * FROM payments ORDER BY created_at DESC LIMIT 50"
  )
  const transactions = transactionsResult.rows.map(r => ({
    booking_reference: r.booking_reference as string,
    package_id: r.package_id as string,
    package_name: r.package_name as string,
    amount: Number(r.amount) / 100,
    currency: (r.currency as string)?.toUpperCase() || 'USD',
    status: r.status as string,
    customer_name: r.customer_name as string,
    customer_email: r.customer_email as string,
    customer_phone: r.customer_phone as string,
    created_at: r.created_at as string,
    error_message: r.error_message as string | null,
  }))

  const payoutsResult = await db.execute(
    `SELECT o.id, o.order_number, o.booking_reference, o.customer_name, o.package_name,
            o.package_price, o.currency, COALESCE(pay.status, o.payment_status) as payment_status,
            o.assigned_to, o.created_at, o.airport_parking, o.parking_proof_url, o.parking_proof_status, o.dispatch_status,
            d.name as driver_name, d.vehicle as driver_vehicle, d.plate as driver_plate,
            d.total_trips as driver_total_trips
      FROM orders o
     LEFT JOIN drivers d ON o.assigned_to = d.id
     LEFT JOIN payments pay ON o.booking_reference = pay.booking_reference
     WHERE o.assigned_to IS NOT NULL
     ORDER BY o.created_at DESC
     LIMIT 50`
  )
  const payouts = payoutsResult.rows.map(r => {
    const grossRevenue = Number(r.package_price)
    const isCompleted = r.dispatch_status === 'completed'
    const parked = Number(r.airport_parking) === 1 && r.parking_proof_status === 'approved'
    const driverPaymentUSD = isCompleted
      ? Math.round((parked ? base + reinf : base) * 100) / 100
      : 0
    const driverPaymentCOP = Math.round(driverPaymentUSD * trmRate)
    return {
      id: Number(r.id),
      order_number: r.order_number as string,
      booking_reference: r.booking_reference as string,
      customer_name: r.customer_name as string,
      package_name: r.package_name as string,
      package_price: grossRevenue,
      currency: (r.currency as string)?.toUpperCase() || 'USD',
      payment_status: r.payment_status as string,
      driver_name: r.driver_name as string,
      driver_vehicle: r.driver_vehicle as string,
      driver_plate: r.driver_plate as string,
      driver_total_trips: Number(r.driver_total_trips || 0),
      driver_payment_cop: driverPaymentCOP,
      driver_payment_usd: driverPaymentUSD,
      parking_proof_url: (r.parking_proof_url as string) || null,
      parking_proof_status: (r.parking_proof_status as string) || 'pending',
      gross_revenue: grossRevenue,
      created_at: r.created_at as string,
    }
  })

  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const avgTransaction = completedTransactions.length > 0
    ? completedTransactions.reduce((acc, t) => acc + t.amount, 0) / completedTransactions.length
    : 0
  const cardPayments = completedTransactions.reduce((acc, t) => acc + t.amount, 0)
  const refundsTotal = transactions
    .filter(t => t.status === 'refunded')
    .reduce((acc, t) => acc + t.amount, 0)
  const lastPayout = payouts.length > 0 ? payouts[0].driver_payment_usd : 0

  const summary = {
    avgTransaction: Math.round(avgTransaction * 100) / 100,
    totalCardPayments: Math.round(cardPayments * 100) / 100,
    refundsTotal: Math.round(refundsTotal * 100) / 100,
    chargebacks: 0,
    pendingPayout: payouts
      .filter(p => p.payment_status === 'pending')
      .reduce((acc, p) => acc + p.driver_payment_usd, 0),
    lastPayout,
  }

  return NextResponse.json({
    kpis,
    revenueByService,
    transactions,
    payouts,
    summary,
    trm: {
      rate: trmRate,
      fetchedAt: new Date().toISOString(),
      source: 'exchangerate-api.com',
    },
  })
}
