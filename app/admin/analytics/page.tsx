'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface AnalyticsResponse {
  kpis: {
    totalRevenue: number
    totalBookings: number
    avgBookingValue: number
    cac: number
    ltv: number
    conversionRate: string
    revenueGrowth: string
    bookingGrowth: string
    avgGrowth: string
    cacChange: string
    ltvGrowth: string
    conversionGrowth: string
    uniqueCustomers: number
    totalPayments: number
    completedOrders: number
    pendingOrders: number
  }
  monthlyRevenue: Array<{ month: string; revenue: number }>
  monthlyBookings: Array<{ month: string; bookings: number }>
  drivers: Array<{
    id: number
    name: string
    rating: number
    total_trips: number
    active_trips: number
    vip_compatible: number
    revenue?: number
  }>
  countries: Array<{ country: string; count: number; share: string }>
  servicePopularity: Array<{ name: string; count: number; revenue: number; percentage: string }>
  prevYearRevenue: number
}

function computeChartPaths(monthlyData: Array<{ month: string; revenue: number }>) {
  const svgWidth = 500, svgHeight = 180, pl = 5, pr = 5, pt = 10, pb = 20
  const chartW = svgWidth - pl - pr, chartH = svgHeight - pt - pb
  const values = monthlyData.length > 0 ? monthlyData.map(m => m.revenue) : [0]
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1
  const stepX = values.length > 1 ? chartW / (values.length - 1) : chartW / 2

  const points = values.map((v, i) => ({
    x: pl + i * stepX,
    y: pt + chartH - ((v - min) / range) * chartH * 0.85 - chartH * 0.05,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `M${points[0].x},${svgHeight} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${svgHeight} Z`

  const gridLines = []
  for (let i = 0; i < 5; i++) {
    const y = pt + chartH * (i / 5)
    gridLines.push(y)
  }

  return { points, linePath, areaPath, max, min, gridLines }
}

const DRIVER_COLORS = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--accent-soft)', 'var(--gold-soft)']

const formatMonth = (m: string) => {
  const d = new Date(m + '-01')
  return d.toLocaleDateString('en-US', { month: 'short' })
}

const formatCurrency = (value: number) => '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })

const countryFlag = (country: string) => {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    Colombia: '🇨🇴',
    Mexico: '🇲🇽',
    Brazil: '🇧🇷',
    Spain: '🇪🇸',
    Canada: '🇨🇦',
    France: '🇫🇷',
    Germany: '🇩🇪',
  }
  return flags[country] || '🌐'
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).analytics ?? {}
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAnalytics() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/admin/analytics', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load analytics')
        const payload = await response.json()
        if (mounted) setAnalytics(payload)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      mounted = false
    }
  }, [])

  const kpis = analytics?.kpis
  const monthlyData = useMemo(() => {
    const bookingMap = new Map((analytics?.monthlyBookings || []).map(item => [item.month, item.bookings]))
    return (analytics?.monthlyRevenue || []).map(item => ({
      ...item,
      bookings: bookingMap.get(item.month) || 0,
    }))
  }, [analytics?.monthlyBookings, analytics?.monthlyRevenue])
  const chart = computeChartPaths(monthlyData)
  const services = analytics?.servicePopularity || []
  const countries = analytics?.countries || []
  const topDrivers = analytics?.drivers || []

  const maxPct = Math.max(...services.map(s => Number(s.percentage)), 1)

  const busiestMonth = monthlyData.length > 0 ? monthlyData.reduce((a, b) => a.bookings > b.bookings ? a : b) : null
  const lowestMonth = monthlyData.length > 0 ? monthlyData.reduce((a, b) => a.bookings < b.bookings ? a : b) : null
  const totalBookings = kpis?.totalBookings || 0
  const completedOrders = kpis?.completedOrders || 0
  const paidOrders = kpis?.totalPayments || 0
  const conversionRate = Number(kpis?.conversionRate || 0)

  const funnelSteps = [
    { label: d.bookingsStarted || 'Bookings Started', count: totalBookings, pct: '100%', color: 'var(--accent)', width: '100%' },
    { label: d.paymentInitiated || 'Payment Initiated', count: paidOrders, pct: totalBookings > 0 ? `${((paidOrders / totalBookings) * 100).toFixed(1)}%` : '0%', color: 'var(--info)', width: totalBookings > 0 ? `${Math.max((paidOrders / totalBookings) * 100, 4)}%` : '4%' },
    { label: d.confirmed || 'Confirmed', count: completedOrders, pct: `${conversionRate.toFixed(1)}%`, color: 'var(--success)', width: `${Math.max(conversionRate, 4)}%` },
    { label: d.completed || 'Completed', count: completedOrders, pct: `${conversionRate.toFixed(1)}%`, color: 'var(--warning)', width: `${Math.max(conversionRate, 4)}%` },
  ]

  const barColors = [
    'linear-gradient(to top, var(--accent), rgba(16,185,129,0.6))',
    'linear-gradient(to top, var(--gold), rgba(212,168,75,0.6))',
    'linear-gradient(to top, var(--chart-purple), rgba(167,139,250,0.6))',
    'linear-gradient(to top, var(--chart-rose), rgba(244,114,182,0.6))',
    'linear-gradient(to top, var(--info), rgba(59,130,246,0.6))',
  ]

  return (
    <div className="analytics-page space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--fg)]">{d.title || 'Analytics'}</h1>
          <p className="text-[13px] text-[var(--fg-secondary)] mt-1 max-w-[760px] leading-relaxed">
            {d.subtitle || 'Data-driven insights for your transportation business'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-[6px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 text-[var(--fg-secondary)]">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--fg-secondary)]">
            {d.keyPerformanceIndicators || 'Key Performance Indicators'}
          </span>
          <span className="ml-auto text-[10px] text-[var(--fg-secondary)]">
            {loading ? 'Loading database data...' : (d.updated || 'Updated {time} ago').replace('{time}', 'now')}
          </span>
        </div>
        {error && <div className="mb-3 text-[13px] text-red-500">{error}</div>}
        <div className="kpi-row grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Revenue */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.totalRevenue || 'Total Revenue'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{formatCurrency(kpis?.totalRevenue || 0)}</div>
            <div className="kpi-sub up flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {kpis?.revenueGrowth || '0'}%
            </div>
          </div>

          {/* Total Bookings */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[#3b82f6] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#3b82f6]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[rgba(59,130,246,0.12)] flex items-center justify-center text-[#3b82f6]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.totalBookings || 'Total Bookings'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{totalBookings}</div>
            <div className="kpi-sub up flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {kpis?.bookingGrowth || '0'}%
            </div>
          </div>

          {/* Avg. Rating */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--accent-soft)] hover:shadow-[0_0_0_1px_rgba(167,139,250,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent-soft)]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[rgba(167,139,250,0.12)] flex items-center justify-center text-[var(--accent-soft)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.avgRating || 'Avg. Rating'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{topDrivers.length > 0 ? (topDrivers.reduce((sum, driver) => sum + driver.rating, 0) / topDrivers.length).toFixed(1) : '0.0'}</div>
            <div className="kpi-sub up flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {kpis?.avgGrowth || '0'}%
            </div>
          </div>

          {/* CAC */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--warning)] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--warning)]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[var(--warning-soft)] flex items-center justify-center text-[var(--warning)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.customerAcqCost || 'Customer Acq. Cost'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{formatCurrency(kpis?.cac || 0)}</div>
            <div className="kpi-sub down flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--danger)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {kpis?.cacChange || '0'}%
            </div>
          </div>

          {/* LTV */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--success)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--success)]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[rgba(52,211,153,0.12)] flex items-center justify-center text-[var(--success)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.customerLTV || 'Customer LTV'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{formatCurrency(kpis?.ltv || 0)}</div>
            <div className="kpi-sub up flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {kpis?.ltvGrowth || '0'}%
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="kpi-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--gold-soft)] hover:shadow-[0_0_0_1px_rgba(244,114,182,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--gold-soft)]" />
            <div className="kpi-top flex items-start justify-between mb-2.5">
              <div className="kpi-icon w-[38px] h-[38px] rounded-[6px] bg-[rgba(244,114,182,0.12)] flex items-center justify-center text-[var(--gold-soft)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <div className="kpi-label text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.conversionRate || 'Conversion Rate'}</div>
            <div className="kpi-value text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{kpis?.conversionRate || '0'}%</div>
            <div className="kpi-sub up flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {kpis?.conversionGrowth || '0'}pp
            </div>
          </div>
        </div>
      </div>

      {/* ── REVENUE CHART + SERVICE POPULARITY ── */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 text-[var(--fg-secondary)]">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--fg-secondary)]">
            {d.revenueServiceAnalytics || 'Revenue & Service Analytics'}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
          {/* Revenue Line Chart */}
          <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="card-header flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="card-title text-[13px] font-semibold text-[var(--fg)]">{d.monthlyRevenue || 'Monthly Revenue'}</span>
            </div>
            <div className="chart-body px-4 py-3">
              <div className="chart-header-row flex items-end justify-between mb-3">
                <div>
                  <div className="chart-total text-[26px] font-bold text-[var(--fg)] leading-none">
                    {formatCurrency(kpis?.totalRevenue || 0)}
                  </div>
                  <div className="chart-period text-[11px] text-[var(--fg-secondary)] mt-0.5">{d.yearToDateLabel || 'Year to date'}</div>
                </div>
                <div className="chart-change text-[12px] font-medium text-[var(--accent)]">
                  {kpis?.revenueGrowth || '0'}%
                </div>
              </div>
              <svg className="chart-line-svg w-full h-[180px]" viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {chart.gridLines.map((y, i) => (
                  <g key={i}>
                    <line x1="0" y1={y} x2={500} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="2" y={y + 12} className="fill-[var(--fg-secondary)]" fontSize="8">
                      ${Math.round(chart.max - (chart.max - chart.min) * (i / 5) / 100) / 10}k
                    </text>
                  </g>
                ))}
                <path className="fill-none stroke-[var(--accent)] stroke-[2.5]" d={chart.linePath} />
                <path className="fill-[url(#areaGradAnalytics)]" d={chart.areaPath} />
                {chart.points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
          </div>

          {/* Service Popularity Bar Chart */}
          <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="card-header flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="card-title text-[13px] font-semibold text-[var(--fg)]">{d.servicePopularity || 'Service Popularity'}</span>
              <span className="text-[11px] text-[var(--fg-secondary)]">{d.revenueShare || 'Revenue share'}</span>
            </div>
            <div className="chart-body px-4 py-3">
              <div className="chart-bar-row flex items-end gap-1.5 h-[160px] mt-1">
                {services.length === 0 && !loading ? (
                  <div className="w-full text-center text-[13px] text-[var(--fg-secondary)] self-center">No service data found in the database.</div>
                ) : services.map((svc, i) => {
                  const pct = Number(svc.percentage)
                  const barH = Math.max(4, Math.round((pct / maxPct) * 100))
                  return (
                    <div key={i} className="chart-bar-col flex-1 flex flex-col items-center gap-1">
                      <div className="bar-pct text-[10px] font-semibold text-[var(--fg)]">{svc.percentage}%</div>
                      <div className="bar w-full rounded-[3px_3px_0_0] min-h-[4px]" style={{ height: `${barH}px`, background: barColors[i] }} />
                      <span className="bar-label text-[9px] text-[var(--fg-secondary)] uppercase leading-tight text-center">{svc.name.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-3 pt-2.5 border-t border-[var(--border)]">
                <div>
                  <span className="text-[11px] text-[var(--fg-secondary)]">{d.topServiceLabel || 'Top service'}</span>
                  <div className="text-[13px] font-semibold text-[var(--fg)]">{services[0]?.name || 'No data'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[var(--fg-secondary)]">{d.avgMargin || 'Avg. margin'}</span>
                  <div className="text-[13px] font-semibold text-[var(--accent)]">68%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOURIST ORIGIN + SEASONALITY ── */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 text-[var(--fg-secondary)]">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--fg-secondary)]">
            {d.touristOrigin || 'Tourist Origin & Seasonality'}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Country Table */}
          <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="card-header flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="card-title text-[13px] font-semibold text-[var(--fg)]">{d.touristsByCountry || 'Tourists by Country'}</span>
              <span className="badge badge-accent px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--accent)]">
                {(d.totalTourists || '{count} total').replace('{count}', totalBookings.toLocaleString())}
              </span>
            </div>
            <div className="chart-body overflow-x-auto" style={{ padding: 0 }}>
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-[#111318] border-b border-[var(--border)]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.country || 'Country'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.tourists || 'Tourists'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.share || 'Share'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.trend || 'Trend'}</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.length === 0 && !loading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[var(--fg-secondary)]">No country data found in the database.</td></tr>
                  ) : countries.map((c, i) => {
                    const pct = Number(c.share)
                    const trendVal = pct > 20 ? Math.floor(pct / 5) : pct > 10 ? Math.floor(pct / 3) : Math.floor(pct / 2)
                    const trendColor = trendVal >= 0 ? 'var(--accent)' : 'var(--danger)'
                    return (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[#202330] transition-colors">
                        <td className="px-4 py-2.5 text-[13px] text-[var(--fg)]"><span className="flag-icon text-[15px] leading-none">{countryFlag(c.country)}</span> {c.country}</td>
                        <td className="px-4 py-2.5 text-[13px] text-right text-[var(--fg)]">{c.count}</td>
                        <td className="px-4 py-2.5 text-[13px] text-right text-[var(--fg-secondary)]">{c.share}%</td>
                        <td className="px-4 py-2.5 text-[13px] text-right" style={{ color: trendColor }}>{trendVal >= 0 ? '+' : ''}{trendVal}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends + Funnel */}
          <div className="flex flex-col gap-4">
            {/* Monthly Trends */}
            <div className="trend-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
              <div className="card-header flex items-center justify-between pb-3 border-b border-[var(--border)]" style={{ padding: '0 0 12px 0' }}>
                <span className="card-title text-[13px] font-semibold text-[var(--fg)]">{d.monthlyTrends || 'Monthly Trends'}</span>
                <span className="badge badge-accent px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--accent)]">2025</span>
              </div>
              <div className="trend-item flex items-center justify-between py-2.5 border-b border-[var(--border-light)]">
                <span className="trend-label text-[12px] text-[var(--fg-muted)]">{d.busiestMonth || 'Busiest month'}</span>
                <span className="trend-value text-[14px] font-semibold text-[var(--fg)]">
                  {busiestMonth ? formatMonth(busiestMonth.month) : 'No data'} {busiestMonth && <span className="text-[12px] text-[var(--fg-secondary)] font-normal">({busiestMonth.bookings} bookings)</span>}
                </span>
              </div>
              <div className="trend-item flex items-center justify-between py-2.5 border-b border-[var(--border-light)]">
                <span className="trend-label text-[12px] text-[var(--fg-muted)]">{d.lowestMonth || 'Lowest month'}</span>
                <span className="trend-value text-[14px] font-semibold text-[var(--fg)]">
                  {lowestMonth ? formatMonth(lowestMonth.month) : 'No data'} {lowestMonth && <span className="text-[12px] text-[var(--fg-secondary)] font-normal">({lowestMonth.bookings} bookings)</span>}
                </span>
              </div>
              <div className="trend-item flex items-center justify-between py-2.5 border-b border-[var(--border-light)]">
                <span className="trend-label text-[12px] text-[var(--fg-muted)]">{d.peakSeason || 'Peak season'}</span>
                <span className="trend-value text-[14px] font-semibold" style={{ color: 'var(--gold)' }}>{busiestMonth ? formatMonth(busiestMonth.month) : 'No data'}</span>
              </div>
              <div className="trend-item flex items-center justify-between py-2.5">
                <span className="trend-label text-[12px] text-[var(--fg-muted)]">{d.growthRate || 'Growth rate'}</span>
                <span className="trend-value text-[14px] font-semibold" style={{ color: 'var(--accent)' }}>{kpis?.revenueGrowth || '0'}%</span>
              </div>
            </div>

            {/* Booking Conversion Funnel */}
            <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
              <div className="card-header px-4 py-3 border-b border-[var(--border)]">
                <span className="card-title text-[13px] font-semibold text-[var(--fg)]">{d.bookingConversionFunnel || 'Booking Conversion Funnel'}</span>
              </div>
              <div className="chart-body px-4 py-3">
                <div className="funnel space-y-1.5">
                  {funnelSteps.map((step, i) => (
                    <div key={i} className="funnel-step flex items-center gap-3">
                      <span className="funnel-label text-[12px] font-medium text-[var(--fg)] min-w-[110px] text-right">{step.label}</span>
                      <div className="funnel-bar-wrap flex-1 h-8 relative">
                        <div
                          className="funnel-bar h-full rounded-r-[4px] flex items-center pl-3 text-[11px] font-semibold text-white min-w-[60px]"
                          style={{ width: step.width, background: `linear-gradient(90deg, ${step.color}, ${step.color}88)` }}
                        >
                          {step.count.toLocaleString()}
                        </div>
                      </div>
                      <span className="funnel-count text-[13px] font-semibold font-mono text-[var(--fg)] min-w-[56px] text-right">{step.count.toLocaleString()}</span>
                      <span className="funnel-pct text-[10px] text-[var(--fg-secondary)] min-w-[32px] text-right">{step.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DRIVER PERFORMANCE ── */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 text-[var(--fg-secondary)]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--fg-secondary)]">
            {d.driverPerformance || 'Driver Performance'}
          </span>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--accent)]">
            {d.topPerformers || 'Top performers'}
          </span>
        </div>
        <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
          <div className="chart-body overflow-x-auto" style={{ padding: 0 }}>
            <table className="data-table w-full">
              <thead>
                <tr className="bg-[#111318] border-b border-[var(--border)]">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.driverCol || 'Driver'}</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.tripsCol || 'Trips'}</th>
                  <th className="text-center text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.ratingCol || 'Rating'}</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.driverRevenueCol || 'Revenue'}</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.vipServicesCol || 'VIP Services'}</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.satisfactionCol || 'Satisfaction'}</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.length === 0 && !loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[var(--fg-secondary)]">No driver performance data found in the database.</td></tr>
                ) : topDrivers.map((drv, i) => {
                  const initials = drv.name.split(' ').map(w => w[0]).join('').toUpperCase()
                  const color = DRIVER_COLORS[i % DRIVER_COLORS.length]
                  const stars = Math.floor(drv.rating)
                  const half = drv.rating - stars >= 0.3
                  const starStr = '★'.repeat(stars) + (half ? '½' : '')
                  const vipServices = drv.vip_compatible ? drv.active_trips : 0
                  const satisfaction = Math.round(drv.rating * 20)
                  const satisfactionColor = drv.rating >= 4.5 ? 'var(--accent)' : drv.rating >= 4.0 ? 'var(--warning)' : 'var(--danger)'
                  return (
                    <tr key={i} className="border-b border-[var(--border)] hover:bg-[#202330] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="driver-avatar w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                            style={{ background: `${color}1e`, color }}
                          >
                            {initials}
                          </span>
                          <span className="text-[13px] text-[var(--fg)]">{drv.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-[var(--fg)]">{drv.total_trips}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rating-stars" style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '1px' }}>{starStr}</span>
                        <span className="text-[12px] text-[var(--fg-secondary)] ml-1">{drv.rating.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono text-[var(--fg)]">{formatCurrency(drv.revenue || 0)}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-[var(--fg)]">{vipServices}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px]" style={{ color: satisfactionColor }}>{satisfaction}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-5 pb-4 text-center text-[12px] text-[var(--fg-secondary)] border-t border-[var(--border)]">
        {d.footerLabel || 'Medellín Admin v2.0 · Analytics & Business Intelligence'} · &copy; 2025
      </div>
    </div>
  )
}
