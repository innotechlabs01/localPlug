'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'

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

const catColors: Record<string, string> = {
  standard: '#6366f1', suv: '#3b82f6', vip: '#d4a84b', luxury: '#10b981', van: '#f59e0b'
}

const statusLabels: Record<string, string> = {
  available: 'Available', busy: 'Assigned', offline: 'Offline', suspended: 'Suspended', pending: 'Pending', inactive: 'Inactive'
}

const statusClasses: Record<string, string> = {
  available: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  busy: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
  offline: 'bg-[rgba(100,104,128,0.15)] text-[#646880]',
  suspended: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  pending: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  inactive: 'bg-[rgba(100,104,128,0.15)] text-[#646880]',
}

const docClasses: Record<string, string> = {
  valid: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  warning: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  expired: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  pending: 'bg-[rgba(100,104,128,0.15)] text-[#646880]',
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
  const [notif, setNotif] = useState<{ id: number; msg: string }[]>([])

  const showToast = (msg: string) => {
    const id = Date.now()
    setNotif(p => [...p, { id, msg }])
    setTimeout(() => setNotif(p => p.filter(n => n.id !== id)), 3000)
  }

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

  const getAvatarColor = (name: string | null, vip?: number) => {
    const hash = (name || '').charCodeAt(0) || 0
    const cs = ['#10b981', '#3b82f6', '#d4a84b', '#6366f1', '#059669', '#0f172a']
    return vip ? 'linear-gradient(135deg, #0f172a, #d4a84b)' : `linear-gradient(135deg, ${cs[hash % cs.length]}, #0f172a)`
  }

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

  const openEditModal = (d: Driver) => {
    setEditDriver(d)
    setFormData({
      name: d.name || '',
      phone: d.phone || '',
      email: d.email || '',
      languages: d.languages || '',
      vehicle: d.vehicle || '',
      plate: d.plate || '',
      category: d.category || '',
      experienceLevel: d.experience_level || '',
      notes: d.notes || '',
      license_expiry: d.license_expiry || '',
      soat_expiry: d.soat_expiry || '',
      tech_inspection_expiry: d.tech_inspection_expiry || '',
      insurance_expiry: d.insurance_expiry || '',
      year: d.year || '',
      capacity: d.capacity || '',
      emergency_contact: d.emergency_contact || '',
      emergency_phone: d.emergency_phone || '',
      city: d.city || '',
      photo_url: d.photo_url || '',
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
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">{d.loading || 'Loading drivers...'}</div>
      </div>
    )
  }

  return (
    <div className="drivers-page" style={{ padding: 0 }}>
      {/* ── HERO ── */}
      <div style={{
        padding: '22px 24px 10px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.02em', fontWeight: 700, color: '#f0f2f5' }}>
            {d.headerTitle || 'Drivers Management'}
          </h1>
          <p style={{ margin: '8px 0 0', color: '#646880', fontSize: 13, maxWidth: 760, lineHeight: 1.55 }}>
            {d.headerDesc || 'Operational driver roster, vehicle eligibility, compliance validation, and assignment readiness for premium airport pickups and VIP tourism services in Medellín.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="px-3 py-2 border border-[#282b38] text-[12px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all font-medium"
            onClick={() => showToast(d.toastCompliance || 'Compliance report queued')}
          >
            {d.exportCompliance || 'Export compliance'}
          </button>
          <button
            className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all"
            onClick={openCreateModal}
          >
            {d.create || 'Create Driver'}
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div style={{
        padding: '0 24px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {[
          ['all', d.filterAll || 'All drivers'],
          ['available', d.filterAvailable || 'Available'],
          ['assigned', d.filterAssigned || 'Assigned'],
          ['pending', d.filterPending || 'Pending verification'],
          ['expired', d.filterExpired || 'Expired documents'],
          ['vip', d.filterVip || 'VIP eligible'],
          ['suspended', d.filterSuspended || 'Suspended'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              border: `1px solid ${filter === key ? '#10b981' : '#282b38'}`,
              background: filter === key ? 'rgba(16,185,129,0.12)' : '#181b25',
              color: filter === key ? '#10b981' : '#646880',
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500,
            }}
            onMouseEnter={e => {
              if (filter !== key) {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.color = '#f0f2f5'
              }
            }}
            onMouseLeave={e => {
              if (filter !== key) {
                e.currentTarget.style.borderColor = '#282b38'
                e.currentTarget.style.color = '#646880'
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI ROW ── */}
      <div style={{
        padding: '0 24px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: 12,
      }}>
        {[
          [d.kpiTotal || 'Total drivers', String(stats.total), d.kpiSubPlus || '+3 this month', true],
          [d.kpiAvailable || 'Available now', String(stats.available), d.kpiSubAirport || 'Airport ready', true],
          [d.kpiAssigned || 'Assigned trips', String(stats.assigned), d.kpiSubServices || 'Live services', false],
          [d.kpiVip || 'VIP eligible', String(stats.vip), d.kpiSubLuxury || 'Luxury certified', true],
          [d.kpiAlerts || 'Compliance alerts', String(stats.alerts), d.kpiSubReview || 'Needs review', false],
          [d.kpiAvgRating || 'Avg rating', stats.avg, d.kpiSubTop || 'Top quartile', true],
        ].map(([label, value, sub, positive], idx) => (
          <div key={`kpi-${idx}`} style={{
            background: '#181b25',
            border: '1px solid #282b38',
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ fontSize: 11, color: '#646880', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f0f2f5', marginTop: 4 }}>{value}</div>
            <div style={{
              fontSize: 11,
              marginTop: 4,
              color: positive ? '#10b981' : '#f59e0b',
            }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── OPS ALERTS + ELIGIBILITY ── */}
      <div style={{
        padding: '0 24px 18px',
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.85fr',
        gap: 12,
      }}>
        {/* Alert panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,80,0.08), transparent 48%), #181b25',
          border: '1px solid #282b38',
          borderRadius: 12,
          padding: '16px 18px',
          display: 'grid',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 700, color: '#f0f2f5' }}>
            <span>{d.alertsTitle || 'Operational compliance alerts'}</span>
            <span style={{
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 700,
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
            }}>
              {d.alertsOpen?.replace('{count}', String(stats.alerts)) || `${stats.alerts} open`}
            </span>
          </div>
          {filteredAlerts.length === 0 ? (
            <p style={{ fontSize: 13, color: '#646880', padding: '24px 0', textAlign: 'center' }}>{d.alertsNone || 'No compliance alerts'}</p>
          ) : (
            filteredAlerts.map(driver => (
              <div key={driver.id} style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid #1e2130',
              }}>
                <span style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: driver.doc_status === 'expired' ? '#ef4450' : '#f59e0b',
                  boxShadow: `0 0 0 4px ${driver.doc_status === 'expired' ? 'rgba(239,68,80,0.12)' : 'rgba(245,158,11,0.12)'}`,
                }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#f0f2f5' }}>{driver.name}</strong>
                  <span style={{ color: '#646880', fontSize: 12 }}>{docReason(driver).join(', ') || 'Documents expired'} — {driver.vehicle} ({driver.plate})</span>
                </div>
                <button
                  style={{
                    padding: '4px 8px', fontSize: 11, color: '#9ca0b0',
                    border: '1px solid #282b38', borderRadius: 8,
                    background: 'transparent', cursor: 'pointer',
                  }}
                  onClick={() => { setSelectedId(driver.id); setFilter('expired') }}
                >
                  {d.alertsReview || 'Review'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Eligibility panel */}
        <div style={{
          background: '#181b25',
          border: '1px solid #282b38',
          borderRadius: 12,
          padding: '16px 18px',
        }}>
          <h3 style={{ fontSize: 13, marginBottom: 12, color: '#f0f2f5', fontWeight: 700 }}>{d.eligibilityTitle || 'Assignment eligibility'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              [drivers.filter(drv => drv.status === 'available').length, d.eligibilityPickup || 'Eligible for airport pickup'],
              [stats.vip, d.eligibilityVip || 'Eligible for VIP guests'],
              [stats.alerts, d.eligibilityRestricted || 'Restricted by compliance'],
              [stats.total ? '6 min' : '—', d.eligibilityEta || 'Avg airport ETA'],
            ].map(([val, lab], idx) => (
              <div key={idx} style={{
                padding: 12,
                border: '1px solid #1e2130',
                borderRadius: 8,
                background: '#0b0d14',
              }}>
                <strong style={{ display: 'block', fontSize: 18, lineHeight: 1.1, color: '#f0f2f5' }}>{val}</strong>
                <span style={{ color: '#646880', fontSize: 11 }}>{lab}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{
        padding: '0 24px 24px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.28fr) minmax(360px, 0.72fr)',
        gap: 16,
        alignItems: 'start',
      }}>
        {/* ── LEFT: DRIVER ROSTER ── */}
        <div style={{
          background: '#181b25',
          border: '1px solid #282b38',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid #1e2130',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: '#f0f2f5' }}>
              <span>{d.rosterTitle || 'Driver roster'}</span>
              <span style={{ color: '#646880', fontWeight: 500, fontSize: 12 }}>{filtered.length} shown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#646880" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  style={{
                    width: 200, padding: '7px 10px 7px 32px', background: '#0b0d14',
                    border: '1px solid #282b38', borderRadius: 8,
                    fontSize: 12, color: '#f0f2f5', outline: 'none',
                  }}
                  placeholder={d.rosterSearch || 'Search drivers, plates, vehicles...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                style={{
                  padding: '7px 12px', border: '1px solid #282b38', borderRadius: 8,
                  fontSize: 12, color: '#9ca0b0', background: 'transparent', cursor: 'pointer',
                }}
                className="hover:bg-[#202330] transition-all"
                onClick={() => showToast('Card view active')}
              >
                Cards
              </button>
              <button
                style={{
                  padding: '7px 12px', border: '1px solid #282b38', borderRadius: 8,
                  fontSize: 12, color: '#9ca0b0', background: 'transparent', cursor: 'pointer',
                }}
                className="hover:bg-[#202330] transition-all"
                onClick={() => showToast('Table view ready for implementation handoff')}
              >
                Table
              </button>
            </div>
          </div>

          <div style={{
            padding: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: '#646880', fontSize: 13 }}>
                {d.rosterNoMatch || 'No drivers match the current filter.'}
              </div>
            ) : filtered.map(drv => {
              const isSelected = drv.id === selectedId
              return (
                <div
                  key={drv.id}
                  style={{
                    border: `1px solid ${isSelected ? '#10b981' : '#1e2130'}`,
                    borderRadius: 12,
                    background: isSelected
                      ? '#202330'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.025), transparent 34%), #0b0d14',
                    padding: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className={isSelected ? '' : 'hover:border-[#10b981] hover:bg-[#202330]'}
                  onClick={() => setSelectedId(drv.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 11, minWidth: 0 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 13,
                        background: getAvatarColor(drv.name, drv.vip_compatible || undefined),
                        flex: '0 0 auto',
                      }}>
                        {getInit(drv.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f2f5' }}>{drv.name}</div>
                        <div style={{ color: '#646880', fontSize: 12, marginTop: 2 }}>{drv.phone}</div>
                        <div style={{ color: '#646880', fontSize: 12, marginTop: 2 }}>{drv.languages} · {drv.city || 'Medellín'}</div>
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                      whiteSpace: 'nowrap',
                      ...(statusClasses[drv.status || ''] ? {
                        background: statusClasses[drv.status || ''].split(' ')[0],
                        color: statusClasses[drv.status || ''].split(' ')[1],
                      } : { background: 'rgba(100,104,128,0.15)', color: '#646880' }),
                    }}>
                      {statusLabels[drv.status || ''] || drv.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                      ...(docClasses[docStatus(drv)] ? {
                        background: docClasses[docStatus(drv)].split(' ')[0],
                        color: docClasses[docStatus(drv)].split(' ')[1],
                      } : { background: 'rgba(16,185,129,0.12)', color: '#10b981' }),
                    }}>
                      {docStatus(drv) === 'valid' ? (d.rosterValid || 'Valid') : docStatus(drv) === 'warning' ? (d.rosterExpiring || 'Expiring soon') : docStatus(drv) === 'expired' ? (d.rosterExpired || 'Expired') : (d.rosterPending || 'Pending')}
                    </span>
                    {drv.vip_compatible === 1 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                        background: 'rgba(212,168,75,0.15)', color: '#d4a84b',
                      }}>
                        {d.rosterVip || 'VIP compatible'}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                    margin: '12px 0',
                  }}>
                    {[
                      [drv.rating || 'New', d.rosterRating || 'Rating'],
                      [drv.total_trips || 0, d.rosterTrips || 'Trips'],
                      [drv.status === 'available' ? '4 min' : drv.active_orders ? 'In service' : '—', d.rosterEta || 'Airport ETA'],
                    ].map(([val, lab], idx) => (
                      <div key={idx} style={{
                        padding: 9, borderRadius: 8,
                        background: '#181b25', border: '1px solid #1e2130',
                      }}>
                        <strong style={{ display: 'block', fontSize: 14, color: '#f0f2f5' }}>{val}</strong>
                        <span style={{ color: '#646880', fontSize: 10.5 }}>{lab}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', gap: 10,
                    paddingTop: 12, borderTop: '1px solid #1e2130',
                    color: '#9ca0b0', fontSize: 12,
                  }}>
                    <span>
                      <strong style={{ color: '#f0f2f5' }}>{drv.vehicle || '—'}</strong><br />
                      {drv.plate} · {drv.year || '—'}
                    </span>
                    <span>
                      {catColors[drv.category || ''] ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: catColors[drv.category || ''] }} />
                          {drv.category}
                        </span>
                      ) : '—'}
                      <br />{drv.capacity || drv.experience_level || '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: SIDE STACK ── */}
        <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 76 }}>
          {/* Profile */}
          <div style={{
            background: '#181b25', border: '1px solid #282b38', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid #1e2130',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f2f5' }}>{d.profileTitle || 'Driver profile'}</span>
              <button
                style={{
                  padding: '4px 8px', fontSize: 11, color: '#9ca0b0',
                  border: '1px solid #282b38', borderRadius: 8,
                  background: 'transparent', cursor: 'pointer',
                }}
                className="hover:bg-[#202330] transition-all"
                onClick={() => {
                  if (window.confirm('Suspend driver access?')) {
                    showToast(d.toastStatus || 'Driver status updated and audit log recorded')
                  }
                }}
              >
                {d.profileActions || 'Actions'}
              </button>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {!selected ? (
                <p style={{ fontSize: 13, color: '#646880', textAlign: 'center', padding: '24px 0' }}>
                  {d.profileSelect || 'Select a driver to view profile'}
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 68, height: 68, borderRadius: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 21,
                      background: getAvatarColor(selected.name, selected.vip_compatible || undefined),
                      flex: '0 0 auto',
                    }}>
                      {selected.photo_url ? (
                        <img src={selected.photo_url} alt={selected.name || ''} style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} />
                      ) : getInit(selected.name)}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f0f2f5' }}>{selected.name}</h2>
                      <div style={{ color: '#646880', fontSize: 12, marginTop: 3 }}>
                        {(selected.category || d.profileStandard || 'Standard')} · {selected.plate}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                          ...(statusClasses[selected.status || ''] ? {
                            background: statusClasses[selected.status || ''].split(' ')[0],
                            color: statusClasses[selected.status || ''].split(' ')[1],
                          } : { background: 'rgba(100,104,128,0.15)', color: '#646880' }),
                        }}>
                          {statusLabels[selected.status || ''] || selected.status}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                          ...(docClasses[docStatus(selected)] ? {
                            background: docClasses[docStatus(selected)].split(' ')[0],
                            color: docClasses[docStatus(selected)].split(' ')[1],
                          } : { background: 'rgba(16,185,129,0.12)', color: '#10b981' }),
                        }}>
                          {docStatus(selected) === 'valid' ? (d.profileValid || 'Valid') : docStatus(selected) === 'warning' ? (d.profileExpiring || 'Expiring soon') : (d.profileExpired || 'Expired')}
                        </span>
                        {selected.vip_compatible === 1 && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                            background: 'rgba(212,168,75,0.15)', color: '#d4a84b',
                          }}>
                            {d.profileVip || 'VIP services'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16,
                  }}>
                    {[
                      [d.profileEmail || 'Email', selected.email || '—'],
                      [d.profilePhone || 'Phone', selected.phone || '—'],
                      [d.profileLanguages || 'Languages', selected.languages || '—'],
                      [d.profileAssignment || 'Current assignment', selected.active_orders ? `${selected.active_orders} active` : 'Unassigned'],
                      [d.profileVehicle || 'Vehicle', selected.vehicle || '—'],
                      [d.profileCapacity || 'Capacity', selected.capacity || selected.experience_level || '—'],
                      [d.profileLastActive || 'Last active', selected.status === 'available' ? 'Online' : selected.status === 'busy' ? 'In service' : '—'],
                      [d.profileEligibility || 'Eligibility', docStatus(selected) === 'valid' && selected.status !== 'suspended' ? (d.profileAllowed || 'Assignment allowed') : (d.profileRestricted || 'Assignment restricted')],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label style={{
                          display: 'block', fontSize: 10, color: '#646880',
                          textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3,
                        }}>{label}</label>
                        <div style={{ fontSize: 13, lineHeight: 1.45, color: '#f0f2f5' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compliance */}
          <div style={{
            background: '#181b25', border: '1px solid #282b38', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid #1e2130',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f2f5' }}>{d.complianceTitle || 'Compliance validation'}</span>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {!selected ? (
                <p style={{ fontSize: 13, color: '#646880', textAlign: 'center', padding: '16px 0' }}>
                  {d.complianceNone || 'No driver selected'}
                </p>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[
                      [d.complianceLicense || 'Driver license', selected.license_expiry || d.complianceValid || 'Valid'],
                      [d.complianceSoat || 'SOAT insurance', selected.soat_expiry || d.complianceValid || 'Valid'],
                      [d.complianceInspection || 'Technical inspection', selected.tech_inspection_expiry || d.complianceValid || 'Valid'],
                      [d.complianceInsurance || 'Vehicle insurance', selected.insurance_expiry || d.complianceValid || 'Valid'],
                    ].map(([name, value]) => {
                      const lower = value.toLowerCase()
                      const s = lower.includes('expir') ? 'warning' : lower.includes('expired') || lower.includes('missing') ? 'expired' : 'valid'
                      return (
                        <div key={name} style={{
                          display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
                          padding: '10px 0', borderBottom: '1px solid #1e2130',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#f0f2f5' }}>{name}</div>
                            <div style={{ color: '#646880', fontSize: 11, marginTop: 2 }}>{value}</div>
                          </div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                            ...(docClasses[s] ? {
                              background: docClasses[s].split(' ')[0],
                              color: docClasses[s].split(' ')[1],
                            } : { background: 'rgba(16,185,129,0.12)', color: '#10b981' }),
                          }}>
                            {s === 'valid' ? (d.complianceValid || 'Valid') : s === 'warning' ? (d.complianceExpiring || 'Expiring') : (d.complianceExpired || 'Expired')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{
                    marginTop: 14, padding: 12, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    ...(docStatus(selected) === 'valid'
                      ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
                      : docStatus(selected) === 'expired'
                        ? { background: 'rgba(239,68,80,0.12)', color: '#ef4450' }
                        : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
                    ),
                  }}>
                    {docStatus(selected) === 'valid'
                      ? (d.complianceOk || 'Driver is operationally eligible for assignment.')
                      : docStatus(selected) === 'expired'
                        ? (d.complianceBlocked || 'Assignment blocked until compliance is restored.')
                        : (d.complianceWarn || 'Driver can be monitored but needs verification before assignment.')}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Performance */}
          <div style={{
            background: '#181b25', border: '1px solid #282b38', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid #1e2130',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f2f5' }}>{d.perfTitle || 'Performance & condition'}</span>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {!selected ? (
                <p style={{ fontSize: 13, color: '#646880', textAlign: 'center', padding: '16px 0' }}>
                  {d.perfNone || 'No driver selected'}
                </p>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '82px 1fr', gap: 14, alignItems: 'center',
                  }}>
                    <div style={{
                      width: 82, height: 82, borderRadius: '50%',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 800, fontSize: 18, color: '#f0f2f5',
                      position: 'relative',
                      background: `conic-gradient(#10b981 ${Math.round((selected.rating || 0) * 20)}%, #1e2130 0)`,
                    }}>
                      <div style={{
                        position: 'absolute', inset: 8, borderRadius: '50%', background: '#181b25',
                      }} />
                      <span style={{ position: 'relative', zIndex: 1 }}>{Math.round((selected.rating || 0) * 20)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f0f2f5' }}>{d.perfScore || 'Vehicle condition score'}</div>
                      <div style={{ color: '#646880', fontSize: 12, marginTop: 4 }}>
                        {d.perfScoreDesc || 'Cleanliness, interior, exterior, and mechanical inspection summary.'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                    {[
                      [d.perfTrips || 'Trips completed', String(selected.total_trips || 0), Math.min((selected.total_trips || 0) / 4, 92)],
                      [d.perfRevenue || 'Revenue generated', `$${(selected.total_trips || 0) * 68}`, Math.min((selected.total_trips || 0) / 4, 78)],
                      [d.perfVip || 'VIP services completed', String(selected.vip_compatible ? Math.round((selected.total_trips || 0) * 0.45) : 0), selected.vip_compatible ? 84 : 34],
                      [d.perfCancel || 'Cancellation rate', selected.total_trips ? '3.2%' : '0%', selected.total_trips ? 68 : 100],
                      [d.perfSatisfaction || 'Customer satisfaction', String(selected.rating || 'New'), selected.rating ? Math.round(selected.rating * 20) : 0],
                    ].map(([name, value, pct]) => (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: '#f0f2f5' }}>{name}</span>
                          <strong style={{ color: '#f0f2f5' }}>{value}</strong>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: '#1e2130', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 'inherit', background: '#10b981',
                            width: `${pct}%`, transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── CREATE DRIVER MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, zIndex: 500,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              width: 'min(900px, 100%)', maxHeight: '90vh', overflow: 'auto',
              borderRadius: 16, background: '#0b0d14',
              border: '1px solid #282b38',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid #282b38',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: '#f0f2f5' }}>
                  {editDriver ? (d.modalEdit || 'Edit driver') : (d.modalCreate || 'Create driver')}
                </h2>
                <p style={{ color: '#646880', fontSize: 12, marginTop: 4 }}>
                  {editDriver ? (d.modalEditDesc || 'Update driver information. All changes will be logged.') : (d.modalCreateDesc || 'Guided registration for driver, vehicle, documents, and compliance review.')}
                </p>
              </div>
              <button
                style={{ color: '#646880', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Visual stepper */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 18 }}>
                {[
                  d.modalStep1 || '1 Personal',
                  d.modalStep2 || '2 Emergency',
                  d.modalStep3 || '3 License',
                  d.modalStep4 || '4 Vehicle',
                  d.modalStep5 || '5 Docs',
                  d.modalStep6 || '6 Review',
                ].map((stepLabel, idx) => {
                  const stepNum = idx + 1
                  return (
                    <div key={stepNum} style={{
                      border: `1px solid ${createStep >= stepNum ? '#10b981' : '#282b38'}`,
                      background: createStep >= stepNum ? 'rgba(16,185,129,0.12)' : '#181b25',
                      color: createStep >= stepNum ? '#10b981' : '#646880',
                      borderRadius: 8, padding: 10, fontSize: 11, fontWeight: 700, textAlign: 'center',
                    }}>
                      {stepLabel}
                    </div>
                  )
                })}
              </div>

              {/* Step navigation */}
              <p style={{ fontSize: 12, color: '#646880', marginBottom: 16 }}>
                {`Step ${createStep} of 6`}
              </p>

              {/* Step 1: Personal */}
              {createStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalName || 'Full name'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalNamePlace || 'e.g. Alejandro Restrepo'} value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>ID / passport</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder="CC 1.037.***" /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalPhone || 'Phone'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalPhonePlace || '+57 300 000 0000'} value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalEmail || 'Email'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalEmailPlace || 'driver@company.com'} value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalLang || 'Languages'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalLangPlace || 'Spanish, English, Portuguese'} value={formData.languages || ''} onChange={e => setFormData(p => ({ ...p, languages: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicleType || 'Vehicle type'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }}
                      value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">{d.modalTypePlace || 'Select type...'}</option>
                      <option value="vip">{d.modalTypeVip || 'VIP SUV'}</option>
                      <option value="luxury">{d.modalTypeLuxury || 'Luxury'}</option>
                      <option value="suv">{d.modalTypeSuv || 'SUV'}</option>
                      <option value="van">{d.modalTypeVan || 'Van'}</option>
                      <option value="standard">{d.modalTypeStandard || 'Standard'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalLicense || 'License expiration'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.license_expiry || ''} onChange={e => setFormData(p => ({ ...p, license_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalSoat || 'SOAT expiration'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.soat_expiry || ''} onChange={e => setFormData(p => ({ ...p, soat_expiry: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>'Other expirations'</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <div><label style={{ display: 'block', fontSize: 10, color: '#646880', marginBottom: 4 }}>{d.modalInspection || 'Tech inspection'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.tech_inspection_expiry || ''} onChange={e => setFormData(p => ({ ...p, tech_inspection_expiry: e.target.value }))} /></div>
                      <div><label style={{ display: 'block', fontSize: 10, color: '#646880', marginBottom: 4 }}>{d.modalInsurance || 'Insurance'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.insurance_expiry || ''} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} /></div>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>Document uploads</label>
                    <div style={{
                      minHeight: 86, border: '1px dashed #282b38', borderRadius: 8,
                      display: 'grid', placeItems: 'center', textAlign: 'center',
                      color: '#646880', background: '#0b0d14', fontSize: 12,
                    }}>
                      Drop license, SOAT, technical inspection, insurance, vehicle photos
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalNotes || 'Operational notes'}</label>
                    <textarea rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none', resize: 'none' }}
                      placeholder={d.modalNotesPlace || 'VIP handling notes, airport authorization, language preferences...'}
                      value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 2: Emergency */}
              {createStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalEmergContact || 'Emergency contact'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalEmergPlace || 'Contact name'} value={formData.emergency_contact || ''} onChange={e => setFormData(p => ({ ...p, emergency_contact: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalEmergPhone || 'Emergency phone'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalEmergPhonePlace || '+57 300 000 0000'} value={formData.emergency_phone || ''} onChange={e => setFormData(p => ({ ...p, emergency_phone: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalExpLevel || 'Experience level'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }}
                      value={formData.experienceLevel || ''} onChange={e => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}>
                      <option value="">{d.modalExpPlace || 'Select...'}</option>
                      <option value="Standard">{d.modalExpStd || 'Standard'}</option>
                      <option value="Senior">{d.modalExpSenior || 'Senior'}</option>
                      <option value="Lead">{d.modalExpLead || 'Lead'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalCity || 'City'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalCityPlace || 'e.g. Medellín'} value={formData.city || ''} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 3: License & docs */}
              {createStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalLicense || 'License expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.license_expiry || ''} onChange={e => setFormData(p => ({ ...p, license_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalSoat || 'SOAT expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.soat_expiry || ''} onChange={e => setFormData(p => ({ ...p, soat_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalInspection || 'Tech inspection'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.tech_inspection_expiry || ''} onChange={e => setFormData(p => ({ ...p, tech_inspection_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalInsurance || 'Insurance expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} value={formData.insurance_expiry || ''} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 4: Vehicle */}
              {createStep === 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicle || 'Vehicle'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalVehiclePlace || 'e.g. Mercedes V-Class'} value={formData.vehicle || ''} onChange={e => setFormData(p => ({ ...p, vehicle: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalPlate || 'Plate'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalPlatePlace || 'e.g. ABC-123'} value={formData.plate || ''} onChange={e => setFormData(p => ({ ...p, plate: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicleType || 'Vehicle type'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }}
                      value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">{d.modalTypePlace || 'Select type...'}</option>
                      <option value="standard">{d.modalTypeStandard || 'Standard'}</option>
                      <option value="suv">{d.modalTypeSuv || 'SUV'}</option>
                      <option value="vip">{d.modalTypeVip || 'VIP SUV'}</option>
                      <option value="luxury">{d.modalTypeLuxury || 'Luxury'}</option>
                      <option value="van">{d.modalTypeVan || 'Van'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalYear || 'Vehicle year'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalYearPlace || 'e.g. 2024'} value={formData.year || ''} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalCapacity || 'Capacity'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalCapacityPlace || 'e.g. 4 pax'} value={formData.capacity || ''} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalPhotoUrl || 'Photo URL'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none' }} placeholder={d.modalPhotoPlace || 'https://example.com/photo.jpg'} value={formData.photo_url || ''} onChange={e => setFormData(p => ({ ...p, photo_url: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 5: Docs & Notes */}
              {createStep === 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>Document uploads</label>
                    <div style={{
                      minHeight: 86, border: '1px dashed #282b38', borderRadius: 8,
                      display: 'grid', placeItems: 'center', textAlign: 'center',
                      color: '#646880', background: '#0b0d14', fontSize: 12,
                    }}>
                      Drop license, SOAT, technical inspection, insurance, vehicle photos
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#646880', marginBottom: 6, fontWeight: 600 }}>{d.modalNotes || 'Operational notes'}</label>
                    <textarea rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: '#181b25', color: '#f0f2f5', outline: 'none', resize: 'none' }}
                      placeholder={d.modalNotesPlace || 'VIP handling notes...'}
                      value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {createStep === 6 && (
                <div style={{
                  padding: 16, background: '#181b25', border: '1px solid #282b38',
                  borderRadius: 8, marginTop: 4, fontSize: 13, color: '#9ca0b0', lineHeight: 1.65,
                }}>
                  'Review all driver information before saving. All actions will be logged.'
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
                    {[
                      ['Name', formData.name], ['Phone', formData.phone], ['Email', formData.email],
                      ['Languages', formData.languages], ['Vehicle', formData.vehicle], ['Plate', formData.plate],
                      ['Type', formData.category], ['City', formData.city],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: 10, color: '#646880', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</label>
                        <div style={{ fontSize: 13, color: '#f0f2f5' }}>{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                paddingTop: 16, marginTop: 16, borderTop: '1px solid #282b38',
              }}>
                {createStep > 1 ? (
                  <button
                    style={{
                      padding: '10px 16px', border: '1px solid #282b38', borderRadius: 8,
                      fontSize: 13, color: '#9ca0b0', background: 'transparent', cursor: 'pointer',
                    }}
                    className="hover:bg-[#202330] transition-all"
                    onClick={() => setCreateStep(s => s - 1)}
                  >
                    'Back'
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 10 }}>
                  {createStep < 6 ? (
                    <button
                      style={{
                        padding: '10px 20px', background: '#10b981', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                      className="hover:bg-[#059669] transition-all"
                      onClick={() => setCreateStep(s => s + 1)}
                    >
                      'Next'
                    </button>
                  ) : (
                    <>
                      <button
                        style={{
                          padding: '10px 16px', border: '1px solid #282b38', borderRadius: 8,
                          fontSize: 13, color: '#9ca0b0', background: 'transparent', cursor: 'pointer',
                        }}
                        className="hover:bg-[#202330] transition-all"
                        onClick={() => setModalOpen(false)}
                      >
                        {d.modalCancel || 'Cancel'}
                      </button>
                      <button
                        style={{
                          padding: '10px 16px', border: '1px solid #282b38', borderRadius: 8,
                          fontSize: 13, color: '#9ca0b0', background: 'transparent', cursor: 'pointer',
                        }}
                        className="hover:bg-[#202330] transition-all"
                        onClick={() => showToast(d.toastDraft || 'Draft saved')}
                      >
                        {d.modalDraft || 'Save draft'}
                      </button>
                      <button
                        style={{
                          padding: '10px 20px', background: '#10b981', color: '#fff',
                          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}
                        className="hover:bg-[#059669] transition-all"
                        onClick={handleSubmit}
                      >
                        {editDriver ? (d.modalUpdate || 'Update Driver') : (d.modalSubmit || 'Submit for review')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'grid', gap: 8, zIndex: 800 }}>
        {notif.map(n => (
          <div key={n.id} style={{
            background: '#181b25', border: '1px solid #282b38', color: '#f0f2f5',
            padding: '12px 16px', borderRadius: 12, fontSize: 13, zIndex: 800,
          }}>
            {n.msg}
          </div>
        ))}
      </div>
    </div>
  )
}


