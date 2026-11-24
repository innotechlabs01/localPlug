'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/admin/admin-fetch'

interface RideOrder {
  id: string
  bookingReference: string
  status: string
  dispatchStatus: string
  paymentStatus: string
  totalAmount: number
  destinationAddress: string
  travelerProfile: string
  guest: { firstName: string; lastName: string; email: string }
  service: { name: string }
  driverAssigned: { id: number; name: string; phone: string } | null
  createdAt: string
}

interface PricingRule {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
  platform_commission_pct: number
  regulation_ref?: string
  last_reviewed_at?: string | null
}

export default function AdminOnDemandRidesPage() {
  const [rides, setRides] = useState<RideOrder[]>([])
  const [pricing, setPricing] = useState<PricingRule[]>([])
  const [savingCat, setSavingCat] = useState<string | null>(null)
  const [pricingMsg, setPricingMsg] = useState<string | null>(null)
  const [pricingError, setPricingError] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchRides = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/reservations?limit=200')
      if (res.ok) {
        const data = await res.json()
        const all: RideOrder[] = data.reservations || []
        setRides(all.filter(r => r.travelerProfile === 'on_demand' || (r.bookingReference || '').startsWith('RIDE-')))
      }
    } catch (err) {
      console.error('[Admin Rides] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/admin/ride-pricing')
      .then(r => r.json())
      .then(prData => { if (Array.isArray(prData.pricing)) setPricing(prData.pricing) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchRides()
    const interval = setInterval(() => {
      if (!document.hidden) fetchRides()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchRides])

  const updatePricingField = (cat: string, field: keyof PricingRule, val: number) => {
    setPricing(prev => prev.map(p => p.category === cat ? { ...p, [field]: val } : p))
  }

  const savePricingRow = async (row: PricingRule) => {
    setSavingCat(row.category)
    setPricingMsg(null)
    setPricingError(false)
    try {
      const res = await fetch('/api/admin/ride-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
      if (res.ok) {
        setPricingError(false)
        setPricingMsg(`Tarifa de ${row.label} actualizada ✓`)
      } else {
        const err = await res.json().catch(() => ({}))
        setPricingError(true)
        setPricingMsg(err.error || 'Solo Super Admin puede editar tarifas')
      }
    } catch {
      setPricingError(true)
      setPricingMsg('Error de red al guardar tarifa')
    } finally {
      setSavingCat(null)
    }
  }

  const syncRegulationDefaults = async () => {
    setSavingCat('__sync__')
    setPricingMsg(null)
    setPricingError(false)
    try {
      const res = await fetch('/api/admin/ride-pricing', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.pricing)) setPricing(data.pricing)
        setPricingError(false)
        setPricingMsg('Piso Res. 202650004167 sincronizado ✓')
      } else {
        setPricingError(true)
        setPricingMsg('Solo Super Admin puede sincronizar tarifas')
      }
    } catch {
      setPricingError(true)
      setPricingMsg('Error de red')
    } finally {
      setSavingCat(null)
    }
  }

  return (
    <div className="admin-page space-y-5">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">On-Demand Rides (Ciudad)</h1>
          <p className="admin-section-desc">
            Seguimiento de viajes solicitados desde la App Cliente (/ride), separados de los traslados programados de Aeropuerto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/maps" className="admin-btn admin-btn-primary admin-btn-sm">
            Ver Mapa GPS en Vivo →
          </Link>
        </div>
      </div>

      <div className="admin-grid-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Total On-Demand</div>
          <div className="admin-kpi-value">{rides.length}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Buscando Conductor</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-warning)' }}>
            {rides.filter(r => !r.driverAssigned && r.status !== 'completed').length}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">En Curso</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-info)' }}>
            {rides.filter(r => r.driverAssigned && r.status !== 'completed').length}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Ingresos (Tarjeta)</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-accent)' }}>
            ${rides.reduce((s, r) => s + Number(r.totalAmount || 0), 0).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Super Admin Dynamic Fare Configuration (Base + Km + Minute + Speed + Commission Split) */}
      <section className="admin-card">
        <div className="admin-card-header admin-flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="admin-card-title">Tarifas Dinámicas On-Demand · Regulación Medellín 2026 (Solo Super Admin)</span>
            <p style={{ fontSize: 11, color: 'var(--ui-fg-muted)', marginTop: 2 }}>
              Referencia: Resolución 202650004167 (revisión mensual recomendada) · Fórmula: max(Mínima, Base + km×$/km + min×$/min)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pricingMsg && (
              <span className={`admin-badge ${pricingError ? 'danger' : 'accent'}`} role={pricingError ? 'alert' : 'status'}>
                {pricingMsg}
              </span>
            )}
            <button
              onClick={syncRegulationDefaults}
              disabled={savingCat === '__sync__'}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              {savingCat === '__sync__' ? 'Sincronizando...' : 'Sincronizar Res. 202650004167'}
            </button>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Base</th>
                  <th>$/km</th>
                  <th>$/min</th>
                  <th>Mínima</th>
                  <th>Vel (km/h)</th>
                  <th>Comisión %</th>
                  <th>Simulador 6km (Cliente / Driver / App)</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map(row => {
                  const exMin = Math.max(4, Math.round((6 / Math.max(10, row.avg_speed_kmh || 28)) * 60))
                  const exTotal = Math.max(row.min_fare_usd, row.base_usd + 6 * row.per_km_usd + exMin * row.per_min_usd)
                  const commPct = Number(row.platform_commission_pct ?? 20)
                  const platUsd = exTotal * (commPct / 100)
                  const driverUsd = exTotal - platUsd
                  return (
                    <tr key={row.category}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--ui-fg-muted)' }}>{row.regulation_ref || 'Res. 202650004167'}</div>
                      </td>
                      <td><input type="number" step="0.25" aria-label={`Tarifa base USD para ${row.label}`} className="admin-input" style={{ width: 68, padding: '4px 6px' }} value={row.base_usd} onChange={e => updatePricingField(row.category, 'base_usd', Number(e.target.value))} /></td>
                      <td><input type="number" step="0.05" aria-label={`Tarifa por km USD para ${row.label}`} className="admin-input" style={{ width: 68, padding: '4px 6px' }} value={row.per_km_usd} onChange={e => updatePricingField(row.category, 'per_km_usd', Number(e.target.value))} /></td>
                      <td><input type="number" step="0.02" aria-label={`Tarifa por minuto USD para ${row.label}`} className="admin-input" style={{ width: 68, padding: '4px 6px' }} value={row.per_min_usd} onChange={e => updatePricingField(row.category, 'per_min_usd', Number(e.target.value))} /></td>
                      <td><input type="number" step="0.5" aria-label={`Tarifa mínima USD para ${row.label}`} className="admin-input" style={{ width: 68, padding: '4px 6px' }} value={row.min_fare_usd} onChange={e => updatePricingField(row.category, 'min_fare_usd', Number(e.target.value))} /></td>
                      <td><input type="number" step="1" aria-label={`Velocidad promedio km/h para ${row.label}`} className="admin-input" style={{ width: 62, padding: '4px 6px' }} value={row.avg_speed_kmh} onChange={e => updatePricingField(row.category, 'avg_speed_kmh', Number(e.target.value))} /></td>
                      <td><input type="number" step="1" min="0" max="50" aria-label={`Comisión de plataforma porcentaje para ${row.label}`} className="admin-input" style={{ width: 62, padding: '4px 6px' }} value={commPct} onChange={e => updatePricingField(row.category, 'platform_commission_pct', Number(e.target.value))} /></td>
                      <td style={{ fontSize: 11.5 }}>
                        <strong style={{ color: 'var(--ui-fg)' }}>${exTotal.toFixed(2)}</strong>
                        <span style={{ color: 'var(--ui-fg-muted)' }}> (~{exMin}m) · </span>
                        <span style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>Driver ${driverUsd.toFixed(2)}</span>
                        <span style={{ color: 'var(--ui-fg-muted)' }}> · </span>
                        <span style={{ color: 'var(--ui-info)', fontWeight: 600 }}>App ${platUsd.toFixed(2)}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => savePricingRow(row)}
                          disabled={savingCat === row.category}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          {savingCat === row.category ? '...' : 'Guardar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">Solicitudes On-Demand</span>
          <span className="admin-badge neutral">{rides.length} viajes</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Destino</th>
                  <th>Conductor</th>
                  <th>Pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--ui-fg-muted)' }}>Cargando...</td></tr>
                ) : rides.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--ui-fg-muted)' }}>Aún no hay viajes on-demand registrados.</td></tr>
                ) : (
                  rides.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.bookingReference}</td>
                      <td>{r.guest.firstName} {r.guest.lastName}</td>
                      <td>{r.service.name} · ${Number(r.totalAmount || 0).toFixed(0)}</td>
                      <td>{r.destinationAddress || '—'}</td>
                      <td>{r.driverAssigned ? r.driverAssigned.name : 'Buscando...'}</td>
                      <td><span className="admin-badge accent">{r.paymentStatus || 'card'}</span></td>
                      <td><span className="admin-badge info">{r.dispatchStatus || r.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
