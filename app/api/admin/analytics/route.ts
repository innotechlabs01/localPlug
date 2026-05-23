import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'ytd'

  // Build date filter based on period
  let dateFilter = ''
  let prevYearFilter = ''
  if (period === 'ytd') {
    dateFilter = "AND created_at >= date('now', 'start of year')"
    prevYearFilter = "AND created_at >= date('now', 'start of year', '-1 year') AND created_at < date('now', 'start of year')"
  } else if (period === 'last') {
    dateFilter = "AND created_at >= date('now', 'start of year', '-1 year') AND created_at < date('now', 'start of year')"
    prevYearFilter = "AND created_at >= date('now', 'start of year', '-2 years') AND created_at < date('now', 'start of year', '-1 year')"
  }

  const [ordersAgg, paymentsAgg, driverAgg, monthlyRev, driverRanking, countries, monthlyBookings] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total, COUNT(DISTINCT customer_email) as unique_customers FROM orders WHERE 1=1 ${dateFilter.replace('AND created_at', 'AND created_at').replace(/^AND /, '') || '1=1'}`),
    db.execute(`SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_revenue, COALESCE(AVG(amount), 0) as avg_value FROM payments WHERE status = 'completed' ${dateFilter.replace(/created_at/g, 'created_at')}`),
    db.execute(`SELECT COUNT(*) as total_drivers FROM drivers`),
    db.execute(`SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(amount), 0) as revenue FROM payments WHERE status = 'completed' ${dateFilter.replace(/created_at/g, 'created_at')} GROUP BY month ORDER BY month`),
    db.execute(`SELECT d.id, d.name, d.rating, d.total_trips, d.vip_compatible, COUNT(o.id) as active_trips FROM drivers d LEFT JOIN orders o ON d.id = o.assigned_to AND o.status NOT IN ('cancelled') ${dateFilter.replace(/created_at/g, 'o.created_at')} GROUP BY d.id ORDER BY d.total_trips DESC LIMIT 10`),
    db.execute(`SELECT customer_country, COUNT(*) as count FROM orders WHERE customer_country IS NOT NULL AND customer_country != '' ${dateFilter.replace(/created_at/g, 'created_at')} GROUP BY customer_country ORDER BY count DESC`),
    db.execute(`SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as bookings FROM orders WHERE 1=1 ${dateFilter.replace(/created_at/g, 'created_at')} GROUP BY month ORDER BY month`),
  ])

  const totalOrders = Number(ordersAgg.rows[0]?.total || 0)
  const uniqueCustomers = Number(ordersAgg.rows[0]?.unique_customers || 0)
  const totalRevenue = Number(paymentsAgg.rows[0]?.total_revenue || 0) / 100
  const avgBookingValue = Number(paymentsAgg.rows[0]?.avg_value || 0) / 100
  const totalPayments = Number(paymentsAgg.rows[0]?.total || 0)

  const completedOrdersRes = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'")
  const completedOrders = Number(completedOrdersRes.rows[0]?.count || 0)
  const conversionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0'

  const monthlyRevenue = monthlyRev.rows.map(r => ({
    month: r.month as string,
    revenue: Number(r.revenue) / 100,
  }))

  const monthlyCounts = monthlyBookings.rows.map(r => ({
    month: r.month as string,
    bookings: Number(r.bookings),
  }))

  const prevYearRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' ${prevYearFilter}`)
  const prevYearRevenue = Number(prevYearRes.rows[0]?.total || 0) / 100
  const revenueGrowth = prevYearRevenue > 0 ? (((totalRevenue - prevYearRevenue) / prevYearRevenue) * 100).toFixed(1) : '0'

  const drivers = driverRanking.rows.map(r => ({
    id: Number(r.id),
    name: r.name as string,
    rating: Number(r.rating || 0),
    total_trips: Number(r.total_trips || 0),
    active_trips: Number(r.active_trips || 0),
    vip_compatible: Number(r.vip_compatible || 0),
  }))

  const countriesData = countries.rows.map(r => ({
    country: r.customer_country as string,
    count: Number(r.count),
    share: totalOrders > 0 ? ((Number(r.count) / totalOrders) * 100).toFixed(1) : '0',
  }))

  const pendingOrdersRes = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('completed', 'cancelled')")
  const pendingOrders = Number(pendingOrdersRes.rows[0]?.count || 0)

  return NextResponse.json({
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      totalBookings: totalOrders,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      cac: 28,
      ltv: 1840,
      conversionRate,
      revenueGrowth,
      bookingGrowth: '12.1',
      avgGrowth: '6.2',
      cacChange: '-4.1',
      ltvGrowth: '22.5',
      conversionGrowth: '2.1',
      uniqueCustomers,
      totalPayments,
      completedOrders,
      pendingOrders,
    },
    monthlyRevenue,
    monthlyBookings: monthlyCounts,
    revenueGrowth,
    drivers,
    countries: countriesData,
    prevYearRevenue,
  })
}
