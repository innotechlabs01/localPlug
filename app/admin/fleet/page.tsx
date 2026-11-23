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
  { key: 'all', emoji: '\u{1F697}', name: 'All' },
  { key: 'standard', emoji: '\u{1F697}', name: 'Standard' },
  { key: 'suv', emoji: '\u{1F699}', name: 'SUV' },
  { key: 'vip-suv', emoji: '\u2B50', name: 'VIP SUV' },
  { key: 'luxury', emoji: '\u{1F451}', name: 'Luxury' },
  { key: 'van', emoji: '\u{1F690}', name: 'Van' },
]

const catColors: Record<string, string> = {
  standard: 'var(--border)', suv: 'var(--info-soft)',
  'vip-suv': 'var(--gold-soft)', luxury: 'var(--gold-soft)', van: 'var(--border)',
}

const catTextColors: Record<string, string> = {
  standard: 'var(--fg-muted)', suv: 'var(--info)',
  'vip-suv': 'var(--gold)', luxury: 'var(--gold)', van: 'var(--fg-muted)',
}

const statusEmoji: Record<string, string> = {
  available: '\u2705', in_service: '\u{1F504}', maintenance: '\u{1F527}', offline: '\u23F8\uFE0F',
}

const statusMapToFleet: Record<string, string> = {
  available: 'available', busy: 'in_service', maintenance: 'maintenance',
  offline: 'offline', suspended: 'offline', inactive: 'offline', pending: 'offline',
}

