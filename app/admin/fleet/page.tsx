'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'

interface Vehicle {
  id: number; name: string; plate: string; category: string; status: string
  driver: string | null; driverInit: string | null
  soatOk: boolean; inspOk: boolean
  year: string | null; capacity: string | null
  trips: number | null
  soatExpiry: string | null; inspExpiry: string | null
  insuranceExpiry: string | null; licenseExpiry: string | null
  docStatus: string; nextService: string | null
}

const categories = [
  { key: 'all', emoji: '🚙', name: 'Todos' },
  { key: 'standard', emoji: '🚙', name: 'Estándar' },
  { key: 'suv', emoji: '🚙', name: 'SUV' },
  { key: 'vip-suv', emoji: '⭐', name: 'VIP SUV' },
  { key: 'luxury', emoji: '🚗', name: 'Lujo' },
  { key: 'van', emoji: '🚐', name: 'Van' },
]

const catTextColors: Record<string, string> = {
  standard: 'var(--ui-fg-muted)', suv: 'var(--ui-info)',
  'vip-suv': 'var(--ui-gold)', luxury: 'var(--ui-gold)', van: 'var(--ui-fg-muted)',
}

const statusEmoji: Record<string, string> = {
  available: '✅', in_service: '🔧', maintenance: '🛠️', offline: '⏳',
}

const statusMapToFleet: Record<string, string> = {
  available: 'available', busy: 'in_service', maintenance: 'maintenance',
  offline: 'offline', suspended: 'offline', inactive: 'offline', pending: 'offline',
}

