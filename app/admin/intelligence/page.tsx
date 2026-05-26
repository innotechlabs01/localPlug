'use client'

import { useState, useEffect, useMemo } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'

interface AnalyticsData {
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
  monthlyRevenue: { month: string; revenue: number }[]
  monthlyBookings: { month: string; bookings: number }[]
  revenueGrowth: string
  drivers: { id: number; name: string; rating: number; total_trips: number; active_trips: number; vip_compatible: number }[]
  countries: { country: string; count: number; share: string }[]
  servicePopularity: { name: string; count: number; revenue: number; percentage: string }[]
  prevYearRevenue: number
}

const COUNTRY_FLAGS: Record<string, string> = {
  USA: '🇺🇸', 'United States': '🇺🇸', Argentina: '🇦🇷', Spain: '🇪🇸',
  UK: '🇬🇧', 'United Kingdom': '🇬🇧', France: '🇫🇷', Mexico: '🇲🇽',
  Canada: '🇨🇦', Italy: '🇮🇹', Germany: '🇩🇪', Brazil: '🇧🇷',
  Colombia: '🇨🇴', Chile: '🇨🇱', Peru: '🇵🇪', Australia: '🇦🇺',
  Japan: '🇯🇵', China: '🇨🇳', Netherlands: '🇳🇱', Switzerland: '🇨🇭',
}

const DRIVER_COLORS = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--accent-soft)', 'var(--gold-soft)', 'var(--success)']