const getEmojiForCategory = (cat: string): string => {
  const found = categories.find(c => c.key === cat)
  return found ? found.emoji : '\u{1F697}'
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
  return diff <= 30 ? nearest.toLocaleDateString() + ' (soon)' : nearest.toLocaleDateString()
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
      case 'available': return 'badge badge-accent'
      case 'in_service': return 'badge badge-info'
      case 'maintenance': return 'badge badge-warning'
      default: return 'badge'
    }
  }

  const kpiIcons = {
    total: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/></svg>`,
    available: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg>`,
    inService: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    maintenance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    offline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">Loading fleet data...</div>
      </div>
    )
  }

  return (
    <div className="fleet-page">
      {/* ── KPI ROW ── */}
      <div>
        <div className="section-title">Fleet Overview</div>
        <div className="kpi-fleet-grid">
          {[
            { label: d.kpiTotal || 'Total Vehicles', value: kpi.total, sub: 'Entire fleet', icon: kpiIcons.total, iconClass: 'green' },
            { label: d.kpiAvailable || 'Available', value: kpi.available, sub: 'Ready for dispatch', icon: kpiIcons.available, iconClass: 'green', up: true },
            { label: d.kpiInService || 'In Service', value: kpi.inService, sub: 'Active transfers', icon: kpiIcons.inService, iconClass: 'blue' },
            { label: d.kpiMaintenance || 'Under Maintenance', value: kpi.maintenance, sub: 'Out of service', icon: kpiIcons.maintenance, iconClass: 'amber' },
            { label: d.kpiOffline || 'Offline', value: kpi.offline, sub: 'Inactive or pending', icon: kpiIcons.offline, iconClass: 'gray' },
          ].map((card, idx) => (
            <div key={idx} className="kpi-fleet-card">
              <div className="kpi-top">
                <div className={`kpi-icon ${card.iconClass}`} dangerouslySetInnerHTML={{ __html: card.icon }} />
              </div>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">{card.value}</div>
              <div className={`kpi-sub${card.up ? ' up' : ''}`} style={{ color: card.up ? 'var(--accent)' : 'var(--fg-muted)' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VEHICLE CATEGORIES ── */}
      <div>
        <div className="section-title">Vehicle Categories</div>
        <div className="category-grid">
          {categories.map(cat => {
            const count = cat.key === 'all' ? vehicles.length : vehicles.filter(v => v.category === cat.key).length
            return (
              <div
                key={cat.key}
                className={`category-card ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                <span className="category-emoji">{cat.emoji}</span>
                <div className="category-name">{cat.name}</div>
                <div className="category-count">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── VEHICLE CARDS ── */}
      <div>
        <div className="section-title">
          All Vehicles
          <div className="dp-search-bar" style={{ margin: 0, marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder={d.searchPlaceholder || 'Search vehicles...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
        <div className="vehicle-grid">
          {filtered.length === 0 ? (
            <div className="text-fg-muted text-center py-12" style={{ gridColumn: '1 / -1' }}>{d.noResults || 'No vehicles found'}</div>
          ) : filtered.map(v => (
            <div
              key={v.id}
              className="vehicle-card"
              onClick={() => setSelectedVehicle(v)}
            >
              <div className="vehicle-image">{statusEmoji[v.status] || '\u{1F697}'}</div>
              <div className="vehicle-name">{v.name}</div>
              <div className="vehicle-plate">{v.plate}</div>
              <div className="vehicle-meta">
                <span className="badge" style={{ fontSize: 9, background: catColors[v.category] || 'var(--border)', color: catTextColors[v.category] || 'var(--fg-muted)' }}>
                  {v.category === 'vip-suv' ? 'VIP SUV' : v.category.charAt(0).toUpperCase() + v.category.slice(1)}
                </span>
                <span className={getBadgeClass(v.status)} style={{ fontSize: 9 }}>
                  {v.status === 'in_service' ? 'In Service' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </div>
              <div className="vehicle-footer">
                <div className="vehicle-driver">
                  {v.driver ? (
                    <>
                      <span className="av">{v.driverInit}</span>
                      <span>{v.driver}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--fg-muted)' }}>Unassigned</span>
                  )}
                </div>
                <div>
                  <span className={`health-dot ${v.soatOk ? 'ok' : 'bad'}`} style={{ marginRight: 3 }}></span>
                  SOAT · <span className={`health-dot ${v.inspOk ? 'ok' : 'bad'}`} style={{ marginRight: 3 }}></span>
                  Insp
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLEET ANALYTICS ── */}
      <div>
        <div className="section-title">Fleet Analytics</div>
        <div className="fleet-analytics" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="analytics-card">
            <div className="card-header"><span className="card-title">Fleet Utilization</span></div>
            <div className="card-body">
              <div className="util-number">{analytics.utilization}%</div>
              <div className="util-label">Active fleet rate</div>
              <div className="util-gauge">
                <div className="ring">{analytics.utilization}</div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{analytics.activeCount} of {vehicles.length} vehicles</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>available or in service today</div>
                </div>
              </div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="card-header"><span className="card-title">Key Metrics</span></div>
            <div className="card-body">
              <div className="metric-item"><span className="label">Total trips</span><span className="value">{analytics.totalTrips.toLocaleString()}</span></div>
              <div className="metric-item"><span className="label">Driver utilization</span><span className="value">{analytics.driverUtil}%</span></div>
              <div className="metric-item"><span className="label">Compliance alerts</span><span className="value">{analytics.expiredDocs}</span></div>
              <div className="metric-item"><span className="label">Active vehicles</span><span className="value">{analytics.activeCount}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VEHICLE DETAIL MODAL ── */}
      {selectedVehicle && (
        <div className="modal-overlay open" onClick={() => setSelectedVehicle(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedVehicle.name}</span>
              <button className="icon-btn" onClick={() => setSelectedVehicle(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Vehicle Detail Header */}
              <div className="vehicle-detail-header">
                <div className="vehicle-detail-image">{getEmojiForCategory(selectedVehicle.category)}</div>
                <div className="vehicle-detail-info">
                  <h3>{selectedVehicle.name}</h3>
                  <div className="plate">{selectedVehicle.plate}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className={getBadgeClass(selectedVehicle.status)}>
                      {selectedVehicle.status === 'in_service' ? 'In Service' : selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                    </span>
                    <span className="badge badge-gold">{selectedVehicle.category === 'vip-suv' ? 'VIP SUV' : selectedVehicle.category.charAt(0).toUpperCase() + selectedVehicle.category.slice(1)}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Driver', value: selectedVehicle.driver || 'Unassigned' },
                  { label: 'Year', value: selectedVehicle.year || '—' },
                  { label: 'Capacity', value: selectedVehicle.capacity || '—' },
                  { label: 'Trips', value: selectedVehicle.trips?.toLocaleString() || '0' },
                  { label: 'Next Service', value: selectedVehicle.nextService || 'Not scheduled' },
                ].map(f => (
                  <div key={f.label} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Documents & Compliance */}
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--fg-muted)', marginBottom: 8 }}>Documents & Compliance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {[
                  { name: 'SOAT Insurance', status: selectedVehicle.soatExpiry || '—', state: selectedVehicle.soatOk ? 'ok' : 'bad' },
                  { name: 'Technical Inspection', status: selectedVehicle.inspExpiry || '—', state: selectedVehicle.inspOk ? 'ok' : 'bad' },
                  { name: 'Vehicle Insurance', status: selectedVehicle.insuranceExpiry || '—', state: 'ok' },
                  { name: 'Driver License', status: selectedVehicle.licenseExpiry || '—', state: 'ok' },
                ].map((doc, i) => {
                  const icon = doc.state === 'ok' ? '\u2705' : '\u274C'
                  const cls = doc.state === 'ok' ? 'green' : 'blue'
                  return (
                    <div key={i} className="detail-doc">
                      <div className={`detail-doc-icon ${cls}`}>{icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{doc.status}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedVehicle(null)}>{d.close || 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