const getInit = (name: string | null): string => {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const getNextService = (items: (string | null)[]): string | null => {
  const now = new Date()
  let nearest: Date | null = null
  for (const item of items) {
    if (!item) continue
    const d = new Date(item)
    if (d > now && (!nearest || d < nearest)) nearest = d
  }
  if (!nearest) return null
  const diff = Math.ceil((nearest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff <= 30 ? nearest.toLocaleDateString() + ' (pronto)' : nearest.toLocaleDateString()
}

export default function FleetPage() {
  const { t } = useI18n()
  const d = (t.admin as any).fleet ?? {}
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [search, setSearch] = useState('')

  const fetchFleet = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/drivers')
      if (res.ok) {
        const data = await res.json()
        const drivers = (data.drivers || []) as any[]
        const mapped: Vehicle[] = drivers.map((drv: any) => {
          const now = new Date()
          const soatOk = !drv.soat_expiry || new Date(drv.soat_expiry) > now
          const inspOk = !drv.tech_inspection_expiry || new Date(drv.tech_inspection_expiry) > now
          let dbCat = drv.category || 'standard'
          if (dbCat === 'vip') dbCat = 'vip-suv'
          const fleetStatus = statusMapToFleet[drv.status as string] || 'available'
          return {
            id: drv.id,
            name: drv.vehicle || 'Unknown',
            plate: drv.plate || '—',
            category: dbCat,
            status: fleetStatus,
            driver: drv.name || null,
            driverInit: getInit(drv.name),
            soatOk,
            inspOk,
            year: drv.year || null,
            capacity: drv.capacity || null,
            trips: drv.total_trips || 0,
            soatExpiry: drv.soat_expiry || null,
            inspExpiry: drv.tech_inspection_expiry || null,
            insuranceExpiry: drv.insurance_expiry || null,
            licenseExpiry: drv.license_expiry || null,
            docStatus: drv.doc_status || 'valid',
            nextService: getNextService([drv.soat_expiry, drv.tech_inspection_expiry, drv.insurance_expiry, drv.license_expiry]),
          }
        })
        setVehicles(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch fleet', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchFleet() }, [fetchFleet])

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false
      if (search) {
        const q = search.toLowerCase()
        if (!v.name.toLowerCase().includes(q) && !v.plate.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [vehicles, selectedCategory, search])

  const kpi = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    inService: vehicles.filter(v => v.status === 'in_service').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
  }), [vehicles])

  const analytics = useMemo(() => {
    const activeCount = kpi.available + kpi.inService
    const utilization = vehicles.length ? Math.round((activeCount / vehicles.length) * 100) : 0
    const totalTrips = vehicles.reduce((s, v) => s + (v.trips || 0), 0)
    const totalDrivers = vehicles.filter(v => v.driver).length
    const driverUtil = vehicles.length ? Math.round((totalDrivers / vehicles.length) * 100) : 0
    const expiredDocs = vehicles.filter(v => v.docStatus === 'expired').length
    return { utilization, totalTrips, totalDrivers, driverUtil, expiredDocs, activeCount }
  }, [vehicles, kpi])

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'available': return 'admin-badge accent'
      case 'in_service': return 'admin-badge info'
      case 'maintenance': return 'admin-badge warning'
      default: return 'admin-badge neutral'
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '48px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
          <h3>Cargando flota...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Flota</h1>
          <p className="admin-section-desc">Supervisa vehículos, categorías, estado y cumplimiento documental.</p>
        </div>
      </section>
      <div className="admin-grid-6 admin-mb-4">
        {[
          { label: 'Vehículos Totales', value: kpi.total, sub: 'Flota completa', icon: 'green' },
          { label: 'Disponibles', value: kpi.available, sub: 'Listos para despacho', icon: 'green', up: true },
          { label: 'En Servicio', value: kpi.inService, sub: 'Trasferencias activas', icon: 'blue' },
          { label: 'Mantenimiento', value: kpi.maintenance, sub: 'Fuera de servicio', icon: 'amber' },
          { label: 'Desconectados', value: kpi.offline, sub: 'Inactivos o pendientes', icon: 'gray' },
        ].map((card, idx) => (
          <div key={idx} className="admin-kpi-card">
            <div className="admin-kpi-label">{card.label}</div>
            <div className="admin-kpi-value">{card.value}</div>
            <div className="admin-kpi-sub neutral">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Categorías de Vehículo</h2>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {categories.map(cat => {
              const count = cat.key === 'all' ? vehicles.length : vehicles.filter(v => v.category === cat.key).length
              return (
                <div
                  key={cat.key}
                  className="admin-card" style={{ padding: 14, cursor: 'pointer' }}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  <div style={{ fontSize: 24 }}>{cat.emoji}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ui-fg)', marginTop: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)', marginTop: 2 }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <h2 className="admin-card-title">Vehículos</h2>
          <div className="admin-field" style={{ minWidth: 200 }}>
            <label className="admin-field-label">Buscar vehículos</label>
            <input className="admin-input" placeholder={d.searchPlaceholder || 'Buscar vehículos...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-grid-responsive">
            {filtered.length === 0 ? (
              <div className="admin-empty" style={{ padding: '24px 24px', gridColumn: '1 / -1' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
                <h3>{d.noResults || 'No hay vehículos'}</h3>
              </div>
            ) : (
              filtered.map(v => (
                <div key={v.id} className="admin-res-card" onClick={() => setSelectedVehicle(v)} style={{ cursor: 'pointer' }}>
                  <div className="admin-res-card-header">
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--ui-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {statusEmoji[v.status] || '🚙'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{v.plate}</div>
                    </div>
                    <span className={`admin-badge ${getBadgeClass(v.status)}`}>
                      {v.status === 'in_service' ? 'En Servicio' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </span>
                  </div>
                  <div className="admin-res-body">
                    <div className="admin-res-row">
                      <span className="admin-res-label">Categoría</span>
                      <span style={{ fontSize: 12, color: catTextColors[v.category] || 'var(--ui-fg-muted)', fontWeight: 600 }}>
                        {v.category === 'vip-suv' ? 'VIP SUV' : v.category.charAt(0).toUpperCase() + v.category.slice(1)}
                      </span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Conductor</span>
                      <span>{v.driver ? `${v.driverInit} · ${v.driver}` : 'Sin asignar'}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Documentos</span>
                      <span>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: v.soatOk ? 'var(--ui-accent)' : 'var(--ui-danger)', marginRight: 4 }} />
                        SOAT ·
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: v.inspOk ? 'var(--ui-accent)' : 'var(--ui-danger)', marginRight: 4 }} />
                        Insp
                      </span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Viajes</span>
                      <span style={{ fontFamily: 'var(--ui-font-mono)', fontWeight: 600 }}>{v.trips}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Año / Capacidad</span>
                      <span>{v.year || '—'} · {v.capacity || '—'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Análisis de Flota</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-grid-2">
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)', marginBottom: 8 }}>Utilización de Flota</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--ui-font-mono)', color: 'var(--ui-accent)' }}>{analytics.utilization}%</div>
              <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)', marginTop: 4 }}>{analytics.activeCount} de {vehicles.length} vehículos disponibles o en servicio</div>
            </div>
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)', marginBottom: 8 }}>Métricas Clave</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ui-fg-muted)' }}>Viajes totales</span>
                  <span style={{ fontWeight: 600 }}>{analytics.totalTrips.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ui-fg-muted)' }}>Utilización conductores</span>
                  <span style={{ fontWeight: 600 }}>{analytics.driverUtil}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ui-fg-muted)' }}>Alertas cumplimiento</span>
                  <span style={{ fontWeight: 600 }}>{analytics.expiredDocs}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="admin-modal-overlay open" onClick={() => setSelectedVehicle(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{selectedVehicle.name}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedVehicle(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--ui-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {getEmojiForCategory(selectedVehicle.category)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ui-fg)' }}>{selectedVehicle.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)', fontFamily: 'var(--ui-font-mono)' }}>{selectedVehicle.plate}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className={`admin-badge ${getBadgeClass(selectedVehicle.status)}`}>
                      {selectedVehicle.status === 'in_service' ? 'En Servicio' : selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                    </span>
                    <span className="admin-badge gold">{selectedVehicle.category === 'vip-suv' ? 'VIP SUV' : selectedVehicle.category.charAt(0).toUpperCase() + selectedVehicle.category.slice(1)}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Conductor', value: selectedVehicle.driver || 'Sin asignar' },
                  { label: 'Año', value: selectedVehicle.year || '—' },
                  { label: 'Capacidad', value: selectedVehicle.capacity || '—' },
                  { label: 'Viajes', value: selectedVehicle.trips?.toLocaleString() || '0' },
                  { label: 'Próximo servicio', value: selectedVehicle.nextService || 'No programado' },
                ].map(f => (
                  <div key={f.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--ui-border-light)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--ui-fg)', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ui-fg-muted)' }}>Documentos y Cumplimiento</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { name: 'SOAT', status: selectedVehicle.soatExpiry || '—', state: selectedVehicle.soatOk ? 'ok' : 'bad' },
                  { name: 'Inspección Técnica', status: selectedVehicle.inspExpiry || '—', state: selectedVehicle.inspOk ? 'ok' : 'bad' },
                  { name: 'Seguro Vehículo', status: selectedVehicle.insuranceExpiry || '—', state: 'ok' },
                  { name: 'Licencia Conductor', status: selectedVehicle.licenseExpiry || '—', state: 'ok' },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: doc.state === 'ok' ? 'var(--ui-accent-soft)' : 'var(--ui-danger-soft)', color: doc.state === 'ok' ? 'var(--ui-accent)' : 'var(--ui-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {doc.state === 'ok' ? '✅' : '❌'}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ui-fg)' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{doc.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSelectedVehicle(null)}>{d.close || 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getEmojiForCategory(cat: string): string {
  const map: Record<string, string> = { standard: '🚙', suv: '🚙', 'vip-suv': '⭐', luxury: '🚗', van: '🚐' }
  return map[cat] || '🚙'
}
