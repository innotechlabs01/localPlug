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
  standard: 'var(--info)', suv: 'var(--info)', vip: 'var(--gold)', luxury: 'var(--accent)', van: 'var(--warning)'
}

const statusLabels: Record<string, string> = {
  available: 'Available', busy: 'Assigned', offline: 'Offline', suspended: 'Suspended', pending: 'Pending', inactive: 'Inactive'
}

const statusClasses: Record<string, string> = {
  available: 'badge badge-accent',
  busy: 'badge badge-info',
  offline: 'badge',
  suspended: 'badge badge-danger',
  pending: 'badge badge-warning',
  inactive: 'badge',
}

const docClasses: Record<string, string> = {
  valid: 'badge badge-accent',
  warning: 'badge badge-warning',
  expired: 'badge badge-danger',
  pending: 'badge',
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
    const cs = ['var(--accent)', 'var(--info)', 'var(--gold)', 'var(--info)', 'var(--accent-hover)', 'var(--bg)']
    return vip ? 'linear-gradient(135deg, var(--bg), var(--gold))' : `linear-gradient(135deg, ${cs[hash % cs.length]}, var(--bg))`
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
       <div className="drivers-hero">
         <div>
           <h1 className="text-[24px] font-bold tracking-tighter text-fg">
             {d.headerTitle || 'Drivers Management'}
           </h1>
           <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
             {d.headerDesc || 'Operational driver roster, vehicle eligibility, compliance validation, and assignment readiness for premium airport pickups and VIP tourism services in Medellín.'}
           </p>
         </div>
         <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
           <button
             className="px-3 py-2 border border-border text-fg-muted rounded-md hover:bg-surface-hover transition-all font-medium"
             onClick={() => showToast(d.toastCompliance || 'Compliance report queued')}
           >
             {d.exportCompliance || 'Export compliance'}
           </button>
           <button
             className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all"
             onClick={openCreateModal}
           >
             {d.create || 'Create Driver'}
           </button>
         </div>
       </div>

       {/* ── FILTER CHIPS ── */}
       <div className="drivers-filters px-6 py-4 flex items-center gap-2 flex-wrap">
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
             className={`chip ${filter === key ? 'chip-active' : ''}`}
           >
             {label}
           </button>
         ))}
       </div>

       {/* ── KPI ROW ── */}
       <div className="drivers-kpis grid-6">
         {[
           [d.kpiTotal || 'Total drivers', String(stats.total), d.kpiSubPlus || '+3 this month', true],
           [d.kpiAvailable || 'Available now', String(stats.available), d.kpiSubAirport || 'Airport ready', true],
           [d.kpiAssigned || 'Assigned trips', String(stats.assigned), d.kpiSubServices || 'Live services', false],
           [d.kpiVip || 'VIP eligible', String(stats.vip), d.kpiSubLuxury || 'Luxury certified', true],
           [d.kpiAlerts || 'Compliance alerts', String(stats.alerts), d.kpiSubReview || 'Needs review', false],
           [d.kpiAvgRating || 'Avg rating', stats.avg, d.kpiSubTop || 'Top quartile', true],
         ].map(([label, value, sub, positive], idx) => (
           <div key={`kpi-${idx}`} className="stat-card">
             <div className="stat-label">{label}</div>
             <div className="stat-value">{value}</div>
             <div className={`stat-change ${positive ? 'up' : 'down'}`}>{sub}</div>
           </div>
         ))}
       </div>

       {/* ── OPS ALERTS + ELIGIBILITY ── */}
       <div className="ops-alerts grid-2">
         {/* Alert panel */}
         <div className="alert-panel">
           <div className="alert-title">
             <span>{d.alertsTitle || 'Operational compliance alerts'}</span>
             <span className="badge badge-warning">
               {d.alertsOpen?.replace('{count}', String(stats.alerts)) || `${stats.alerts} open`}
             </span>
           </div>
           {filteredAlerts.length === 0 ? (
             <p className="text-fg-muted py-6 text-center">{d.alertsNone || 'No compliance alerts'}</p>
           ) : (
             filteredAlerts.map(driver => (
               <div key={driver.id} className="alert-row">
                 <span className={`status-dot ${driver.doc_status === 'expired' ? 'danger' : ''}`} />
                 <div className="alert-copy">
                   <strong>{driver.name}</strong>
                   <span>{docReason(driver).join(', ') || 'Documents expired'} — {driver.vehicle} ({driver.plate})</span>
                 </div>
                 <button
                   className="btn btn-sm btn-secondary"
                   onClick={() => { setSelectedId(driver.id); setFilter('expired') }}
                 >
                   {d.alertsReview || 'Review'}
                 </button>
               </div>
             ))
           )}
         </div>

         {/* Eligibility panel */}
         <div className="eligibility-panel">
           <h3>{d.eligibilityTitle || 'Assignment eligibility'}</h3>
           <div className="eligibility-grid grid-2">
             {[
               [drivers.filter(drv => drv.status === 'available').length, d.eligibilityPickup || 'Eligible for airport pickup'],
               [stats.vip, d.eligibilityVip || 'Eligible for VIP guests'],
               [stats.alerts, d.eligibilityRestricted || 'Restricted by compliance'],
               [stats.total ? '6 min' : '—', d.eligibilityEta || 'Avg airport ETA'],
             ].map(([val, lab], idx) => (
               <div key={idx} className="eligibility-item">
                 <strong>{val}</strong>
                 <span>{lab}</span>
               </div>
             ))}
           </div>
         </div>
       </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="drivers-layout">
        {/* ── LEFT: DRIVER ROSTER ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>{d.rosterTitle || 'Driver roster'}</span>
              <span className="count">{filtered.length} shown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="dp-search-bar" style={{ margin: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  placeholder={d.rosterSearch || 'Search drivers, plates, vehicles...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => showToast('Card view active')}>Cards</button>
              <button className="btn btn-sm btn-secondary" onClick={() => showToast('Table view ready')}>Table</button>
            </div>
          </div>

           <div className="driver-grid">
             {filtered.length === 0 ? (
               <p className="text-fg-muted text-center py-12 grid-col-span-2">{d.rosterNoMatch || 'No drivers match filters'}</p>
             ) : filtered.map(drv => (
               <div
                 key={drv.id}
                 className={`driver-card ${selectedId === drv.id ? 'active' : ''}`}
                 onClick={() => setSelectedId(drv.id)}
               >
                 <div className="driver-head">
                   <div className="driver-person">
                     <div className="driver-avatar" style={{ background: getAvatarColor(drv.name, drv.vip_compatible || undefined) }}>
                       {drv.photo_url ? (
                         <img src={drv.photo_url} alt={drv.name || ''} style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                       ) : getInit(drv.name)}
                     </div>
                     <div>
                       <div className="driver-name">
                         {drv.name}
                         {drv.vip_compatible ? <span className="badge vip">VIP</span> : null}
                       </div>
                       <div className="driver-meta">{drv.languages} · {drv.city || 'Medellín'}</div>
                     </div>
                   </div>
                   <span className={`badge ${drv.status === 'available' ? 'available' : drv.status === 'busy' ? 'assigned' : 'offline'}`}>
                     {statusLabels[drv.status || ''] || drv.status}
                   </span>
                 </div>

                 <div className="flex gap-1.5 flex-wrap">
                   <span className={`badge ${docStatus(drv) === 'valid' ? 'valid' : docStatus(drv) === 'warning' ? 'warning' : docStatus(drv) === 'expired' ? 'expired' : 'pending'}`}>
                     {docStatus(drv) === 'valid' ? (d.rosterValid || 'Valid') : docStatus(drv) === 'warning' ? (d.rosterExpiring || 'Expiring') : docStatus(drv) === 'expired' ? (d.rosterExpired || 'Expired') : (d.rosterPending || 'Pending')}
                   </span>
                   {drv.vip_compatible === 1 && <span className="badge vip">{d.rosterVip || 'VIP'}</span>}
                 </div>

                 <div className="driver-stats">
                   <div className="driver-stat">
                     <strong>{drv.rating || 'New'}</strong>
                     <span>{d.rosterRating || 'Rating'}</span>
                   </div>
                   <div className="driver-stat">
                     <strong>{drv.total_trips || 0}</strong>
                     <span>{d.rosterTrips || 'Trips'}</span>
                   </div>
                   <div className="driver-stat">
                     <strong>{drv.status === 'available' ? '4 min' : drv.active_orders ? 'In service' : '—'}</strong>
                     <span>{d.rosterEta || 'ETA'}</span>
                   </div>
                 </div>

                 <div className="vehicle-strip">
                   <span>
                     <strong className="text-fg">{drv.vehicle || '—'}</strong><br />
                     {drv.plate} · {drv.year || '—'}
                   </span>
                   <span>
                     {catColors[drv.category || ''] ? (
                       <span className="flex items-center gap-1">
                         <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColors[drv.category || ''] }} />
                         {drv.category}
                       </span>
                     ) : '—'}
                     <br />{drv.capacity || drv.experience_level || '—'}
                   </span>
                 </div>
               </div>
             ))}
           </div>
        </div>

         {/* ── RIGHT: SIDE STACK ── */}
         <aside className="hidden sm:block w-[360px] sticky top-[76px]">
           {/* Profile */}
           <div className="panel">
             <div className="panel-header flex items-center justify-between pb-2">
               <span className="panel-title font-medium text-fg">{d.profileTitle || 'Driver profile'}</span>
               <button
                 className="btn btn-sm btn-secondary"
                 onClick={() => {
                   if (window.confirm('Suspend driver access?')) {
                     showToast(d.toastStatus || 'Driver status updated')
                   }
                 }}
               >
                 {d.profileActions || 'Actions'}
               </button>
             </div>
             <div className="panel-body p-4">
               {!selected ? (
                 <p className="text-fg-muted text-center py-8">
                   {d.profileSelect || 'Select a driver to view profile'}
                 </p>
               ) : (
                 <>
                   <div className="flex items-center gap-3.5">
                     <div className="w-[4.25rem] h-[4.25rem] rounded-[20px] flex items-center justify-center text-white font-extrabold text-[21px] flex-shrink-0" style={{ background: getAvatarColor(selected.name, selected.vip_compatible || undefined) }}>
                       {selected.photo_url ? (
                         <img src={selected.photo_url} alt={selected.name || ''} className="w-full h-full rounded-[20px] object-cover" />
                       ) : getInit(selected.name)}
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-fg">{selected.name}</h2>
                       <div className="text-fg-muted text-[12px] mt-1 flex">
                         {(selected.category || d.profileStandard || 'Standard')} · {selected.plate}
                       </div>
                       <div className="flex gap-1.5 flex-wrap mt-2">
                         <span className={statusClasses[selected.status || ''] || 'badge'}>
                           {statusLabels[selected.status || ''] || selected.status}
                         </span>
                         <span className={docClasses[docStatus(selected)] || 'badge'}>
                           {docStatus(selected) === 'valid' ? (d.profileValid || 'Valid') : docStatus(selected) === 'warning' ? (d.profileExpiring || 'Expiring soon') : (d.profileExpired || 'Expired')}
                         </span>
                         {selected.vip_compatible === 1 && (
                           <span className="badge badge-gold">
                             {d.profileVip || 'VIP services'}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mt-4">
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
                         <label className="block text-xs text-fg-muted uppercase tracking-[0.4px] mb-0.5">{label}</label>
                         <div className="text-fg text-[13px] leading-[1.45]">{value}</div>
                       </div>
                     ))}
                   </div>
                 </>
               )}
             </div>
           </div>

           {/* Compliance */}
           <div className="panel mt-4">
             <div className="panel-header flex items-center justify-between pb-2">
               <span className="panel-title font-medium text-fg">{d.complianceTitle || 'Compliance validation'}</span>
             </div>
             <div className="panel-body p-4">
               {!selected ? (
                 <p className="text-fg-muted text-center py-6">
                   {d.complianceNone || 'No driver selected'}
                 </p>
               ) : (
                 <>
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
                         <div key={name} className="flex items-center justify-between border-b border-border-light py-2">
                           <div className="flex items-center gap-2">
                             <div className="font-medium text-fg">{name}</div>
                             <div className="text-fg-muted text-[11px]">{value}</div>
                           </div>
                           <span className={docClasses[s] || 'badge'}>
                             {s === 'valid' ? (d.complianceValid || 'Valid') : s === 'warning' ? (d.complianceExpiring || 'Expiring') : (d.complianceExpired || 'Expired')}
                           </span>
                         </div>
                         );
                       })}
                    </div>
                   <div className={`alert-box ${docStatus(selected)} p-4 mt-4 rounded-[12px] border border-border`}>
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
           <div className="panel mt-4">
             <div className="panel-header flex items-center justify-between pb-2">
               <span className="panel-title font-medium text-fg">{d.perfTitle || 'Performance & condition'}</span>
             </div>
             <div className="panel-body p-4">
               {!selected ? (
                 <p className="text-fg-muted text-center py-6">
                   {d.perfNone || 'No driver selected'}
                 </p>
               ) : (
                 <>
                   <div className="flex items-center gap-3.5 mt-4">
                     <div className="w-[5.125rem] h-[5.125rem] rounded-full flex items-center justify-center text-fg font-extrabold text-[18px] relative" style={{ background: `conic-gradient(#10b981 ${Math.round((selected.rating || 0) * 20)}%, #1e2130 0)` }}>
                       <div className="absolute inset-[0.5rem] rounded-full bg-[var(--bg)]" />
                       <span className="relative z-[1]">{Math.round((selected.rating || 0) * 20)}</span>
                     </div>
                     <div>
                       <div className="font-bold text-fg">{d.perfScore || 'Vehicle condition score'}</div>
                       <div className="text-fg-muted text-[12px] mt-1">
                         {d.perfScoreDesc || 'Cleanliness, interior, exterior, and mechanical inspection summary.'}
                       </div>
                     </div>
                   </div>
                   <div className="grid gap-2.5 mt-4">
                     {[
                       [d.perfTrips || 'Trips completed', String(selected.total_trips || 0), Math.min((selected.total_trips || 0) / 4, 92)],
                       [d.perfRevenue || 'Revenue generated', `$${(selected.total_trips || 0) * 68}`, Math.min((selected.total_trips || 0) / 4, 78)],
                       [d.perfVip || 'VIP services completed', String(selected.vip_compatible ? Math.round((selected.total_trips || 0) * 0.45) : 0), selected.vip_compatible ? 84 : 34],
                       [d.perfCancel || 'Cancellation rate', selected.total_trips ? '3.2%' : '0%', selected.total_trips ? 68 : 100],
                       [d.perfSatisfaction || 'Customer satisfaction', String(selected.rating || 'New'), selected.rating ? Math.round(selected.rating * 20) : 0],
                     ].map(([name, value, pct]) => (
                       <div key={name}>
                         <div className="flex justify-between mb-1">
                           <span className="text-fg">{name}</span>
                           <strong className="text-fg">{value}</strong>
                         </div>
                         <div className="h-[0.4375rem] rounded-full bg-[var(--border-light)] overflow-hidden">
                           <div className="h-full w-[${pct}%] bg-accent transition-[width_0.3s_ease]" />
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
              borderRadius: 16, background: 'var(--bg)',
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
                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: 'var(--fg)' }}>
                  {editDriver ? (d.modalEdit || 'Edit driver') : (d.modalCreate || 'Create driver')}
                </h2>
                <p style={{ color: 'var(--fg-secondary)', fontSize: 12, marginTop: 4 }}>
                  {editDriver ? (d.modalEditDesc || 'Update driver information. All changes will be logged.') : (d.modalCreateDesc || 'Guided registration for driver, vehicle, documents, and compliance review.')}
                </p>
              </div>
              <button
                style={{ color: 'var(--fg-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
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
                      border: `1px solid ${createStep >= stepNum ? 'var(--accent)' : 'var(--border)'}`,
                      background: createStep >= stepNum ? 'rgba(16,185,129,0.12)' : 'var(--surface)',
                      color: createStep >= stepNum ? 'var(--accent)' : 'var(--fg-secondary)',
                      borderRadius: 8, padding: 10, fontSize: 11, fontWeight: 700, textAlign: 'center',
                    }}>
                      {stepLabel}
                    </div>
                  )
                })}
              </div>

              {/* Step navigation */}
              <p style={{ fontSize: 12, color: 'var(--fg-secondary)', marginBottom: 16 }}>
                {`Step ${createStep} of 6`}
              </p>

              {/* Step 1: Personal */}
              {createStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalName || 'Full name'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalNamePlace || 'e.g. Alejandro Restrepo'} value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>ID / passport</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder="CC 1.037.***" /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalPhone || 'Phone'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalPhonePlace || '+57 300 000 0000'} value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalEmail || 'Email'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalEmailPlace || 'driver@company.com'} value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalLang || 'Languages'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalLangPlace || 'Spanish, English, Portuguese'} value={formData.languages || ''} onChange={e => setFormData(p => ({ ...p, languages: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicleType || 'Vehicle type'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }}
                      value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">{d.modalTypePlace || 'Select type...'}</option>
                      <option value="vip">{d.modalTypeVip || 'VIP SUV'}</option>
                      <option value="luxury">{d.modalTypeLuxury || 'Luxury'}</option>
                      <option value="suv">{d.modalTypeSuv || 'SUV'}</option>
                      <option value="van">{d.modalTypeVan || 'Van'}</option>
                      <option value="standard">{d.modalTypeStandard || 'Standard'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalLicense || 'License expiration'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.license_expiry || ''} onChange={e => setFormData(p => ({ ...p, license_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalSoat || 'SOAT expiration'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.soat_expiry || ''} onChange={e => setFormData(p => ({ ...p, soat_expiry: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>'Other expirations'</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <div><label style={{ display: 'block', fontSize: 10, color: 'var(--fg-secondary)', marginBottom: 4 }}>{d.modalInspection || 'Tech inspection'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.tech_inspection_expiry || ''} onChange={e => setFormData(p => ({ ...p, tech_inspection_expiry: e.target.value }))} /></div>
                      <div><label style={{ display: 'block', fontSize: 10, color: 'var(--fg-secondary)', marginBottom: 4 }}>{d.modalInsurance || 'Insurance'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.insurance_expiry || ''} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} /></div>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>Document uploads</label>
                    <div style={{
                      minHeight: 86, border: '1px dashed #282b38', borderRadius: 8,
                      display: 'grid', placeItems: 'center', textAlign: 'center',
                      color: 'var(--fg-secondary)', background: 'var(--bg)', fontSize: 12,
                    }}>
                      Drop license, SOAT, technical inspection, insurance, vehicle photos
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalNotes || 'Operational notes'}</label>
                    <textarea rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none', resize: 'none' }}
                      placeholder={d.modalNotesPlace || 'VIP handling notes, airport authorization, language preferences...'}
                      value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 2: Emergency */}
              {createStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalEmergContact || 'Emergency contact'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalEmergPlace || 'Contact name'} value={formData.emergency_contact || ''} onChange={e => setFormData(p => ({ ...p, emergency_contact: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalEmergPhone || 'Emergency phone'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalEmergPhonePlace || '+57 300 000 0000'} value={formData.emergency_phone || ''} onChange={e => setFormData(p => ({ ...p, emergency_phone: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalExpLevel || 'Experience level'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }}
                      value={formData.experienceLevel || ''} onChange={e => setFormData(p => ({ ...p, experienceLevel: e.target.value }))}>
                      <option value="">{d.modalExpPlace || 'Select...'}</option>
                      <option value="Standard">{d.modalExpStd || 'Standard'}</option>
                      <option value="Senior">{d.modalExpSenior || 'Senior'}</option>
                      <option value="Lead">{d.modalExpLead || 'Lead'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalCity || 'City'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalCityPlace || 'e.g. Medellín'} value={formData.city || ''} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 3: License & docs */}
              {createStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalLicense || 'License expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.license_expiry || ''} onChange={e => setFormData(p => ({ ...p, license_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalSoat || 'SOAT expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.soat_expiry || ''} onChange={e => setFormData(p => ({ ...p, soat_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalInspection || 'Tech inspection'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.tech_inspection_expiry || ''} onChange={e => setFormData(p => ({ ...p, tech_inspection_expiry: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalInsurance || 'Insurance expiry'}</label><input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} value={formData.insurance_expiry || ''} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 4: Vehicle */}
              {createStep === 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicle || 'Vehicle'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalVehiclePlace || 'e.g. Mercedes V-Class'} value={formData.vehicle || ''} onChange={e => setFormData(p => ({ ...p, vehicle: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalPlate || 'Plate'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalPlatePlace || 'e.g. ABC-123'} value={formData.plate || ''} onChange={e => setFormData(p => ({ ...p, plate: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalVehicleType || 'Vehicle type'}</label>
                    <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }}
                      value={formData.category || ''} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">{d.modalTypePlace || 'Select type...'}</option>
                      <option value="standard">{d.modalTypeStandard || 'Standard'}</option>
                      <option value="suv">{d.modalTypeSuv || 'SUV'}</option>
                      <option value="vip">{d.modalTypeVip || 'VIP SUV'}</option>
                      <option value="luxury">{d.modalTypeLuxury || 'Luxury'}</option>
                      <option value="van">{d.modalTypeVan || 'Van'}</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalYear || 'Vehicle year'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalYearPlace || 'e.g. 2024'} value={formData.year || ''} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalCapacity || 'Capacity'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalCapacityPlace || 'e.g. 4 pax'} value={formData.capacity || ''} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))} /></div>
                  <div><label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalPhotoUrl || 'Photo URL'}</label><input style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none' }} placeholder={d.modalPhotoPlace || 'https://example.com/photo.jpg'} value={formData.photo_url || ''} onChange={e => setFormData(p => ({ ...p, photo_url: e.target.value }))} /></div>
                </div>
              )}

              {/* Step 5: Docs & Notes */}
              {createStep === 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>Document uploads</label>
                    <div style={{
                      minHeight: 86, border: '1px dashed #282b38', borderRadius: 8,
                      display: 'grid', placeItems: 'center', textAlign: 'center',
                      color: 'var(--fg-secondary)', background: 'var(--bg)', fontSize: 12,
                    }}>
                      Drop license, SOAT, technical inspection, insurance, vehicle photos
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{d.modalNotes || 'Operational notes'}</label>
                    <textarea rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #282b38', background: 'var(--surface)', color: 'var(--fg)', outline: 'none', resize: 'none' }}
                      placeholder={d.modalNotesPlace || 'VIP handling notes...'}
                      value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {createStep === 6 && (
                <div style={{
                  padding: 16, background: 'var(--surface)', border: '1px solid #282b38',
                  borderRadius: 8, marginTop: 4, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65,
                }}>
                  'Review all driver information before saving. All actions will be logged.'
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
                    {[
                      ['Name', formData.name], ['Phone', formData.phone], ['Email', formData.email],
                      ['Languages', formData.languages], ['Vehicle', formData.vehicle], ['Plate', formData.plate],
                      ['Type', formData.category], ['City', formData.city],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</label>
                        <div style={{ fontSize: 13, color: 'var(--fg)' }}>{value || '—'}</div>
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
                      fontSize: 13, color: 'var(--fg-muted)', background: 'transparent', cursor: 'pointer',
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
                        padding: '10px 20px', background: 'var(--accent)', color: '#fff',
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
                          fontSize: 13, color: 'var(--fg-muted)', background: 'transparent', cursor: 'pointer',
                        }}
                        className="hover:bg-[#202330] transition-all"
                        onClick={() => setModalOpen(false)}
                      >
                        {d.modalCancel || 'Cancel'}
                      </button>
                      <button
                        style={{
                          padding: '10px 16px', border: '1px solid #282b38', borderRadius: 8,
                          fontSize: 13, color: 'var(--fg-muted)', background: 'transparent', cursor: 'pointer',
                        }}
                        className="hover:bg-[#202330] transition-all"
                        onClick={() => showToast(d.toastDraft || 'Draft saved')}
                      >
                        {d.modalDraft || 'Save draft'}
                      </button>
                      <button
                        style={{
                          padding: '10px 20px', background: 'var(--accent)', color: '#fff',
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
            background: 'var(--surface)', border: '1px solid #282b38', color: 'var(--fg)',
            padding: '12px 16px', borderRadius: 12, fontSize: 13, zIndex: 800,
          }}>
            {n.msg}
          </div>
        ))}
      </div>
    </div>
  )
}


