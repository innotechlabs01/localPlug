'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Driver {
  id: number; name: string | null; phone: string | null; photo: string | null
  photo_url: string | null; email: string | null; vehicle: string | null; plate: string | null
  category: string | null; status: string | null; rating: number | null
  languages: string | null; experience_level: string | null
  total_trips: number | null; vip_compatible: number | null
  notes: string | null; created_at: string; active_orders?: number
  license_expiry?: string | null; soat_expiry?: string | null
  tech_inspection_expiry?: string | null; insurance_expiry?: string | null
  year?: string | null; capacity?: string | null; emergency_contact?: string | null
  emergency_phone?: string | null; city?: string | null; doc_status?: string | null
}

const statusLabels: Record<string, string> = {
  available: 'Disponible', busy: 'Asignado', offline: 'Desconectado', suspended: 'Suspendido', pending: 'Pendiente', inactive: 'Inactivo'
}

const statusClasses: Record<string, string> = {
  available: 'admin-badge accent',
  busy: 'admin-badge info',
  offline: 'admin-badge neutral',
  suspended: 'admin-badge danger',
  pending: 'admin-badge warning',
  inactive: 'admin-badge',
}

const docClasses: Record<string, string> = {
  valid: 'admin-badge accent',
  warning: 'admin-badge warning',
  expired: 'admin-badge danger',
  pending: 'admin-badge neutral',
}

