'use client'

import { useState, useEffect, useCallback } from 'react'

interface Trip {
  id: string
  date: string
  customerName: string
  pickup: string
  destination: string
  amount: number
  status: 'completed' | 'pending'
  tip?: number
}

interface EarningsSummary {
  thisWeek: number
  lastWeek: number
  percentChange: number
  totalTrips: number
}

interface EarningsBreakdown {
  baseFare: number
  tips: number
  bonuses: number
}

interface DailyEarnings {
  day: string
  amount: number
}

export default function DriverEarningsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [summary, setSummary] = useState<EarningsSummary>({
    thisWeek: 0,
    lastWeek: 0,
    percentChange: 0,
    totalTrips: 0
  })
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    baseFare: 0,
    tips: 0,
    bonuses: 0
  })
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [earningsRes, metricsRes] = await Promise.allSettled([
        fetch('/api/driver/earnings'),
        fetch('/api/driver/metrics')
      ])

      if (earningsRes.status === 'fulfilled' && earningsRes.value.ok) {
        const earningsData = await earningsRes.value.json()
        setTrips(earningsData.trips || [])
        setSummary(earningsData.summary || {
          thisWeek: 0,
          lastWeek: 0,
          percentChange: 0,
          totalTrips: 0
        })
        setBreakdown(earningsData.breakdown || {
          baseFare: 0,
          tips: 0,
          bonuses: 0
        })
        setDailyEarnings(earningsData.dailyEarnings || [])
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const metricsData = await metricsRes.value.json()
        if (metricsData.summary) {
          setSummary(prev => ({ ...prev, ...metricsData.summary }))
        }
      }
    } catch (err) {
      console.error('Error fetching earnings:', err)
      setError('Error al cargar los datos de ganancias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maxDailyAmount = Math.max(...dailyEarnings.map(d => d.amount), 1)

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 16,
        }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando ganancias...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', textAlign: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--text-primary)' }}>Error al cargar datos</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={fetchEarnings}
          style={{
            background: 'var(--accent-gold)', color: 'var(--bg-dark)',
            border: 'none', padding: '12px 24px',
            borderRadius: 14, fontSize: 16, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-gold-light, #e8c9a0)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-gold)' }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  const sectionTitle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: 18,
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  }

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
        }}>Mis Ganancias</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Resumen de tu actividad</p>
      </header>

      <section style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        padding: 24,
        marginBottom: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <span style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Esta semana</span>
          <span style={{
            display: 'block', fontSize: 42, fontWeight: 700,
            color: 'var(--accent-gold)', lineHeight: 1.1,
          }}>{formatCurrency(summary.thisWeek)}</span>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: summary.percentChange >= 0 ? 'var(--accent)' : 'var(--danger)',
            }}>
              {summary.percentChange >= 0 ? '↑' : '↓'} {Math.abs(summary.percentChange)}%
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>vs semana anterior</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Semana anterior</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(summary.lastWeek)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Viajes esta semana</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{summary.totalTrips}</span>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>Desglose</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14,
            padding: 16, textAlign: 'center',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
          >
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Tarifa base</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(breakdown.baseFare)}</span>
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14,
            padding: 16, textAlign: 'center',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
          >
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Propinas</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(breakdown.tips)}</span>
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14,
            padding: 16, textAlign: 'center',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
          >
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Bonificaciones</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)' }}>{formatCurrency(breakdown.bonuses)}</span>
          </div>
        </div>
      </section>

      <section style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        padding: 20,
        marginBottom: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h2 style={sectionTitle}>Últimos 7 días</h2>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 160, gap: 8, paddingTop: 20,
        }}>
          {dailyEarnings.length > 0 ? (
            dailyEarnings.map((day, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '100%', maxWidth: 40,
                      background: 'linear-gradient(180deg, var(--accent-gold) 0%, var(--accent) 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      position: 'relative',
                      transition: 'height 0.3s ease',
                      height: `${(day.amount / maxDailyAmount) * 100}%`,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: -20, left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 10, color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}>{formatCurrency(day.amount)}</span>
                  </div>
                </div>
                <span style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day.day}</span>
              </div>
            ))
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Sin datos disponibles</div>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>Viajes recientes</h2>
        {trips.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'
                  e.currentTarget.style.borderColor = 'var(--accent-gold)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(trip.date)}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    padding: '4px 10px', borderRadius: 12,
                    background: trip.status === 'completed' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(250, 204, 21, 0.12)',
                    color: trip.status === 'completed' ? '#4ade80' : '#facc15',
                  }}>
                    {trip.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{trip.pickup}</span>
                  </div>
                  <div style={{ width: 2, height: 20, background: 'var(--border)', marginLeft: 4 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-gold)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{trip.destination}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 12, borderTop: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{trip.customerName}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)' }}>{formatCurrency(trip.amount)}</span>
                    {trip.tip && trip.tip > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--accent)' }}>+{formatCurrency(trip.tip)} propina</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14,
            padding: '40px 20px', textAlign: 'center',
            border: '1px solid var(--border)',
          }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay viajes registrados aún</p>
          </div>
        )}
      </section>
    </div>
  )
}
