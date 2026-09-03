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

  const load = () => {
    fetch('/api/hotel/analytics')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setData(d.analytics || EMPTY))
      .catch(() => setError('Error al cargar las analíticas'))
      .finally(() => setLoading(false))
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