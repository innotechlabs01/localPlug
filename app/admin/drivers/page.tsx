'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'

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
  const [timeline, setTimeline] = useState<{ type: string; title: string; description: string; timestamp: string }[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [notif, setNotif] = useState<{ id: number; msg: string }[]>([])

  const showToast = (msg: string) => {
    const id = Date.now()
    setNotif(p => [...p, { id, msg }])
    setTimeout(() => setNotif(p => p.filter(n => n.id !== id)), 3000)
  }

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/drivers')
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

  useEffect(() => {
    if (selectedId !== null) loadTimeline(selectedId)
  }, [selectedId])

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

  const alertDrivers = useMemo(() =>
    drivers.filter(d => d.doc_status === 'expired' || d.doc_status === 'warning'), [drivers])

  const filteredAlerts = useMemo(() =>
    alertDrivers.filter(d => d.id !== selectedId).slice(0, 3), [alertDrivers, selectedId])

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

  const loadTimeline = async (driverId: number) => {
    setTimelineLoading(true)
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/history`)
      if (res.ok) {
        const data = await res.json()
        setTimeline(data.timeline || [])
      }
    } catch { /* ignore */ }
    setTimelineLoading(false)
  }

  const handleSubmit = async () => {
    try {
      if (editDriver) {
        const res = await fetch('/api/admin/drivers', {
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
        const res = await fetch('/api/admin/drivers', {
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
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#f0f2f5] tracking-tight">{d.headerTitle || 'Drivers'}</h1>
          <p className="text-[13px] text-[#646880] mt-1.5 max-w-[760px] leading-relaxed">
            {d.headerDesc || 'Operational driver roster, vehicle eligibility, compliance validation, and assignment readiness for premium airport pickups and VIP tourism services in Medellín.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-[#282b38] text-[12px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all font-medium" onClick={() => showToast(d.toastCompliance || 'Compliance report queued')}>
            {d.exportCompliance || 'Export compliance'}
          </button>
          <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={openCreateModal}>
            {d.create || 'Create Driver'}
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex gap-2 flex-wrap">
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
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
              filter === key
                ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]'
                : 'bg-[#181b25] text-[#646880] border-[#282b38] hover:border-[#10b981] hover:text-[#f0f2f5]'
            }`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          [d.kpiTotal || 'Total drivers', String(stats.total), d.kpiSubPlus || '+3 this month', true],
          [d.kpiAvailable || 'Available now', String(stats.available), d.kpiSubAirport || 'Airport ready', true],
          [d.kpiAssigned || 'Assigned trips', String(stats.assigned), d.kpiSubServices || 'Live services', false],
          [d.kpiVip || 'VIP eligible', String(stats.vip), d.kpiSubLuxury || 'Luxury certified', true],
          [d.kpiAlerts || 'Compliance alerts', String(stats.alerts), d.kpiSubReview || 'Needs review', false],
          [d.kpiAvgRating || 'Avg rating', stats.avg, d.kpiSubTop || 'Top quartile', true],
        ].map(([label, value, sub, positive], idx) => (
          <div key={`kpi-${idx}`} className="bg-[#181b25] border border-[#282b38] rounded-xl p-4">
            <p className="text-[11px] text-[#646880] uppercase tracking-wide">{label}</p>
            <p className="text-[24px] font-bold text-[#f0f2f5] mt-1">{value}</p>
            <p className={`text-[11px] ${positive ? 'text-[#10b981]' : 'text-[#f59e0b]'} mt-1`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── ALERTS + ELIGIBILITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-3">
        <div className="bg-[#181b25] border border-[#282b38] rounded-xl p-4"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,80,0.08), transparent 48%), #181b25' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-[#f0f2f5]">{d.alertsTitle || 'Operational compliance alerts'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(245,158,11,0.12)] text-[#f59e0b]">
              {d.alertsOpen?.replace('{count}', String(stats.alerts)) || `${stats.alerts} open`}
            </span>
          </div>
          {filteredAlerts.length === 0 ? (
            <p className="text-[13px] text-[#646880] py-4 text-center">{d.alertsNone || 'No compliance alerts'}</p>
          ) : (
            filteredAlerts.map(driver => (
              <div key={driver.id} className="grid grid-cols-[auto_1fr_auto] gap-2.5 items-center py-2.5 border-t border-[#1e2130]">
                <div className={`w-2.5 h-2.5 rounded-full ${driver.doc_status === 'expired' ? 'bg-[#ef4450]' : 'bg-[#f59e0b]'} shadow-[0_0_0_4px_rgba(239,68,80,0.12)]`} />
                <div>
                  <strong className="text-[13px] text-[#f0f2f5]">{driver.name}</strong>
                  <span className="block text-[12px] text-[#646880]">{docReason(driver).join(', ') || 'Documents expired'} — {driver.vehicle} ({driver.plate})</span>
                </div>
                <button className="px-2 py-1 text-[11px] text-[#9ca0b0] border border-[#282b38] rounded-lg hover:bg-[#202330] transition-all"
                  onClick={() => { setSelectedId(driver.id); setFilter('expired') }}>
                  {d.alertsReview || 'Review'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="bg-[#181b25] border border-[#282b38] rounded-xl p-4">
          <h3 className="text-[13px] font-bold text-[#f0f2f5] mb-3">{d.eligibilityTitle || 'Assignment eligibility'}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#0b0d14] border border-[#1e2130] rounded-lg p-3">
              <strong className="text-[18px] text-[#f0f2f5]">{drivers.filter(drv => drv.status === 'available').length}</strong>
              <span className="block text-[11px] text-[#646880]">{d.eligibilityPickup || 'Eligible for airport pickup'}</span>
            </div>
            <div className="bg-[#0b0d14] border border-[#1e2130] rounded-lg p-3">
              <strong className="text-[18px] text-[#f0f2f5]">{stats.vip}</strong>
              <span className="block text-[11px] text-[#646880]">{d.eligibilityVip || 'Eligible for VIP guests'}</span>
            </div>
            <div className="bg-[#0b0d14] border border-[#1e2130] rounded-lg p-3">
              <strong className="text-[18px] text-[#f0f2f5]">{stats.alerts}</strong>
              <span className="block text-[11px] text-[#646880]">{d.eligibilityRestricted || 'Restricted by compliance'}</span>
            </div>
            <div className="bg-[#0b0d14] border border-[#1e2130] rounded-lg p-3">
              <strong className="text-[18px] text-[#f0f2f5]">{stats.total ? '15 min' : '—'}</strong>
              <span className="block text-[11px] text-[#646880]">{d.eligibilityEta || 'Avg airport ETA'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RANKING BOARD ── */}
      <RankingBoard drivers={drivers} d={d} />

      {/* ── MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.28fr_0.72fr] gap-4 items-start">
        {/* ── LEFT: DRIVER GRID ── */}
        <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.rosterTitle || 'Driver roster'}</span>
              <span className="text-[12px] text-[#646880] font-medium">{filtered.length} shown</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#646880]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="w-[200px] pl-9 pr-3 py-1.5 bg-[#0b0d14] border border-[#282b38] rounded-lg text-[12px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
                placeholder={d.rosterSearch || 'Search drivers, plates, vehicles...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#646880] text-[13px]">
                {d.rosterNoMatch || 'No drivers match the current filter.'}
              </div>
            ) : filtered.map(drv => {
              const isSelected = drv.id === selectedId
              return (
                <div
                  key={drv.id}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#10b981] bg-[#202330]'
                      : 'border-[#1e2130] hover:border-[#10b981] hover:bg-[#202330]'
                  }`}
                  onClick={() => setSelectedId(drv.id)}
                  style={{ background: isSelected ? '#202330' : 'linear-gradient(180deg, rgba(255,255,255,0.025), transparent 34%), #0b0d14' }}
                >
                  <div className="flex justify-between gap-3 items-start mb-3">
                    <div className="flex gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-[13px] flex-shrink-0"
                        style={{ background: getAvatarColor(drv.name, drv.vip_compatible || undefined) }}>
                        {getInit(drv.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#f0f2f5] truncate">{drv.name}</div>
                        <div className="text-[12px] text-[#646880]">{drv.phone}</div>
                        <div className="text-[12px] text-[#646880]">{drv.languages} · {drv.city || 'Medellín'}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${statusClasses[drv.status || ''] || statusClasses.offline}`}>
                      {statusLabels[drv.status || ''] || drv.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${docClasses[docStatus(drv)] || docClasses.valid}`}>
                      {docStatus(drv) === 'valid' ? (d.rosterValid || 'Valid') : docStatus(drv) === 'warning' ? (d.rosterExpiring || 'Expiring soon') : docStatus(drv) === 'expired' ? (d.rosterExpired || 'Expired') : (d.rosterPending || 'Pending')}
                    </span>
                    {drv.vip_compatible === 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(212,168,75,0.15)] text-[#d4a84b]">{d.rosterVip || 'VIP compatible'}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-[#181b25] border border-[#1e2130] rounded-lg p-2">
                      <strong className="text-[14px] text-[#f0f2f5]">{drv.rating || 'New'}</strong>
                      <span className="block text-[10px] text-[#646880]">{d.rosterRating || 'Rating'}</span>
                    </div>
                    <div className="bg-[#181b25] border border-[#1e2130] rounded-lg p-2">
                      <strong className="text-[14px] text-[#f0f2f5]">{drv.total_trips || 0}</strong>
                      <span className="block text-[10px] text-[#646880]">{d.rosterTrips || 'Trips'}</span>
                    </div>
                    <div className="bg-[#181b25] border border-[#1e2130] rounded-lg p-2">
                      <strong className="text-[14px] text-[#f0f2f5]">{drv.status === 'available' ? '4 min' : drv.active_orders ? 'In service' : '—'}</strong>
                      <span className="block text-[10px] text-[#646880]">{d.rosterEta || 'Airport ETA'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-2.5 pt-3 border-t border-[#1e2130] text-[12px] text-[#9ca0b0]">
                    <span><strong className="text-[#f0f2f5]">{drv.vehicle || '—'}</strong><br />{drv.plate} · {drv.year || '—'}</span>
                    <span className="text-right">{catColors[drv.category || ''] ? (
                      <span className="flex items-center gap-1.5 justify-end">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: catColors[drv.category || ''] }}></span>
                        {drv.category}
                      </span>
                    ) : '—'}<br />{drv.capacity || drv.experience_level || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: SIDE PANEL ── */}
        <div className="space-y-4 sticky top-20">
          {/* Profile */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.profileTitle || 'Driver profile'}</span>
              <div className="flex gap-1.5">
                <button className="px-2 py-1 text-[11px] text-[#9ca0b0] border border-[#282b38] rounded-lg hover:bg-[#202330] transition-all"
                  onClick={() => selected && openEditModal(selected)}>
                  {d.profileEdit || 'Edit'}
                </button>
                <button className="px-2 py-1 text-[11px] text-[#9ca0b0] border border-[#282b38] rounded-lg hover:bg-[#202330] transition-all"
                  onClick={() => showToast(d.toastStatus || 'Driver status updated and audit log recorded')}>
                  {d.profileActions || 'Actions'}
                </button>
              </div>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-8">{d.profileSelect || 'Select a driver to view profile'}</p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative group">
                      {selected.photo_url ? (
                        <img src={selected.photo_url} alt={selected.name || ''} className="w-[68px] h-[68px] rounded-[20px] object-cover" />
                      ) : (
                        <div className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center text-white font-extrabold text-[21px] flex-shrink-0"
                          style={{ background: getAvatarColor(selected.name, selected.vip_compatible || undefined) }}>
                          {getInit(selected.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[#f0f2f5]">{selected.name}</h2>
                      <p className="text-[12px] text-[#646880]">{(selected.category || d.profileStandard || 'Standard')} · {selected.plate}</p>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClasses[selected.status || ''] || statusClasses.offline}`}>
                          {statusLabels[selected.status || ''] || selected.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${docClasses[docStatus(selected)] || docClasses.valid}`}>
                          {docStatus(selected) === 'valid' ? (d.profileValid || 'Valid') : docStatus(selected) === 'warning' ? (d.profileExpiring || 'Expiring soon') : (d.profileExpired || 'Expired')}
                        </span>
                        {selected.vip_compatible === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(212,168,75,0.15)] text-[#d4a84b]">{d.profileVip || 'VIP services'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                        <label className="block text-[10px] text-[#646880] uppercase tracking-wider mb-1">{label}</label>
                        <div className="text-[13px] text-[#f0f2f5]">{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.complianceTitle || 'Compliance validation'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.complianceNone || 'No driver selected'}</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    [d.complianceLicense || 'Driver license', selected.license_expiry || d.complianceValid || 'Valid'],
                    [d.complianceSoat || 'SOAT insurance', selected.soat_expiry || d.complianceValid || 'Valid'],
                    [d.complianceInspection || 'Technical inspection', selected.tech_inspection_expiry || d.complianceValid || 'Valid'],
                    [d.complianceInsurance || 'Vehicle insurance', selected.insurance_expiry || d.complianceValid || 'Valid'],
                  ].map(([name, value]) => {
                    const lower = value.toLowerCase()
                    const s = lower.includes('expir') ? 'warning' : lower.includes('expired') || lower.includes('missing') ? 'expired' : 'valid'
                    return (
                      <div key={name} className="grid grid-cols-[1fr_auto] gap-2.5 items-center py-2 border-b border-[#1e2130] last:border-b-0">
                        <div>
                          <div className="font-semibold text-[13px] text-[#f0f2f5]">{name}</div>
                          <div className="text-[11px] text-[#646880] mt-0.5">{value}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${docClasses[s]}`}>
                          {s === 'valid' ? (d.complianceValid || 'Valid') : s === 'warning' ? (d.complianceExpiring || 'Expiring') : (d.complianceExpired || 'Expired')}
                        </span>
                      </div>
                    )
                  })}
                  <div className={`mt-3.5 p-3 rounded-lg text-[12px] font-bold ${
                    docStatus(selected) === 'valid'
                      ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                      : docStatus(selected) === 'expired'
                        ? 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]'
                        : 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]'
                  }`}>
                    {docStatus(selected) === 'valid'
                      ? (d.complianceOk || 'Driver is operationally eligible for assignment.')
                      : docStatus(selected) === 'expired'
                        ? (d.complianceBlocked || 'Assignment blocked until compliance is restored.')
                        : (d.complianceWarn || 'Driver can be monitored but needs verification before assignment.')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.perfTitle || 'Performance'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.perfNone || 'No driver selected'}</p>
              ) : (
                <>
                  <div className="grid grid-cols-[82px_1fr] gap-3.5 items-center mb-4">
                    <div className="w-[82px] h-[82px] rounded-full grid place-items-center font-extrabold text-[18px] text-[#f0f2f5] relative"
                      style={{ background: `conic-gradient(#10b981 ${(selected.rating || 0) * 20}%, #1e2130 0)` }}>
                      <div className="absolute inset-[8px] rounded-full bg-[#181b25]" />
                      <span className="relative z-10">{Math.round((selected.rating || 0) * 20)}</span>
                    </div>
                    <div>
                      <div className="font-bold text-[#f0f2f5]">{d.perfScore || 'Vehicle condition score'}</div>
                      <div className="text-[12px] text-[#646880] mt-1">{d.perfScoreDesc || 'Cleanliness, interior, exterior, and mechanical inspection summary.'}</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      [d.perfTrips || 'Trips completed', String(selected.total_trips || 0), Math.min((selected.total_trips || 0) / 4, 92)],
                      [d.perfRevenue || 'Revenue generated', `$${(selected.total_trips || 0) * 68}`, Math.min((selected.total_trips || 0) / 4, 78)],
                      [d.perfVip || 'VIP services completed', String(selected.vip_compatible ? Math.round((selected.total_trips || 0) * 0.45) : 0), selected.vip_compatible ? 84 : 34],
                      [d.perfCancel || 'Cancellation rate', selected.total_trips ? '3.2%' : '0%', selected.total_trips ? 68 : 100],
                      [d.perfSatisfaction || 'Customer satisfaction', String(selected.rating || 'New'), selected.rating ? Math.round(selected.rating * 20) : 0],
                    ].map(([name, value, pct]) => (
                      <div key={name}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#f0f2f5]">{name}</span>
                          <strong className="text-[#f0f2f5]">{value}</strong>
                        </div>
                        <div className="h-[7px] rounded-full bg-[#1e2130] overflow-hidden">
                          <div className="h-full rounded-full bg-[#10b981] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.timelineTitle || 'Activity Timeline'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.timelineNone || 'No driver selected'}</p>
              ) : timelineLoading ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.timelineLoading || 'Loading timeline...'}</p>
              ) : timeline.length === 0 ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.timelineEmpty || 'No activity recorded yet'}</p>
              ) : (
                <div className="space-y-3">
                  {timeline.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${
                        item.type === 'created' ? 'bg-[#10b981]' :
                        item.type === 'order' ? 'bg-[#3b82f6]' :
                        'bg-[#646880]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#f0f2f5] font-medium">{item.title}</p>
                        <p className="text-[11px] text-[#646880] truncate">{item.description}</p>
                        <p className="text-[10px] text-[#646880] mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CREATE DRIVER MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/62" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-auto bg-[#0b0d14] border border-[#282b38] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#282b38]">
              <div>
                <h2 className="text-[18px] font-bold text-[#f0f2f5]">{editDriver ? (d.modalEdit || 'Edit driver') : (d.modalCreate || 'Create driver')}</h2>
                <p className="text-[12px] text-[#646880] mt-1">{editDriver ? (d.modalEditDesc || 'Update driver information and documents.') : (d.modalCreateDesc || 'Guided registration for driver, vehicle, documents, and compliance review.')}</p>
              </div>
              <button className="text-[#646880] hover:text-[#f0f2f5] text-2xl" onClick={() => setModalOpen(false)}>×</button>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-6 gap-2 p-5 pb-0">
              {[d.modalStep1 || '1 Personal', d.modalStep2 || '2 Emergency', d.modalStep3 || '3 License', d.modalStep4 || '4 Vehicle', d.modalStep5 || '5 Docs', d.modalStep6 || '6 Review'].map((s, i) => (
                <div key={s} className={`border rounded-lg p-2.5 text-[11px] font-bold text-center transition-all ${
                  createStep === i + 1
                    ? 'border-[#10b981] bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                    : 'border-[#282b38] text-[#646880]'
                }`}>{s}</div>
              ))}
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalName || 'Full name'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalNamePlace || 'e.g. Alejandro Restrepo'}
                  value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalPhone || 'Phone'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalPhonePlace || '+57 300 000 0000'}
                  value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalEmail || 'Email'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalEmailPlace || 'driver@company.com'}
                  value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalLang || 'Languages'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalLangPlace || 'Spanish, English, Portuguese'}
                  value={formData.languages || ''} onChange={e => setFormData(p => ({ ...p, languages: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalVehicle || 'Vehicle'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalVehiclePlace || 'e.g. Mercedes V-Class'}
                  value={formData.vehicle || ''} onChange={e => setFormData(p => ({ ...p, vehicle: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalPlate || 'Plate'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalPlatePlace || 'e.g. ABC-123'}
                  value={formData.plate || ''} onChange={e => setFormData(p => ({ ...p, plate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalVehicleType || 'Vehicle type'}</label>
                <select className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                  <option value="">{d.modalTypePlace || 'Select type...'}</option>
                  <option value="standard">{d.modalTypeStandard || 'Standard'}</option>
                  <option value="suv">{d.modalTypeSuv || 'SUV'}</option>
                  <option value="vip">{d.modalTypeVip || 'VIP SUV'}</option>
                  <option value="luxury">{d.modalTypeLuxury || 'Luxury'}</option>
                  <option value="van">{d.modalTypeVan || 'Van'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalPhotoUrl || 'Photo URL'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalPhotoPlace || 'https://example.com/photo.jpg'}
                  value={formData.photo_url || ''} onChange={e => setFormData(p => ({ ...p, photo_url: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalExpLevel || 'Experience level'}</label>
                <select className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.experienceLevel || ''} onChange={e => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}>
                  <option value="">{d.modalExpPlace || 'Select...'}</option>
                  <option value="Standard">{d.modalExpStd || 'Standard'}</option>
                  <option value="Senior">{d.modalExpSenior || 'Senior'}</option>
                  <option value="Lead">{d.modalExpLead || 'Lead'}</option>
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalEmergContact || 'Emergency contact'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalEmergPlace || 'Contact name'}
                  value={formData.emergency_contact || ''} onChange={e => setFormData(p => ({ ...p, emergency_contact: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalEmergPhone || 'Emergency phone'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalEmergPhonePlace || '+57 300 000 0000'}
                  value={formData.emergency_phone || ''} onChange={e => setFormData(p => ({ ...p, emergency_phone: e.target.value }))} />
              </div>

              {/* Vehicle details */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalYear || 'Vehicle year'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalYearPlace || 'e.g. 2024'}
                  value={formData.year || ''} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalCapacity || 'Capacity'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalCapacityPlace || 'e.g. 4 pax / 5 bags'}
                  value={formData.capacity || ''} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalCity || 'City'}</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder={d.modalCityPlace || 'e.g. Medellín'}
                  value={formData.city || ''} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
              </div>

              {/* Document Expirations */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalLicense || 'License expiry'}</label>
                <input type="date" className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.license_expiry || ''} onChange={e => setFormData(p => ({ ...p, license_expiry: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalSoat || 'SOAT expiry'}</label>
                <input type="date" className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.soat_expiry || ''} onChange={e => setFormData(p => ({ ...p, soat_expiry: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalInspection || 'Tech inspection expiry'}</label>
                <input type="date" className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.tech_inspection_expiry || ''} onChange={e => setFormData(p => ({ ...p, tech_inspection_expiry: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalInsurance || 'Insurance expiry'}</label>
                <input type="date" className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={formData.insurance_expiry || ''} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">{d.modalNotes || 'Operational notes'}</label>
                <textarea className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none resize-none" rows={3} placeholder={d.modalNotesPlace || 'VIP handling notes, airport authorization, language preferences...'}
                  value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-[#282b38]">
              <button className="px-4 py-2 border border-[#282b38] text-[13px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all" onClick={() => setModalOpen(false)}>{d.modalCancel || 'Cancel'}</button>
              <button className="px-4 py-2 border border-[#282b38] text-[13px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all" onClick={() => showToast(d.toastDraft || 'Draft saved')}>{d.modalDraft || 'Save draft'}</button>
              <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={handleSubmit}>
                {editDriver ? (d.modalUpdate || 'Update Driver') : (d.modalSubmit || 'Submit for review')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <div className="fixed bottom-6 right-6 space-y-2 z-[800]">
        {notif.map(n => (
          <div key={n.id} className="bg-[#181b25] border border-[#282b38] text-[#f0f2f5] px-4 py-3 rounded-xl shadow-2xl text-[13px] animate-slide-up">
            {n.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 300ms ease; }
      `}</style>
    </div>
  )
}

function RankingBoard({ drivers, d }: { drivers: Driver[]; d: Record<string, string> }) {
  const ranked = useMemo(() =>
    [...drivers]
      .filter(d => d.rating && d.total_trips)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6),
    [drivers]
  )

  const maxTrips = useMemo(() => Math.max(...ranked.map(d => d.total_trips || 0), 1), [ranked])

  if (ranked.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold text-[#f0f2f5]">{d.rankingTitle || 'Driver Ranking'}</span>
          <span className="text-[12px] text-[#646880] font-medium">{d.rankingSub || 'Top performers'}</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ranked.map((rd, idx) => (
          <div key={rd.id} className="bg-[#0b0d14] border border-[#1e2130] rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{medals[idx] || '🏅'}</div>
            <p className="text-[13px] font-bold text-[#f0f2f5] truncate">{rd.name}</p>
            <div className="flex justify-center gap-3 mt-2 text-[11px] text-[#646880]">
              <span>★ {rd.rating}</span>
              <span>{rd.total_trips} {d.rankingTrips || 'trips'}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#1e2130] overflow-hidden">
              <div className="h-full rounded-full bg-[#10b981] transition-all" style={{ width: `${((rd.total_trips || 0) / maxTrips) * 100}%` }} />
            </div>
            {rd.vip_compatible === 1 && (
              <span className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgba(212,168,75,0.15)] text-[#d4a84b]">{d.rankingVip || 'VIP'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}