'use client'

import { useI18n } from '@/lib/i18n'

const data = {
  revenue: 48250, bookings: 384, avgRating: 4.8, ltv: 320, cac: 28,
  conversionRate: 34.2, revenueChange: '+22.5%', bookingsChange: '+18.3%',
  avgChange: '+0.3', ltvChange: '+12.4%', cacChange: '-5.2%', convChange: '+2.1pp',
}

const topDrivers = [
  { name: 'Carlos M.', trips: 142, rating: 4.9, revenue: '$8,240' },
  { name: 'María G.', trips: 128, rating: 4.8, revenue: '$6,920' },
  { name: 'Felipe L.', trips: 115, rating: 4.7, revenue: '$7,450' },
  { name: 'Diego P.', trips: 98, rating: 4.9, revenue: '$5,830' },
  { name: 'Ana R.', trips: 87, rating: 4.6, revenue: '$4,210' },
]

const services = [
  { name: 'Airport Transfer', bookings: 184, revenue: 18400, pct: 38 },
  { name: 'City Tour', bookings: 72, revenue: 10800, pct: 22 },
  { name: 'VIP Tour', bookings: 48, revenue: 16800, pct: 35 },
  { name: 'Hotel Shuttle', bookings: 56, revenue: 3360, pct: 7 },
  { name: 'Return Transfer', bookings: 24, revenue: 960, pct: 2 },
]

const countries = [
  { name: 'United States', flag: '🇺🇸', pct: 32, bookings: 123 },
  { name: 'Colombia', flag: '🇨🇴', pct: 18, bookings: 69 },
  { name: 'Mexico', flag: '🇲🇽', pct: 14, bookings: 54 },
  { name: 'Brazil', flag: '🇧🇷', pct: 10, bookings: 38 },
  { name: 'Spain', flag: '🇪🇸', pct: 8, bookings: 31 },
]

export default function AnalyticsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).analytics ?? {}

  return (
    <div className="analytics-page space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{d.title || 'Analytics'}</h1>
          <p className="text-[13px] text-[var(--fg-muted)] mt-1 max-w-[760px] leading-relaxed">
            {d.subtitle || 'Data-driven insights for your transportation business'}
          </p>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon green" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.totalRevenue || 'Total Revenue'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>${data.revenue.toLocaleString()}</div>
          <div className="kpi-sub up" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            {data.revenueChange}
          </div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon blue" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--info-soft)', color: 'var(--info)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.totalBookings || 'Total Bookings'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{data.bookings}</div>
          <div className="kpi-sub up" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            {data.bookingsChange}
          </div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon purple" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'rgba(167,139,250,0.12)', color: 'var(--accent-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.avgRating || 'Avg. Rating'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{data.avgRating}</div>
          <div className="kpi-sub up" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            {data.avgChange}
          </div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon mint" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.avgLTV || 'Avg. LTV'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>${data.ltv}</div>
          <div className="kpi-sub up" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            {data.ltvChange}
          </div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon amber" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--warning-soft)', color: 'var(--warning)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.cac || 'CAC'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>${data.cac}</div>
          <div className="kpi-sub down" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            {data.cacChange}
          </div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="kpi-icon rose" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'rgba(244,114,182,0.12)', color: 'var(--gold-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div className="kpi-label" style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, marginBottom: 2 }}>{d.conversionRate || 'Conversion Rate'}</div>
          <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{data.conversionRate}%</div>
          <div className="kpi-sub up" style={{ fontSize: 12, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            {data.convChange}
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="space-y-6">
        {/* Chart Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="chart-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 0, border: 'none' }}>
              <span className="card-title" style={{ fontSize: 14, fontWeight: 600 }}>{d.revenueBreakdown || 'Revenue Breakdown'}</span>
            </div>
            <div className="space-y-3">
              {services.map((s, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>${s.revenue.toLocaleString()} · {s.bookings} bookings</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: ['var(--accent)', 'var(--info)', 'var(--gold)', 'var(--warning)', 'var(--accent-soft)'][idx], borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Drivers */}
          <div className="chart-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 0, border: 'none' }}>
              <span className="card-title" style={{ fontSize: 14, fontWeight: 600 }}>{d.topDrivers || 'Top Drivers'}</span>
            </div>
            {topDrivers.map((drv, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>
                  {drv.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{drv.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{drv.trips} trips</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{drv.revenue}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>⭐ {drv.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country Distribution */}
        <div className="chart-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 0, border: 'none' }}>
            <span className="card-title" style={{ fontSize: 14, fontWeight: 600 }}>{d.countryDistribution || 'Country Distribution'}</span>
          </div>
          <div className="space-y-3">
            {countries.map((c, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}><span style={{ marginRight: 6 }}>{c.flag}</span>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{c.pct}% · {c.bookings} bookings</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: ['var(--info)', 'var(--accent)', 'var(--warning)', 'var(--danger-soft)', 'var(--accent-soft)'][idx], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}