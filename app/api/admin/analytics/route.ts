import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(req: Request) {
  const authError = await requirePermission('analytics', 'view')
  if (authError) return authError
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'ytd'

  // Build date filter SQL fragments based on period (hardcoded enum values, not user input)
  let ordersFilter = ''
  let paymentsFilter = ''
  let prevYearOrdersFilter = ''
  let prevYearPaymentsFilter = ''
  if (period === 'ytd') {
    ordersFilter = "AND o.created_at >= date('now', 'start of year')"
    paymentsFilter = "AND p.created_at >= date('now', 'start of year')"
    prevYearOrdersFilter = "AND o.created_at >= date('now', 'start of year', '-1 year') AND o.created_at < date('now', 'start of year')"
    prevYearPaymentsFilter = "AND p.created_at >= date('now', 'start of year', '-1 year') AND p.created_at < date('now', 'start of year')"
  } else if (period === 'last') {
    ordersFilter = "AND o.created_at >= date('now', 'start of year', '-1 year') AND o.created_at < date('now', 'start of year')"
    paymentsFilter = "AND p.created_at >= date('now', 'start of year', '-1 year') AND p.created_at < date('now', 'start of year')"
    prevYearOrdersFilter = "AND o.created_at >= date('now', 'start of year', '-2 years') AND o.created_at < date('now', 'start of year', '-1 year')"
    prevYearPaymentsFilter = "AND p.created_at >= date('now', 'start of year', '-2 years') AND p.created_at < date('now', 'start of year', '-1 year')"
  }

  const [ordersAgg, paymentsAgg, driverAgg, monthlyRev, driverRanking, countries, monthlyBookings, servicePopularity, completedOrdersRes, pendingOrdersRes] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total, COUNT(DISTINCT o.customer_email) as unique_customers FROM orders o WHERE o.status != 'cancelled' ${ordersFilter}`),
    db.execute(`SELECT COUNT(*) as total, COALESCE(SUM(p.amount), 0) as total_revenue, COALESCE(AVG(p.amount), 0) as avg_value FROM payments p WHERE p.status = 'completed' ${paymentsFilter}`),
    db.execute(`SELECT COUNT(*) as total_drivers FROM drivers`),
    db.execute(`SELECT strftime('%Y-%m', p.created_at) as month, COALESCE(SUM(p.amount), 0) as revenue FROM payments p WHERE p.status = 'completed' ${paymentsFilter} GROUP BY month ORDER BY month`),
    db.execute(`SELECT d.id, d.name, d.rating, d.total_trips, d.vip_compatible, COUNT(o.id) as active_trips FROM drivers d LEFT JOIN orders o ON d.id = o.assigned_to AND o.status NOT IN ('cancelled') ${ordersFilter} GROUP BY d.id ORDER BY d.total_trips DESC LIMIT 10`),
    db.execute(`SELECT o.customer_country, COUNT(*) as count FROM orders o WHERE o.customer_country IS NOT NULL AND o.customer_country != '' AND o.status != 'cancelled' ${ordersFilter} GROUP BY o.customer_country ORDER BY count DESC`),
    db.execute(`SELECT strftime('%Y-%m', o.created_at) as month, COUNT(*) as bookings FROM orders o WHERE o.status != 'cancelled' ${ordersFilter} GROUP BY month ORDER BY month`),
    db.execute(`SELECT o.package_name, COUNT(*) as count, COALESCE(SUM(o.package_price), 0) as revenue FROM orders o WHERE o.status != 'cancelled' ${ordersFilter} GROUP BY o.package_name ORDER BY count DESC LIMIT 10`),
    db.execute(`SELECT COUNT(*) as count FROM orders o WHERE o.status = 'completed' ${ordersFilter}`),
    db.execute(`SELECT COUNT(*) as count FROM orders o WHERE o.status NOT IN ('completed', 'cancelled') ${ordersFilter}`),
  ])

  const totalOrders = Number(ordersAgg.rows[0]?.total || 0)
  const uniqueCustomers = Number(ordersAgg.rows[0]?.unique_customers || 0)
  const totalRevenue = Number(paymentsAgg.rows[0]?.total_revenue || 0) / 100
  const avgBookingValue = Number(paymentsAgg.rows[0]?.avg_value || 0) / 100
  const totalPayments = Number(paymentsAgg.rows[0]?.total || 0)

  const completedOrders = Number(completedOrdersRes.rows[0]?.count || 0)
  const pendingOrders = Number(pendingOrdersRes.rows[0]?.count || 0)
  const conversionRateNum = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : null
  const conversionRate = conversionRateNum !== null ? conversionRateNum.toFixed(1) : '0'

  const monthlyRevenue = monthlyRev.rows.map(r => ({
    month: r.month as string,
    revenue: Number(r.revenue) / 100,
  }))

  const monthlyCounts = monthlyBookings.rows.map(r => ({
    month: r.month as string,
    bookings: Number(r.bookings),
  }))

  // Real LTV = total revenue / unique customers; CAC has no marketing spend table so null
  const ltv = uniqueCustomers > 0 ? Math.round((totalRevenue / uniqueCustomers) * 100) / 100 : null
  const cac: number | null = null
  const cacChange: string | null = null

  let prevYearRevenue = 0
  let revenueGrowth: string | null = null
  let bookingGrowth: string | null = null
  let avgGrowth: string | null = null
  let ltvGrowth: string | null = null
  let conversionGrowth: string | null = null

  if (prevYearOrdersFilter && prevYearPaymentsFilter) {
    const [prevYearPaymentsRes, prevYearOrdersRes] = await Promise.all([
      db.execute(`SELECT COALESCE(SUM(p.amount), 0) as total, COALESCE(AVG(p.amount), 0) as avg_value, COUNT(*) as count FROM payments p WHERE p.status = 'completed' ${prevYearPaymentsFilter}`),
      db.execute(`SELECT COUNT(*) as total, COUNT(DISTINCT o.customer_email) as unique_customers, SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed FROM orders o WHERE o.status != 'cancelled' ${prevYearOrdersFilter}`),
    ])

    prevYearRevenue = Math.round(Number(prevYearPaymentsRes.rows[0]?.total || 0)) / 100
    const prevYearAvgValue = Number(prevYearPaymentsRes.rows[0]?.avg_value || 0) / 100
    const prevYearPaymentsCount = Number(prevYearPaymentsRes.rows[0]?.count || 0)
    const prevYearOrders = Number(prevYearOrdersRes.rows[0]?.total || 0)
    const prevYearUniqueCustomers = Number(prevYearOrdersRes.rows[0]?.unique_customers || 0)
    const prevYearCompletedOrders = Number(prevYearOrdersRes.rows[0]?.completed || 0)

    if (prevYearRevenue > 0) {
      revenueGrowth = (((totalRevenue - prevYearRevenue) / prevYearRevenue) * 100).toFixed(1)
    }
    if (prevYearOrders > 0) {
      bookingGrowth = (((totalOrders - prevYearOrders) / prevYearOrders) * 100).toFixed(1)
    }
    if (prevYearPaymentsCount > 0 && prevYearAvgValue > 0) {
      avgGrowth = (((avgBookingValue - prevYearAvgValue) / prevYearAvgValue) * 100).toFixed(1)
    }
    const prevLtv = prevYearUniqueCustomers > 0 && prevYearRevenue > 0 ? prevYearRevenue / prevYearUniqueCustomers : null
    if (ltv !== null && prevLtv !== null && prevLtv > 0) {
      ltvGrowth = (((ltv - prevLtv) / prevLtv) * 100).toFixed(1)
    }
    const prevConversionNum = prevYearOrders > 0 ? (prevYearCompletedOrders / prevYearOrders) * 100 : null
    if (conversionRateNum !== null && prevConversionNum !== null) {
      conversionGrowth = (conversionRateNum - prevConversionNum).toFixed(1)
    }
  }

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

  const totalServiceCount = servicePopularity.rows.reduce((sum, r) => sum + Number(r.count), 0)
  const serviceData = servicePopularity.rows.map(r => ({
    name: r.package_name as string,
    count: Number(r.count),
    revenue: Math.round(Number(r.revenue || 0) * 100) / 100,
    percentage: totalServiceCount > 0 ? ((Number(r.count) / totalServiceCount) * 100).toFixed(1) : '0',
  }))

  return NextResponse.json({
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      totalBookings: totalOrders,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      cac,
      ltv,
      conversionRate,
      revenueGrowth,
      bookingGrowth,
      avgGrowth,
      cacChange,
      ltvGrowth,
      conversionGrowth,
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
    servicePopularity: serviceData,
    prevYearRevenue,
  })
}