export default function DriversPage() {
  const { t } = useI18n()
  const d = t.admin.drivers
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const { showToast } = useToast()

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/drivers')
      if (res.ok) {
        const data = await res.json()
        setDrivers(data.drivers || [])
      }
    } catch (err) {
      console.error('Failed to fetch drivers', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const selected = useMemo(() => drivers.find(d => d.id === selectedId), [drivers, selectedId])

  const stats = useMemo(() => ({
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    assigned: drivers.filter(d => d.status === 'busy').length,
    vip: drivers.filter(d => d.vip_compatible === 1).length,
    alerts: drivers.filter(d => d.doc_status === 'expired' || d.doc_status === 'warning').length,
    avg: drivers.length ? (drivers.reduce((s, d) => s + (d.rating || 0), 0) / drivers.filter(d => d.rating).length).toFixed(1) : '—',
  }), [drivers])

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      if (!search && filter === 'all') return true
      const q = search.toLowerCase()
      const matchSearch = !search || [
        d.name, d.phone, d.vehicle, d.plate, d.languages
      ].filter(Boolean).join(' ').toLowerCase().includes(q)
      if (!matchSearch) return false
      if (filter === 'all') return true
      if (filter === 'available') return d.status === 'available'
      if (filter === 'assigned') return d.status === 'busy'
      if (filter === 'pending') return d.doc_status === 'pending' || d.status === 'pending'
      if (filter === 'expired') return d.doc_status === 'expired'
      if (filter === 'vip') return d.vip_compatible === 1
      if (filter === 'suspended') return d.status === 'suspended'
      return true
    })
  }, [drivers, search, filter])

  const alertDrivers = useMemo(() =>
    drivers.filter(d => d.doc_status === 'expired' || d.doc_status === 'warning'), [drivers])

  const filteredAlerts = useMemo(() =>
    alertDrivers.filter(d => d.id !== selectedId).slice(0, 3), [alertDrivers, selectedId])

  const getInit = (name: string | null) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

  const docStatus = (d: Driver): string => {
    if (d.doc_status) return d.doc_status
    return 'valid'
  }

  const docReason = (driver: Driver): string[] => {
    const reasons: string[] = []
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const check = (label: string, val: string | null | undefined) => {
      if (!val) return
      const date = new Date(val)
      if (date < now) reasons.push(label)
      else if (date <= in30Days) reasons.push(`${label} (soon)`)
    }
    check('License', driver.license_expiry)
    check('SOAT', driver.soat_expiry)
    check('Inspection', driver.tech_inspection_expiry)
    check('Insurance', driver.insurance_expiry)
    return reasons.length ? reasons : [d.alertsExpired || 'Documents expired']
  }

  const openCreateModal = () => {
    setEditDriver(null)
    setFormData({})
    setCreateStep(1)
    setModalOpen(true)
  }

  const openEditModal = (driver: Driver) => {
    setEditDriver(driver)
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      languages: driver.languages || '',
      vehicle: driver.vehicle || '',
      plate: driver.plate || '',
      category: driver.category || '',
      experienceLevel: driver.experience_level || '',
      notes: driver.notes || '',
      license_expiry: driver.license_expiry || '',
      soat_expiry: driver.soat_expiry || '',
      tech_inspection_expiry: driver.tech_inspection_expiry || '',
      insurance_expiry: driver.insurance_expiry || '',
      year: driver.year || '',
      capacity: driver.capacity || '',
      emergency_contact: driver.emergency_contact || '',
      emergency_phone: driver.emergency_phone || '',
      city: driver.city || '',
      photo_url: driver.photo_url || '',
    })
    setCreateStep(1)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editDriver) {
        const res = await adminFetch('/api/admin/drivers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editDriver.id, ...formData }),
        })
        if (res.ok) {
          showToast(d.toastUpdated || 'Driver updated successfully')
          setModalOpen(false)
          fetchDrivers()
        } else {
          showToast(d.toastUpdateFail || 'Failed to update driver')
        }
      } else {
        const res = await adminFetch('/api/admin/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          showToast(d.toastCreated || 'Driver created successfully')
          setModalOpen(false)
          setFormData({})
          fetchDrivers()
        } else {
          showToast(d.toastCreateFail || 'Failed to create driver')
        }
      }
    } catch {
      showToast(d.toastError || 'Error saving driver')
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '48px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <h3>{d.loading || 'Loading drivers...'}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      {/* Hero */}
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">{d.headerTitle || 'Conductores'}</h1>
          <p className="admin-section-desc">
            {d.headerDesc || 'Plantilla operativa de conductores, elegibilidad de vehículos, validación de cumplimiento y preparación para asignaciones.'}
          </p>
        </div>
        <div className="admin-flex-between" style={{ gap: 8 }}>
          <button
            onClick={() => showToast(d.toastCompliance || 'Reporte de cumplimiento encolado')}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            {d.exportCompliance || 'Exportar cumplimiento'}
          </button>
          <button onClick={openCreateModal} className="admin-btn admin-btn-primary admin-btn-sm">
            {d.create || 'Crear Conductor'}
          </button>
        </div>
      </section>

      {/* Filter chips */}
      <div className="admin-flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['all', d.filterAll || 'Todos los conductores'],
            ['available', d.filterAvailable || 'Disponibles'],
            ['assigned', d.filterAssigned || 'Asignados'],
            ['pending', d.filterPending || 'Pendiente verificación'],
            ['expired', d.filterExpired || 'Documentos expirados'],
            ['vip', d.filterVip || 'Elegible VIP'],
            ['suspended', d.filterSuspended || 'Suspendido'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`admin-tab ${filter === key ? 'active' : ''}`} style={{ padding: '6px 14px', fontSize: 12 }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="admin-grid-6 admin-mt-4">
        {[
          [d.kpiTotal || 'Total conductores', String(stats.total), d.kpiSubPlus || '+3 este mes'],
          [d.kpiAvailable || 'Disponibles ahora', String(stats.available), d.kpiSubAirport || 'Listos aeropuerto', true],
          [d.kpiAssigned || 'Viajes asignados', String(stats.assigned), d.kpiSubServices || 'Servicios activos', false],
          [d.kpiVip || 'Elegible VIP', String(stats.vip), d.kpiSubLuxury || 'Certificado lujo', true],
          [d.kpiAlerts || 'Alertas cumplimiento', String(stats.alerts), d.kpiSubReview || 'Requieren revisión', false],
          [d.kpiAvgRating || 'Calificación prom.', stats.avg, d.kpiSubTop || 'Cuartel superior', true],
        ].map(([label, value, sub], idx) => (
          <div key={`kpi-${idx}`} className="admin-kpi-card">
            <div className="admin-kpi-label">{label}</div>
            <div className="admin-kpi-value">{value}</div>
            <div className="admin-kpi-sub neutral">{sub}</div>
          </div>
        ))}
      </div>

      {/* Ops alerts + eligibility */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.alertsTitle || 'Alertas de cumplimiento operativo'}</span>
          <span className="admin-badge warning">{d.alertsOpen?.replace('{count}', String(stats.alerts)) || `${stats.alerts} abiertas`}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-grid-2">
            {/* Alert panel */}
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)', marginBottom: 12 }}>
                {d.alertsTitle || 'Alertas de cumplimiento'}
              </div>
              {filteredAlerts.length === 0 ? (
                <p style={{ color: 'var(--ui-fg-muted)', fontSize: 13, textAlign: 'center', padding: '16px' }}>
                  {d.alertsNone || 'No hay alertas de cumplimiento'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredAlerts.map(driver => (
                    <div key={driver.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                      <span
                        className="status-dot"
                        style={{ width: 8, height: 8, borderRadius: '50%', background: driver.doc_status === 'expired' ? 'var(--ui-danger)' : 'var(--ui-warning)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)' }}>{driver.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                          {docReason(driver).join(', ') || 'Documentos expirados'} — {driver.vehicle} ({driver.plate})
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedId(driver.id); setFilter('expired') }}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        {d.alertsReview || 'Revisar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Eligibility panel */}
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)', marginBottom: 12 }}>
                {d.eligibilityTitle || 'Elegibilidad de asignación'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  [drivers.filter(drv => drv.status === 'available').length, d.eligibilityPickup || 'Elegible aeropuerto'],
                  [stats.vip, d.eligibilityVip || 'Elegible VIP'],
                  [stats.alerts, d.eligibilityRestricted || 'Restringido cumplimiento'],
                  ['6 min', d.eligibilityEta || 'ETA promedio'],
                ].map(([val, lab], idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ui-fg)' }}>{val}</div>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{lab}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.rosterTitle || 'Plantilla de conductores'}</span>
          <span className="admin-badge neutral">{filtered.length} mostrados</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-flex-between admin-mb-4" style={{ gap: 8, alignItems: 'center' }}>
            <div className="admin-field" style={{ minWidth: 220 }}>
              <label className="admin-field-label">{d.rosterSearch || 'Buscar conductores, placas, vehículos...'}</label>
              <input
                className="admin-input"
                placeholder={d.rosterSearch || 'Buscar conductores, placas, vehículos...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => showToast('Vista tarjetas activa')} className="admin-btn admin-btn-secondary admin-btn-sm">Tarjetas</button>
              <button onClick={() => showToast('Vista tabla lista')} className="admin-btn admin-btn-secondary admin-btn-sm">Tabla</button>
            </div>
          </div>
          <div className="admin-grid-responsive">
            {filtered.length === 0 ? (
              <div className="admin-empty" style={{ padding: '32px 24px', gridColumn: '1 / -1' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
                <h3>{d.rosterNoMatch || 'No hay conductores que coincidan con los filtros'}</h3>
              </div>
            ) : (
              filtered.map(drv => (
                <div
                  key={drv.id}
                  className="admin-res-card"
                  onClick={() => setSelectedId(drv.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="admin-res-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ui-accent), var(--ui-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>
                        {drv.photo_url ? (
                          <img src={drv.photo_url} alt={drv.name || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : getInit(drv.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{drv.name}</div>
                        {drv.vip_compatible && <span className="admin-badge gold">VIP</span>}
                      </div>
                    </div>
                    <span className={`admin-badge ${statusClasses[drv.status || '']}`}>
                      {statusLabels[drv.status || ''] || drv.status}
                    </span>
                  </div>
                  <div className="admin-res-body">
                    <div className="admin-res-row">
                      <span className="admin-res-label">{d.rosterValid || 'Documentos'}</span>
                      <span className={`admin-badge ${docClasses[docStatus(drv)] || 'admin-badge neutral'}`}>
                        {docStatus(drv) === 'valid' ? (d.rosterValid || 'Válido') : docStatus(drv) === 'warning' ? (d.rosterExpiring || 'Expirando') : docStatus(drv) === 'expired' ? (d.rosterExpired || 'Expirado') : (d.rosterPending || 'Pendiente')}
                      </span>
                    </div>
                    {drv.vip_compatible === 1 && (
                      <div className="admin-res-row">
                        <span className="admin-res-label">VIP</span>
                        <span className="admin-badge gold">{d.rosterVip || 'VIP'}</span>
                      </div>
                    )}
                    <div className="admin-res-row">
                      <span className="admin-res-label">{d.rosterRating || 'Calificación'}</span>
                      <span style={{ fontFamily: 'var(--ui-font-mono)', fontWeight: 600 }}>{drv.rating || 'Nuevo'}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">{d.rosterTrips || 'Viajes'}</span>
                      <span style={{ fontFamily: 'var(--ui-font-mono)', fontWeight: 600 }}>{drv.total_trips || 0}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">{d.rosterEta || 'ETA'}</span>
                      <span>{drv.status === 'available' ? '4 min' : drv.active_orders ? 'En servicio' : '—'}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Vehículo</span>
                      <span style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 12 }}>{drv.vehicle || '—'}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Placa / Año</span>
                      <span style={{ fontSize: 12 }}>{drv.plate} · {drv.year || '—'}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Capacidad / Exp.</span>
                      <span style={{ fontSize: 12 }}>{drv.capacity || drv.experience_level || '—'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Right side stack (profile) moved below on responsive */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.profileTitle || 'Perfil del conductor'}</span>
        </div>
        <div className="admin-card-body">
          {!selected ? (
            <div className="admin-empty" style={{ padding: '32px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>{d.profileSelect || 'Selecciona un conductor para ver el perfil'}</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ui-accent), var(--ui-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 16 }}>
                    {selected.photo_url ? (
                      <img src={selected.photo_url} alt={selected.name || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : getInit(selected.name)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ui-fg)' }}>{selected.name}</h2>
                    <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>
                      {(selected.category || d.profileStandard || 'Estándar')} · {selected.plate}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span className={`admin-badge ${statusClasses[selected.status || '']}`}>
                        {statusLabels[selected.status || ''] || selected.status}
                      </span>
                      <span className={`admin-badge ${docClasses[docStatus(selected)] || 'admin-badge neutral'}`}>
                        {docStatus(selected) === 'valid' ? (d.profileValid || 'Válido') : docStatus(selected) === 'warning' ? (d.profileExpiring || 'Expirando pronto') : (d.profileExpired || 'Expirado')}
                      </span>
                      {selected.vip_compatible === 1 && (
                        <span className="admin-badge gold">{d.profileVip || 'Servicios VIP'}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    [d.profileEmail || 'Email', selected.email || '—'],
                    [d.profilePhone || 'Teléfono', selected.phone || '—'],
                    [d.profileLanguages || 'Idiomas', selected.languages || '—'],
                    [d.profileAssignment || 'Asignación actual', selected.active_orders ? `${selected.active_orders} activo(s)` : 'Sin asignar'],
                    [d.profileVehicle || 'Vehículo', selected.vehicle || '—'],
                    [d.profileCapacity || 'Capacidad', selected.capacity || selected.experience_level || '—'],
                    [d.profileLastActive || 'Último activo', selected.status === 'available' ? 'Conectado' : selected.status === 'busy' ? 'En servicio' : '—'],
                    [d.profileEligibility || 'Elegibilidad', docStatus(selected) === 'valid' && selected.status !== 'suspended' ? (d.profileAllowed || 'Asignación permitida') : (d.profileRestricted || 'Asignación restringida')],
                  ].map(([label, value], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ui-border-light)' }}>
                      <span style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--ui-fg)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
                <div className="admin-field">
                  <label className="admin-field-label">Nombre completo</label>
                  <input className="admin-input" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Juan Pérez" />
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">Teléfono</label>
                    <input className="admin-input" value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+57 300 123 4567" />
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">Email</label>
                    <input className="admin-input" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="driver@email.com" />
                  </div>
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">Vehículo</label>
                    <input className="admin-input" value={formData.vehicle || ''} onChange={e => setFormData(p => ({ ...p, vehicle: e.target.value }))} placeholder="Toyota Fortuner" />
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">Placa</label>
                    <input className="admin-input" value={formData.plate || ''} onChange={e => setFormData(p => ({ ...p, plate: e.target.value }))} placeholder="ABC-123" />
                  </div>
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">Categoría</label>
                    <select className="admin-select" value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="standard">Estándar</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="luxury">Lujo</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">Experiencia</label>
                    <select className="admin-select" value={formData.experienceLevel || ''} onChange={e => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}>
                      <option value="Standard">Estándar</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Idiomas</label>
                  <input className="admin-input" value={formData.languages || ''} onChange={e => setFormData(p => ({ ...p, languages: e.target.value }))} placeholder="Español, Inglés" />
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Notas</label>
                  <textarea className="admin-input" rows={2} value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Notas internas..." />
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">{editDriver ? 'Guardar Cambios' : 'Crear Conductor'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