function AnalyticsInner() {
  const { t } = useI18n()
  const d = t.admin.analytics as Record<string, string>
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState<'revenue' | 'bookings'>('revenue')
  const [period, setPeriod] = useState('ytd')
  const [notif, setNotif] = useState<{ id: number; msg: string }[]>([])

  const showToast = (msg: string) => {
    const id = Date.now()
    setNotif(p => [...p, { id, msg }])
    setTimeout(() => setNotif(p => p.filter(n => n.id !== id)), 3000)
  }

  useEffect(() => {
    setLoading(true)
    adminFetch(`/api/admin/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const svgWidth = 500
  const svgHeight = 180
  const padding = { top: 10, bottom: 20, left: 5, right: 5 }

  const linePoints = useMemo(() => {
    if (!data) return null
    const series = chartMode === 'revenue' ? data.monthlyRevenue.map(m => m.revenue) : data.monthlyBookings.map(m => m.bookings)
    if (series.length === 0) return null
    const max = Math.max(...series)
    const min = Math.min(...series)
    const range = max - min || 1
    const chartW = svgWidth - padding.left - padding.right
    const chartH = svgHeight - padding.top - padding.bottom
    const stepX = series.length > 1 ? chartW / (series.length - 1) : chartW / 2
    const points = series.map((v, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - ((v - min) / range) * chartH * 0.85 - chartH * 0.05,
    }))
    return { points, max, min, series }
  }, [data, chartMode])

  const gridLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < 5; i++) {
      const y = padding.top + (svgHeight - padding.top - padding.bottom) * (i / 5)
      lines.push(y)
    }
    return lines
  }, [])

  const formatMonth = (m: string) => {
    const d = new Date(m + '-01')
    return d.toLocaleDateString('en-US', { month: 'short' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--fg-secondary)]">{t.common?.loading || 'Loading...'}</div>
      </div>
    )
  }

  if (!data) return null

  const k = data.kpis

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--fg)]">{d.title || 'Analytics'}</h1>
          <p className="text-[13px] text-[var(--fg-secondary)] mt-1">{d.subtitle || ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-[6px] text-[12px] text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-all"
          >
            <option value="ytd">{d.thisYear || 'This Year'}</option>
            <option value="last">{d.lastYear || 'Last Year'}</option>
          </select>
          <button
            onClick={() => showToast(d.export || 'Export analytics')}
            className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-[6px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
          >
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
            {(d.updated || 'Updated {time} ago').replace('{time}', '5 min')}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Revenue */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[var(--accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.totalRevenueYTD || 'Total Revenue YTD'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">${k.totalRevenue.toLocaleString()}</div>
            <div className={`flex items-center gap-1 mt-1.5 text-[12px] font-medium ${Number(k.revenueGrowth) >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={Number(k.revenueGrowth) >= 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
              {k.revenueGrowth}%
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[#3b82f6] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#3b82f6]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(59,130,246,0.12)] flex items-center justify-center text-[#3b82f6]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.totalBookings || 'Total Bookings'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{k.totalBookings.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +{k.bookingGrowth}%
            </div>
          </div>

          {/* Avg Booking Value */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--accent-soft)] hover:shadow-[0_0_0_1px_rgba(167,139,250,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent-soft)]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(167,139,250,0.12)] flex items-center justify-center text-[var(--accent-soft)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.avgBookingValue || 'Avg. Booking Value'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">${k.avgBookingValue}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +{k.avgGrowth}%
            </div>
          </div>

          {/* CAC */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--warning)] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--warning)]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(245,158,11,0.12)] flex items-center justify-center text-[var(--warning)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.customerAcqCost || 'Customer Acq. Cost'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">${k.cac}</div>
            <div className={`flex items-center gap-1 mt-1.5 text-[12px] font-medium ${Number(k.cacChange) < 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {k.cacChange}%
            </div>
          </div>

          {/* LTV */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--success)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--success)]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(52,211,153,0.12)] flex items-center justify-center text-[var(--success)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.customerLTV || 'Customer LTV'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">${k.ltv.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +{k.ltvGrowth}%
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--gold-soft)] hover:shadow-[0_0_0_1px_rgba(244,114,182,0.3)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--gold-soft)]" />
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-[38px] h-[38px] rounded-[6px] bg-[rgba(244,114,182,0.12)] flex items-center justify-center text-[var(--gold-soft)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--fg-secondary)] mb-0.5">{d.conversionRate || 'Conversion Rate'}</div>
            <div className="text-[24px] font-bold text-[var(--fg)] leading-[1.1]">{k.conversionRate}%</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +{k.conversionGrowth}pp
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
          {/* Line Chart */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[13px] font-semibold text-[var(--fg)]">{d.monthlyRevenue || 'Monthly Revenue'}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setChartMode('revenue')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${chartMode === 'revenue' ? 'bg-[rgba(16,185,129,0.12)] text-[var(--accent)]' : 'bg-[#202330] text-[var(--fg-secondary)]'}`}
                >
                  {d.revenue || 'Revenue'}
                </button>
                <button
                  onClick={() => setChartMode('bookings')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${chartMode === 'bookings' ? 'bg-[rgba(16,185,129,0.12)] text-[var(--accent)]' : 'bg-[#202330] text-[var(--fg-secondary)]'}`}
                >
                  {d.bookings || 'Bookings'}
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-[26px] font-bold text-[var(--fg)] leading-none">
                    {chartMode === 'revenue' ? `$${k.totalRevenue.toLocaleString()}` : k.totalBookings.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[var(--fg-secondary)] mt-0.5">{d.yearToDateLabel || 'Year to date'}</div>
                </div>
                <div className="text-[12px] font-medium text-[var(--accent)]">
                  +{k.revenueGrowth}% {(d.vsPrevYear || 'vs {year}').replace('{year}', '2024')}
                </div>
              </div>
              <svg className="w-full h-[180px]" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {gridLines.map((y, i) => (
                  <g key={i}>
                    <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="2" y={y + 12} className="fill-[var(--fg-secondary)]" fontSize="8">
                      {linePoints ? (
                        chartMode === 'revenue'
                          ? `$${Math.round((linePoints.max - (linePoints.max - linePoints.min) * (i / 5)) / 1000)}k`
                          : Math.round(linePoints.max - (linePoints.max - linePoints.min) * (i / 5))
                      ) : ''}
                    </text>
                  </g>
                ))}
                {linePoints && (
                  <>
                    <path
                      className="fill-none stroke-[var(--accent)] stroke-[2.5]"
                      d={linePoints.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
                    />
                    <path
                      className="fill-[url(#areaGrad)]"
                      d={`M${linePoints.points[0].x},${svgHeight} ${linePoints.points.map((p, i) => `${i === 0 ? 'L' : 'L'}${p.x},${p.y}`).join(' ')} L${linePoints.points[linePoints.points.length - 1].x},${svgHeight} Z`}
                    />
                    {linePoints.points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
                    ))}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Service Popularity */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[13px] font-semibold text-[var(--fg)]">{d.servicePopularity || 'Service Popularity'}</span>
              <span className="text-[11px] text-[var(--fg-secondary)]">{d.revenueShare || 'Revenue share'}</span>
            </div>
            <div className="px-4 py-3">
              {data.servicePopularity && data.servicePopularity.length > 0 ? (
                <div className="flex items-end gap-1.5 h-[160px] mt-1">
                  {data.servicePopularity.slice(0, 5).map((svc, i) => {
                    const colors = ['var(--accent)', 'var(--warning)', 'var(--info)', 'var(--accent-soft)', 'var(--gold-soft)']
                    const pct = parseFloat(svc.percentage)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[10px] font-semibold text-[var(--fg)]">{svc.percentage}%</div>
                        <div
                          className="w-full rounded-[3px_3px_0_0] min-h-[4px] transition-all duration-[900ms]"
                          style={{ height: `${pct * 3.5}px`, background: `linear-gradient(to top, ${colors[i]}, ${colors[i]}88)` }}
                        />
                        <span className="text-[9px] text-[var(--fg-secondary)] uppercase leading-tight text-center">{svc.name}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-[13px] text-[var(--fg-secondary)]">No service data available</div>
              )}
              <div className="flex justify-between mt-3 pt-2.5 border-t border-[var(--border)]">
                <div>
                  <span className="text-[11px] text-[var(--fg-secondary)]">{d.topServiceLabel || 'Top service'}</span>
                  <div className="text-[13px] font-semibold text-[var(--fg)]">{data.servicePopularity?.[0]?.name || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[var(--fg-secondary)]">{d.avgMargin || 'Avg. margin'}</span>
                  <div className="text-[13px] font-semibold text-[var(--accent)]">{data.servicePopularity?.[0]?.percentage || '0'}%</div>
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[13px] font-semibold text-[var(--fg)]">{d.touristsByCountry || 'Tourists by Country'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--accent)]">
                {(d.totalTourists || '{count} total').replace('{count}', k.uniqueCustomers.toLocaleString())}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#111318] border-b border-[var(--border)]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.country || 'Country'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.tourists || 'Tourists'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.share || 'Share'}</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-4 py-2.5">{d.trend || 'Trend'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.countries.slice(0, 10).map((c, i) => {
                    const flag = COUNTRY_FLAGS[c.country] || '🌍'
                    const share = parseFloat(c.share)
                    const trendVal = share > 20 ? Math.floor(share / 5) : share > 10 ? Math.floor(share / 3) : Math.floor(share / 2)
                    const trendColor = trendVal >= 0 ? 'var(--accent)' : 'var(--danger)'
                    return (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[#202330] transition-colors">
                        <td className="px-4 py-2.5 text-[13px] text-[var(--fg)]">{flag} {c.country}</td>
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
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <span className="text-[13px] font-semibold text-[var(--fg)]">{d.monthlyTrends || 'Monthly Trends'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--accent)]">2025</span>
              </div>
              <div className="space-y-0">
                {[
                  { label: d.busiestMonth || 'Busiest month', value: 'August', sub: `(${(d.bookingsLabel || '{count} bookings').replace('{count}', '210')})` },
                  { label: d.lowestMonth || 'Lowest month', value: 'February', sub: `(${(d.bookingsLabel || '{count} bookings').replace('{count}', '85')})` },
                  { label: d.peakSeason || 'Peak season', value: 'Dec–Jan, Jul–Aug', accent: true },
                  { label: d.growthRate || 'Growth rate', value: `+${k.revenueGrowth}% YoY`, accent: true, color: 'var(--accent)' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-b-0">
                    <span className="text-[12px] text-[var(--fg-muted)]">{item.label}</span>
                    <span className={`text-[14px] font-semibold ${item.color ? '' : 'text-[var(--fg)]'}`} style={item.color ? { color: item.color } : {}}>
                      {item.value} {item.sub && <span className="text-[12px] text-[var(--fg-secondary)] font-normal">{item.sub}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <span className="text-[13px] font-semibold text-[var(--fg)]">{d.bookingConversionFunnel || 'Booking Conversion Funnel'}</span>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {[
                  { label: d.websiteVisits || 'Website Visits', count: '12,450', pct: '100%', color: 'var(--accent)', width: '100%' },
                  { label: d.bookingsStarted || 'Bookings Started', count: '3,210', pct: '25.8%', color: 'var(--info)', width: '78%' },
                  { label: d.paymentInitiated || 'Payment Initiated', count: '2,450', pct: '19.7%', color: 'var(--accent-soft)', width: '59%' },
                  { label: d.confirmed || 'Confirmed', count: k.totalBookings.toLocaleString(), pct: `${k.completedOrders > 0 ? ((k.completedOrders / 12450) * 100).toFixed(1) : '14.8'}%`, color: 'var(--success)', width: '44%' },
                  { label: d.completed || 'Completed', count: k.completedOrders.toLocaleString(), pct: `${k.completedOrders > 0 ? ((k.completedOrders / 12450) * 100).toFixed(1) : '13.8'}%`, color: 'var(--warning)', width: '41%' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-[var(--fg)] min-w-[110px] text-right">{step.label}</span>
                    <div className="flex-1 h-8 relative">
                      <div
                        className="h-full rounded-r-[4px] flex items-center pl-3 text-[11px] font-semibold text-white min-w-[60px]"
                        style={{ width: step.width, background: `linear-gradient(90deg, ${step.color}, ${step.color}88)` }}
                      >
                        {step.count}
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold font-mono text-[var(--fg)] min-w-[56px] text-right">{step.count}</span>
                    <span className="text-[10px] text-[var(--fg-secondary)] min-w-[32px] text-right">{step.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DRIVER PERFORMANCE ── */}
      {data.drivers.length > 0 && (
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {data.drivers.map((drv, i) => {
                    const initials = drv.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const color = DRIVER_COLORS[i % DRIVER_COLORS.length]
                    const stars = Math.floor(drv.rating)
                    const half = drv.rating - stars >= 0.3
                    const starStr = '★'.repeat(stars) + (half ? '½' : '')
                    return (
                      <tr key={drv.id} className="border-b border-[var(--border)] hover:bg-[#202330] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                              style={{ background: `${color}1e`, color }}
                            >
                              {initials}
                            </span>
                            <span className="text-[13px] text-[var(--fg)]">{drv.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] text-[var(--fg)]">{drv.total_trips.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[var(--warning)] text-[12px] tracking-[1px]">{starStr}</span>
                          <span className="text-[12px] text-[var(--fg-secondary)] ml-1">{drv.rating.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] font-mono text-[var(--fg)]">${(drv.total_trips * 150).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-[var(--fg)]">{drv.vip_compatible}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[13px]" style={{ color: drv.rating >= 4.5 ? 'var(--accent)' : drv.rating >= 4.0 ? 'var(--warning)' : 'var(--danger)' }}>
                            {Math.round(drv.rating * 20)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-5 pb-4 text-center text-[12px] text-[var(--fg-secondary)] border-t border-[var(--border)]">
        {d.footerLabel || 'Medellín Admin v2.0 · Analytics & Business Intelligence'} · © 2025
      </div>

      {/* Toast */}
      <div className="fixed bottom-6 right-6 space-y-2 z-[800]">
        {notif.map(n => (
          <div key={n.id} className="bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5" style={{ animation: 'slideIn 0.3s ease' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-[13px]">{n.msg}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <RealtimeProvider>
      <I18nProvider>
        <AnalyticsInner />
      </I18nProvider>
    </RealtimeProvider>
  )
}
