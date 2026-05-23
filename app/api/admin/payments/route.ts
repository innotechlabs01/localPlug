import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const kpiQueries = await Promise.all([
    db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'completed'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'failed'"),
    db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'"),
    db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments"),
    db.execute("SELECT COUNT(*) as count, COALESCE(SUM(package_price), 0) as total FROM orders WHERE assigned_to IS NOT NULL"),
  ])

  const completedAgg = kpiQueries[0].rows[0]
  const successfulCount = Number(kpiQueries[1].rows[0].count)
  const failedCount = Number(kpiQueries[2].rows[0].count)
  const pendingCount = Number(kpiQueries[3].rows[0].count)
  const totalAgg = kpiQueries[4].rows[0]
  const driverPayoutsAgg = kpiQueries[5].rows[0]

  const totalRevenue = Number(completedAgg.total) / 100
  const successfulRate = (successfulCount + failedCount) > 0
    ? ((successfulCount / (successfulCount + failedCount)) * 100).toFixed(1)
    : '0'
  const failureRate = (successfulCount + failedCount) > 0
    ? ((failedCount / (successfulCount + failedCount)) * 100).toFixed(1)
    : '0'
  const driverPayouts = Number(driverPayoutsAgg.total) / 100
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
    stripeBalance: totalRevenue - driverPayouts,
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
            o.assigned_to, o.created_at,
            d.name as driver_name, d.vehicle as driver_vehicle, d.plate as driver_plate
     FROM orders o
     LEFT JOIN drivers d ON o.assigned_to = d.id
     LEFT JOIN payments pay ON o.booking_reference = pay.booking_reference
     WHERE o.assigned_to IS NOT NULL
     ORDER BY o.created_at DESC
     LIMIT 50`
  )
  const payouts = payoutsResult.rows.map(r => ({
    id: Number(r.id),
    order_number: r.order_number as string,
    booking_reference: r.booking_reference as string,
    customer_name: r.customer_name as string,
    package_name: r.package_name as string,
    package_price: Number(r.package_price),
    currency: (r.currency as string)?.toUpperCase() || 'USD',
    payment_status: r.payment_status as string,
    driver_name: r.driver_name as string,
    driver_vehicle: r.driver_vehicle as string,
    driver_plate: r.driver_plate as string,
    created_at: r.created_at as string,
  }))

  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const avgTransaction = completedTransactions.length > 0
    ? completedTransactions.reduce((acc, t) => acc + t.amount, 0) / completedTransactions.length
    : 0
  const cardPayments = completedTransactions.reduce((acc, t) => acc + t.amount, 0)
  const refundsTotal = transactions
    .filter(t => t.status === 'refunded')
    .reduce((acc, t) => acc + t.amount, 0)

  const summary = {
    avgTransaction: Math.round(avgTransaction * 100) / 100,
    totalCardPayments: Math.round(cardPayments * 100) / 100,
    refundsTotal: Math.round(refundsTotal * 100) / 100,
    chargebacks: 0,
    pendingPayout: payouts
      .filter(p => p.payment_status === 'pending')
      .reduce((acc, p) => acc + p.package_price, 0),
    lastPayout: 6340,
  }

  return NextResponse.json({
    kpis,
    revenueByService,
    transactions,
    payouts,
    summary,
  })
}
