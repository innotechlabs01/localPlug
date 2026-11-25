'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminFetch } from '@/lib/admin/admin-fetch'

interface LiveDriver {
  id: number
  name: string
  phone: string | null
  vehicle: string | null
  plate: string | null
  category: string | null
  status: string
  lat: number | null
  lng: number | null
  heading: number | null
  speed: number | null
  gps_updated_at: string | null
  hasGps: boolean
  active_order_id: number | null
  booking_reference: string | null
  customer_name: string | null
  flight_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  destination_address: string | null
  dispatch_status: string | null
  targetName: string
  targetLat: number
  targetLng: number
  distanceKm: number | null
  etaMinutes: number | null
  panic_alert_id?: number | null
  panic_note?: string | null
  panic_created_at?: string | null
}

const DEFAULT_CENTER = { lat: 6.2088, lng: -75.567 }

export default function AdminMapsPage() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string>('')

  const fetchLive = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/maps/live')
      if (res.ok) {
        const data = await res.json()
        const list: LiveDriver[] = data.drivers || []
        setDrivers(list)
        setLastSync(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        setSelectedId(prev => prev ?? (list.find(d => d.hasGps)?.id ?? list[0]?.id ?? null))
      }
    } catch (err) {
      console.error('[Maps] Live fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const interval = setInterval(() => {
      if (!document.hidden) fetchLive()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchLive])

  const selected = drivers.find(d => d.id === selectedId) || null
  const withGps = drivers.filter(d => d.hasGps)
  const onTrip = drivers.filter(d => d.active_order_id != null)
  const panicDrivers = drivers.filter(d => d.panic_alert_id != null)

  const resolvePanic = async (alertId: number) => {
    try {
      const res = await fetch('/api/driver/panic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      if (res.ok) fetchLive()
    } catch { /* ignore */ }
  }

  const mapLat = selected?.hasGps && selected.lat != null ? selected.lat : DEFAULT_CENTER.lat
  const mapLng = selected?.hasGps && selected.lng != null ? selected.lng : DEFAULT_CENTER.lng
  const delta = 0.035
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(mapLng - delta).toFixed(5)},${(mapLat - delta).toFixed(5)},${(mapLng + delta).toFixed(5)},${(mapLat + delta).toFixed(5)}&layer=mapnik&marker=${mapLat.toFixed(5)},${mapLng.toFixed(5)}`

  return (
    <div className="admin-page space-y-5">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Live GPS Map</h1>
          <p className="admin-section-desc">
            Ubicación en tiempo real de conductores con GPS activo y tiempo estimado de llegada (ETA) al destino.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="admin-badge neutral">Actualizado {lastSync}</span>
          )}
          <button onClick={fetchLive} className="admin-btn admin-btn-secondary admin-btn-sm">
            Actualizar ahora
          </button>
        </div>
      </div>

      {/* Active SOS / Panic Alert Banner */}
      {panicDrivers.length > 0 && (
        <div role="alert" style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(239, 68, 80, 0.16)',
          border: '2px solid #ef4450',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {panicDrivers.map(pd => (
            <div key={pd.panic_alert_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4450' }}>
                  🚨 ALERTA DE PÁNICO (SOS) — {pd.name} ({pd.plate || 'Sin placa'})
                </div>
                <div style={{ fontSize: 12, color: 'var(--ui-fg)' }}>
                  {pd.panic_note || 'El conductor activó el botón de pánico'} · Tel: <strong>{pd.phone || '—'}</strong>
                  {pd.customer_name ? ` · Pasajero: ${pd.customer_name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedId(pd.id)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Ver en Mapa
                </button>
                <button
                  onClick={() => pd.panic_alert_id && resolvePanic(pd.panic_alert_id)}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  style={{ background: '#ef4450', borderColor: '#ef4450' }}
                >
                  Marcar Atendida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-grid-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Conductores Activos</div>
          <div className="admin-kpi-value">{drivers.length}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Con GPS en Vivo</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-accent)' }}>{withGps.length}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">En Ruta / Asignados</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-info)' }}>{onTrip.length}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">ETA Seleccionado</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-warning)' }}>
            {selected?.etaMinutes != null ? `~${selected.etaMinutes} min` : '—'}
          </div>
        </div>
      </div>

      <div className="drivers-layout">
        {/* Left: Driver List */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>Conductores</span>
              <span className="count">{drivers.length}</span>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-[13px] text-[var(--ui-fg-secondary)]">Cargando conductores...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-[var(--ui-fg-secondary)]">No hay conductores activos.</div>
            ) : (
              drivers.map(drv => (
                <div
                  key={drv.id}
                  onClick={() => setSelectedId(drv.id)}
                  className={`driver-card ${selectedId === drv.id ? 'active' : ''}`}
                >
                  <div className="driver-head">
                    <div>
                      <div className="driver-name">{drv.name}</div>
                      <div className="driver-meta">
                        {drv.vehicle || 'Vehículo'} {drv.plate ? `· ${drv.plate}` : ''}
                      </div>
                    </div>
                    <span className={`admin-badge ${drv.panic_alert_id ? 'danger' : drv.hasGps ? 'accent' : 'neutral'}`}>
                      {drv.panic_alert_id ? '🚨 SOS PÁNICO' : drv.hasGps ? '● GPS Live' : 'Sin GPS'}
                    </span>
                  </div>
                  {drv.customer_name && (
                    <div className="text-[12px] text-[var(--ui-fg)] mb-2">
                      Pasajero: <strong>{drv.customer_name}</strong> {drv.flight_number ? `· Vuelo ${drv.flight_number}` : ''}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[var(--ui-fg-secondary)]">
                    <span>Destino: {drv.destination_address || drv.targetName}</span>
                    {drv.etaMinutes != null ? (
                      <strong style={{ color: 'var(--ui-accent)' }}>
                        {drv.distanceKm} km · ~{drv.etaMinutes} min
                      </strong>
                    ) : (
                      <span>Esperando GPS del conductor</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Live Map + Telemetry */}
        <div className="side-stack">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <span>{selected ? `Mapa: ${selected.name}` : 'Mapa Medellín / Rionegro'}</span>
              </div>
              {selected?.hasGps && selected.lat != null && selected.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Abrir en Google Maps ↗
                </a>
              )}
            </div>
            <div style={{ width: '100%', height: 420, background: 'var(--ui-bg-secondary)' }}>
              <iframe
                title="Live Driver Map"
                src={osmUrl}
                style={{ width: '100%', height: '100%', border: 0 }}
                loading="lazy"
              />
            </div>
            {selected && (
              <div className="p-4 border-t border-[var(--ui-border)] info-grid">
                <div className="info-item">
                  <label>Estado GPS</label>
                  <div>{selected.hasGps ? 'Activo (en tiempo real)' : 'Conductor aún no activa GPS'}</div>
                </div>
                <div className="info-item">
                  <label>ETA Estimado</label>
                  <div>{selected.etaMinutes != null ? `~${selected.etaMinutes} min (${selected.distanceKm} km)` : '—'}</div>
                </div>
                <div className="info-item">
                  <label>Destino</label>
                  <div>{selected.destination_address || selected.targetName}</div>
                </div>
                <div className="info-item">
                  <label>Teléfono Conductor</label>
                  <div>{selected.phone || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
