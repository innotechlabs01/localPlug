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
      <div className="earnings-container">
        <div className="earnings-loading">
          <div className="spinner" />
          <p>Cargando ganancias...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="earnings-container">
        <div className="earnings-empty">
          <div className="empty-icon">⚠️</div>
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={fetchEarnings} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="earnings-container">
      <header className="earnings-header">
        <h1>Mis Ganancias</h1>
        <p className="subtitle">Resumen de tu actividad</p>
      </header>

      <section className="weekly-summary">
        <div className="summary-main">
          <span className="summary-label">Esta semana</span>
          <span className="summary-amount">{formatCurrency(summary.thisWeek)}</span>
          <div className="summary-change">
            <span className={`change-indicator ${summary.percentChange >= 0 ? 'positive' : 'negative'}`}>
              {summary.percentChange >= 0 ? '↑' : '↓'} {Math.abs(summary.percentChange)}%
            </span>
            <span className="change-label">vs semana anterior</span>
          </div>
        </div>
        <div className="summary-secondary">
          <div className="secondary-item">
            <span className="secondary-label">Semana anterior</span>
            <span className="secondary-value">{formatCurrency(summary.lastWeek)}</span>
          </div>
          <div className="secondary-item">
            <span className="secondary-label">Viajes esta semana</span>
            <span className="secondary-value">{summary.totalTrips}</span>
          </div>
        </div>
      </section>

      <section className="earnings-breakdown">
        <h2>Desglose</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <span className="breakdown-label">Tarifa base</span>
            <span className="breakdown-value">{formatCurrency(breakdown.baseFare)}</span>
          </div>
          <div className="breakdown-card">
            <span className="breakdown-label">Propinas</span>
            <span className="breakdown-value tips">{formatCurrency(breakdown.tips)}</span>
          </div>
          <div className="breakdown-card">
            <span className="breakdown-label">Bonificaciones</span>
            <span className="breakdown-value bonuses">{formatCurrency(breakdown.bonuses)}</span>
          </div>
        </div>
      </section>

      <section className="daily-chart">
        <h2>Últimos 7 días</h2>
        <div className="chart-container">
          {dailyEarnings.length > 0 ? (
            dailyEarnings.map((day, index) => (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${(day.amount / maxDailyAmount) * 100}%` }}
                  >
                    <span className="chart-value">{formatCurrency(day.amount)}</span>
                  </div>
                </div>
                <span className="chart-label">{day.day}</span>
              </div>
            ))
          ) : (
            <div className="chart-empty">Sin datos disponibles</div>
          )}
        </div>
      </section>

      <section className="trips-list">
        <h2>Viajes recientes</h2>
        {trips.length > 0 ? (
          <div className="trips-container">
            {trips.map(trip => (
              <div key={trip.id} className="trip-card">
                <div className="trip-header">
                  <span className="trip-date">{formatDate(trip.date)}</span>
                  <span className={`trip-status ${trip.status}`}>
                    {trip.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
                <div className="trip-route">
                  <div className="route-point">
                    <span className="route-dot pickup" />
                    <span className="route-text">{trip.pickup}</span>
                  </div>
                  <div className="route-line" />
                  <div className="route-point">
                    <span className="route-dot destination" />
                    <span className="route-text">{trip.destination}</span>
                  </div>
                </div>
                <div className="trip-footer">
                  <span className="trip-customer">{trip.customerName}</span>
                  <div className="trip-amounts">
                    <span className="trip-amount">{formatCurrency(trip.amount)}</span>
                    {trip.tip && trip.tip > 0 && (
                      <span className="trip-tip">+{formatCurrency(trip.tip)} propina</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="trips-empty">
            <p>No hay viajes registrados aún</p>
          </div>
        )}
      </section>

      <style jsx>{`
        .earnings-container {
          min-height: 100vh;
          background: var(--bg-dark);
          padding: 24px 16px;
          max-width: 480px;
          margin: 0 auto;
        }

        .earnings-loading,
        .earnings-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          color: var(--text-primary);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent-gold);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .earnings-empty h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .earnings-empty p {
          margin: 0 0 24px;
          color: var(--text-secondary);
        }

        .retry-button {
          background: var(--accent-gold);
          color: var(--bg-dark);
          border: none;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .retry-button:hover {
          opacity: 0.9;
        }

        .earnings-header {
          margin-bottom: 24px;
        }

        .earnings-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 4px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .weekly-summary {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }

        .summary-main {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .summary-label {
          display: block;
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .summary-amount {
          display: block;
          font-size: 42px;
          font-weight: 700;
          color: var(--accent-gold);
          line-height: 1.1;
        }

        .summary-change {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .change-indicator {
          font-size: 14px;
          font-weight: 600;
        }

        .change-indicator.positive {
          color: var(--admin-accent);
        }

        .change-indicator.negative {
          color: var(--danger);
        }

        .change-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        .summary-secondary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .secondary-item {
          text-align: center;
        }

        .secondary-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .secondary-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .earnings-breakdown {
          margin-bottom: 20px;
        }

        .earnings-breakdown h2,
        .daily-chart h2,
        .trips-list h2 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .breakdown-card {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          border: 1px solid var(--border);
        }

        .breakdown-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .breakdown-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .breakdown-value.tips {
          color: var(--admin-accent);
        }

        .breakdown-value.bonuses {
          color: var(--accent-gold);
        }

        .daily-chart {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }

        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 160px;
          gap: 8px;
          padding-top: 20px;
        }

        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .chart-bar-container {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .chart-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, var(--accent-gold) 0%, var(--admin-accent) 100%);
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          position: relative;
          transition: height 0.3s ease;
        }

        .chart-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .chart-label {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .chart-empty {
          width: 100%;
          text-align: center;
          color: var(--text-muted);
          padding: 40px 0;
        }

        .trips-list {
          margin-bottom: 24px;
        }

        .trips-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trip-card {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 16px;
          border: 1px solid var(--border);
        }

        .trip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .trip-date {
          font-size: 13px;
          color: var(--text-muted);
        }

        .trip-status {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .trip-status.completed {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .trip-status.pending {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }

        .trip-route {
          margin-bottom: 12px;
        }

        .route-point {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .route-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .route-dot.pickup {
          background: var(--admin-accent);
        }

        .route-dot.destination {
          background: var(--accent-gold);
        }

        .route-text {
          font-size: 14px;
          color: var(--text-primary);
        }

        .route-line {
          width: 2px;
          height: 20px;
          background: var(--border);
          margin-left: 4px;
        }

        .trip-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .trip-customer {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .trip-amounts {
          text-align: right;
        }

        .trip-amount {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--accent-gold);
        }

        .trip-tip {
          font-size: 12px;
          color: var(--admin-accent);
        }

        .trips-empty {
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 40px 20px;
          text-align: center;
          border: 1px solid var(--border);
        }

        .trips-empty p {
          margin: 0;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
