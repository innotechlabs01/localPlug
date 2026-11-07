'use client'

import { useState, useEffect } from 'react'
import { cardStyle, sectionTitle, tableHeaderStyle, tableCellStyle, badge, pageHeading, pageSubtext } from '@/lib/hotel/styles'

interface Analytics {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  acceptedOrders: number
  acceptanceRate: number
  totalRevenue: number
  avgOrderValue: number
  occupancyRate: number
  totalRooms: number
  occupiedRooms: number
  byMonth: Array<{ month: string; count: number; revenue: number }>
  services: Array<{ name: string; base_price: number; active: number }>
}

const EMPTY: Analytics = {
  totalOrders: 0, completedOrders: 0, cancelledOrders: 0, acceptedOrders: 0,
  acceptanceRate: 0, totalRevenue: 0, avgOrderValue: 0, occupancyRate: 0,
  totalRooms: 0, occupiedRooms: 0, byMonth: [], services: [],
}

const KPI_COLORS: Record<string, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  info: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  gold: { bg: 'rgba(212,168,75,0.15)', fg: 'var(--accent-gold)' },
  muted: { bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' },
}

export default function HotelAnalyticsPage() {
  const [data, setData] = useState<Analytics>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payout, setPayout] = useState<{ available_usd: number; pending_usd: number }>({ available_usd: 0, pending_usd: 0 })
  const [requesting, setRequesting] = useState(false)
  const [payoutMsg, setPayoutMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [period, setPeriod] = useState<string>('')

  const load = () => {
    fetch('/api/hotel/analytics')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setData(d.analytics || EMPTY))
      .catch(() => setError('Error al cargar las analíticas'))
      .finally(() => setLoading(false))
    fetch('/api/hotel/payout')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setPayout({ available_usd: Number(d.available_usd || 0), pending_usd: Number(d.pending_usd || 0) }))
      .catch(() => {})
    fetch('/api/hotel/payout/statement')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.availablePeriods?.length) {
          setPeriods(d.availablePeriods)
          setPeriod(d.availablePeriods[0])
        }
      })
      .catch(() => {})
  }

  const requestPayout = async () => {
    setRequesting(true); setPayoutMsg(null)
    try {
      const res = await fetch('/api/hotel/payout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setPayoutMsg({ ok: true, text: `Solicitud creada por ${formatCurrency(data.amount_usd ?? 0)}. Te consignaremos por transferencia.` })
        setPayout(p => ({ available_usd: 0, pending_usd: p.available_usd + p.pending_usd }))
      } else {
        setPayoutMsg({ ok: false, text: data.error || 'No se pudo crear la solicitud.' })
      }
    } catch {
      setPayoutMsg({ ok: false, text: 'Error al solicitar el pago.' })
    } finally {
      setRequesting(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  const kpis: Array<{ label: string; value: string; color: keyof typeof KPI_COLORS }> = [
    { label: 'Reservaciones totales', value: String(data.totalOrders), color: 'accent' },
    { label: 'Completadas', value: String(data.completedOrders), color: 'info' },
    { label: 'Canceladas', value: String(data.cancelledOrders), color: 'muted' },
    { label: 'Tasa de aceptación', value: `${data.acceptanceRate}%`, color: 'gold' },
    { label: 'Ingresos', value: formatCurrency(data.totalRevenue), color: 'accent' },
    { label: 'Valor promedio', value: formatCurrency(data.avgOrderValue), color: 'info' },
    { label: 'Ocupación', value: `${data.occupancyRate}%`, color: 'gold' },
    { label: 'Habitaciones', value: `${data.occupiedRooms}/${data.totalRooms}`, color: 'muted' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <p style={{ fontSize: 15, margin: '0 0 16px', color: 'var(--danger)' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); load() }}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--accent-gold)', color: '#000', border: 'none', cursor: 'pointer',
          }}
        >Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={pageHeading}>Analíticas</h1>
        <p style={pageSubtext}>Resumen del rendimiento del hotel</p>
      </div>

      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Saldo disponible para cobrar</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-gold)' }}>{formatCurrency(payout.available_usd)}</div>
          {payout.pending_usd > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{formatCurrency(payout.pending_usd)} en solicitudes / pagados</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={requestPayout}
            disabled={requesting || payout.available_usd <= 0}
            style={{
              padding: '12px 22px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 600,
              background: 'var(--accent-gold)', color: '#000', cursor: payout.available_usd > 0 ? 'pointer' : 'not-allowed',
              opacity: payout.available_usd > 0 ? 1 : 0.5,
            }}
          >
            {requesting ? 'Solicitando...' : 'Solicitar pago'}
          </button>
          <a
            href={`/api/hotel/payout/statement?format=csv${period ? '&period=' + period : ''}`}
            download
            style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent-gold)', textDecoration: 'none', cursor: 'pointer', marginRight: 14 }}
          >
            ⬇ CSV
          </a>
          <a
            href={`/api/hotel/payout/statement?format=pdf${period ? '&period=' + period : ''}`}
            download
            style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent-gold)', textDecoration: 'none', cursor: 'pointer' }}
          >
            ⬇ PDF
          </a>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Se paga por mes por transferencia</div>
          {periods.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>Periodo:</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
        </div>
        {payoutMsg && (
          <div style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: payoutMsg.ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
            color: payoutMsg.ok ? '#4ade80' : '#f87171' }}>{payoutMsg.text}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {kpis.map(k => {
          const c = KPI_COLORS[k.color]
          return (
            <div key={k.label} style={{ ...cardStyle, textAlign: 'center', padding: 16 }}>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.fg }}>{k.value}</div>
            </div>
          )
        })}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Ingresos y reservaciones por mes</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Mes</th>
                <th style={tableHeaderStyle}>Reservaciones</th>
                <th style={tableHeaderStyle}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.byMonth.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tableCellStyle, textAlign: 'center', color: 'var(--text-muted)' }}>Sin datos</td></tr>
              ) : data.byMonth.slice(-12).map(m => (
                <tr key={m.month}>
                  <td style={tableCellStyle}>
                    {new Date(m.month + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                  </td>
                  <td style={tableCellStyle}>{m.count}</td>
                  <td style={tableCellStyle}>{formatCurrency(Number(m.revenue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Servicios activos</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {data.services.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin servicios activos</span>
          ) : data.services.map(s => (
            <span key={s.name} style={{
              ...badge('rgba(212,168,75,0.15)', 'var(--accent-gold)'),
              padding: '6px 12px', fontSize: 12,
            }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}