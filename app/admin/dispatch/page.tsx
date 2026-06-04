'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { usePolling } from './use-polling'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import { getToday, getLocalDatePart } from '@/lib/date-utils'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

function AuthModal({ open, onClose }: AuthModalProps) {
  if (!open) return null
  return (
    <div className="dp-modal-overlay open" onClick={onClose}>
      <div className="dp-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="dp-modal-header">
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>Sesión Expirada</span>
        </div>
        <div className="dp-modal-body">
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
            Tu sesión ha expirado. Por favor inicia sesión nuevamente para continuar.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cerrar</button>
            <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Ir al Inicio</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Types ──
interface Driver {
  id: number; name: string; phone: string | null; photo: string | null
  vehicle: string; plate: string; category: string; status: string
  rating: number; languages: string; experience_level: string
  total_trips: number; vip_compatible: number; notes: string | null
}

interface Order {
  id: number; order_number: string | null; customer_name: string | null
  customer_phone: string | null; customer_country: string | null
  customer_email: string | null; flight_number: string | null; airline: string | null
  arrival_date: string | null; arrival_time: string | null
  return_date: string | null; return_time: string | null
  destination_address: string | null; package_name: string | null
  priority: string | null; status: string; dispatch_status: string | null
  assigned_to: number | null; driver_name: string | null; driver_vehicle: string | null
  payment_status: string | null; customer_notes: string | null; created_at: string
}

interface DispatchData {
  orders: Order[]; drivers: Driver[]; counts: { pending: number; assigned: number; enroute: number; pickedup: number }
}

const T = {
  bg: 'var(--bg)', surface: 'var(--surface)', surfaceHover: 'var(--surface-hover)', border: 'var(--border)', borderLight: 'var(--surface-active)',
  fg: 'var(--fg)', fgSecondary: 'var(--fg-muted)', fgMuted: 'var(--fg-secondary)',
  accent: 'var(--accent)', accentSoft: 'rgba(16,185,129,0.12)', accentGlow: 'rgba(16,185,129,0.2)',
  warning: 'var(--warning)', warningSoft: 'rgba(245,158,11,0.12)',
  danger: 'var(--danger)', dangerSoft: 'rgba(239,68,80,0.12)',
  info: 'var(--info)', infoSoft: 'rgba(59,130,246,0.12)',
  gold: 'var(--gold)', goldSoft: 'rgba(212,168,75,0.15)',
  radiusSm: '6px', radiusMd: '10px',
  fontMono: "'JetBrains Mono', ui-monospace, monospace",
}

const dispatchStatuses = ['pending', 'assigned', 'enroute', 'pickedup', 'completed'] as const
const STATUS_LABELS: Record<string, string> = { pending: 'Pending', assigned: 'Assigned', enroute: 'En Route', pickedup: 'Picked Up', completed: 'Completed' }

const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Spain': '🇪🇸', 'Mexico': '🇲🇽',
  'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'Colombia': '🇨🇴', 'Canada': '🇨🇦', 'Italy': '🇮🇹',
  'Brazil': '🇧🇷', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Chile': '🇨🇱', 'Peru': '🇵🇪',
}

export default function DispatchPage() {
  const { t } = useI18n()
  const d = t.admin.dispatch
  const [data, setData] = useState<DispatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [driverCat, setDriverCat] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDriverId, setModalDriverId] = useState<number | null>(null)
  const [assignedDrivers, setAssignedDrivers] = useState<Record<number, number>>({})
  const [notifications, setNotifications] = useState<{ id: number; type: string; title: string; desc: string }[]>([])
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ tab, driverCat })
    if (search) params.set('search', search)
    try {
      const res = await adminFetch(`/api/admin/dispatch?${params}`)
      const json: DispatchData = await res.json()
      setData(json)
      const map: Record<number, number> = {}
      for (const o of json.orders || []) {
        if (o.assigned_to) map[o.id] = o.assigned_to
      }
      setAssignedDrivers(map)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_ERROR') {
        setAuthModalOpen(true)
        throw err
      }
      console.error('Failed to fetch dispatch data', err)
    }
    setLoading(false)
  }, [tab, search, driverCat])

  const handleAuthError = useCallback(() => { setAuthModalOpen(true) }, [])

  useEffect(() => { fetchData() }, [fetchData])
  usePolling(fetchData, { intervalMs: 10_000, onAuthError: handleAuthError })

  const addNotif = (type: string, title: string, desc: string) => {
    const id = Date.now()
    setNotifications(p => [...p, { id, type, title, desc }])
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000)
  }

  const selectedOrder = useMemo(() => data?.orders.find(o => o.id === selectedId) || null, [data, selectedId])
  const selectedDriver = useMemo(() => data?.drivers.find(drv => drv.id === modalDriverId) || null, [data, modalDriverId])

  const suggestedDrivers = useMemo(() =>
    data?.drivers.filter(drv => {
      if (drv.status !== 'available') return false
      if (selectedOrder?.priority === 'urgent' && drv.experience_level !== 'Senior') return false
      return true
    }) || [],
    [data, selectedOrder]
  )

  const otherDrivers = useMemo(() =>
    data?.drivers.filter(drv => drv.status === 'available' && !suggestedDrivers.find(s => s.id === drv.id)) || [],
    [data, suggestedDrivers]
  )

  const doAssign = async (orderId: number, driverId: number) => {
    const res = await adminFetch('/api/admin/dispatch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', orderId, driverId }),
    })
    if (res.ok) {
      addNotif('success', d.notifAssigned || 'Driver Assigned', `${d.notifAssignedDesc || 'Order'} ${orderId}`)
      setAssignedDrivers(p => ({ ...p, [orderId]: driverId }))
      setModalOpen(false)
      fetchData()
    }
  }

  const doUnassign = async (orderId: number) => {
    const res = await adminFetch('/api/admin/dispatch', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unassign', orderId }),
    })
    if (res.ok) {
      addNotif('warning', d.notifUnassigned || 'Unassigned', `${d.notifUnassignedDesc || 'Order'} ${orderId}`)
      const newMap = { ...assignedDrivers }
      delete newMap[orderId]
      setAssignedDrivers(newMap)
      fetchData()
    }
  }

  const doStatus = async (orderId: number, status: string) => {
    const res = await adminFetch('/api/admin/dispatch', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', orderId, status }),
    })
    if (res.ok) {
      addNotif('info', `${d.notifStatus || 'Status: '}${status}`, `${d.notifStatusDesc || 'Order'} ${orderId}`)
      fetchData()
    }
  }

  const orders = data?.orders || []
  const drivers = data?.drivers || []
  const counts = data?.counts || { pending: 0, assigned: 0, enroute: 0, pickedup: 0 }

  const getStatusStep = (status: string | null) => dispatchStatuses.indexOf((status || 'pending') as typeof dispatchStatuses[number])
  const isVip = (o: Order) => o.priority === 'high' || o.priority === 'urgent'

  const filteredOrders = useMemo(() => {
    let list = orders
    const today = getToday()
    if (tab === 'today') list = list.filter(o => getLocalDatePart(o.created_at) === today)
    else if (tab === 'pending') list = list.filter(o => (o.dispatch_status || 'pending') === 'pending')
    else if (tab === 'assigned') list = list.filter(o => o.dispatch_status === 'assigned')
    else if (tab === 'enroute') list = list.filter(o => o.dispatch_status === 'enroute')
    else if (tab === 'completed') list = list.filter(o => o.dispatch_status === 'completed')
    else if (tab === 'pickedup') list = list.filter(o => o.dispatch_status === 'pickedup')
    else if (tab === 'vip') list = list.filter(o => o.priority === 'high' || o.priority === 'urgent')
    else if (tab === 'unassigned') list = list.filter(o => !o.assigned_to)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(o =>
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.flight_number || '').toLowerCase().includes(q) ||
        (o.destination_address || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, tab, query])

  const getCountryFlag = (country: string | null) => {
    if (!country) return ''
    return COUNTRY_FLAGS[country] || ''
  }

  const getDispatchStatusClass = (status: string | null) => {
    const s = status || 'pending'
    if (s === 'assigned') return 'assigned'
    if (s === 'enroute') return 'enroute'
    if (s === 'pickedup') return 'pickedup'
    if (s === 'completed') return 'completed'
    return 'pending'
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.fgMuted }}>{d.selectRequest || 'Loading'}...</div>
  }

  return (
    <RealtimeProvider>
    <>

      {/* ── Smart Alerts Bar ── */}
      {counts.pending > 3 && (
        <div className="dp-alerts-bar">
          <div className="dp-alert-chip warning">
            <span className="dot" style={{ background: T.warning }} />
            {counts.pending} pending requests need assignment
          </div>
        </div>
      )}

      <div className="dispatch-layout">
        {/* ── Left Panel: Requests ── */}
        <div className="dispatch-panel dispatch-left">
          <div className="dp-header">
            <div className="dp-header-title">
              {d.requests || 'Requests'}
              <span className="dp-header-count">{filteredOrders.length}</span>
            </div>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: T.fgSecondary, cursor: 'pointer', fontSize: 14, padding: '4px', display: 'flex', alignItems: 'center', gap: 6 }} title={d.refresh || 'Refresh'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              {d.refresh || 'Refresh'}
            </button>
          </div>

          <div className="dp-search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input placeholder={d.searchPlaceholder || 'Search by name, flight, hotel...'} value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="dp-left-stats">
            <div className="dp-left-stat">
              <div className="val" style={{ color: T.warning }}>{counts.pending}</div>
              <div className="lbl">Pending</div>
            </div>
            <div className="dp-left-stat">
              <div className="val" style={{ color: T.accent }}>{counts.assigned}</div>
              <div className="lbl">Assigned</div>
            </div>
            <div className="dp-left-stat">
              <div className="val" style={{ color: T.info }}>{counts.enroute}</div>
              <div className="lbl">En Route</div>
            </div>
          </div>

          <div className="dp-filter-tabs">
            {(['all', 'pending', 'assigned', 'enroute', 'vip'] as const).map(f => (
              <button key={f} className={`dp-filter-tab ${tab === f ? 'active' : ''}`} onClick={() => setTab(f)}>
                {f === 'all' ? (d.all || 'All') : f === 'pending' ? (d.pending || 'Pending') : f === 'assigned' ? (d.assigned || 'Assigned') : f === 'enroute' ? (d.enroute || 'En Route') : (d.vIP || 'VIP')}
              </button>
            ))}
          </div>

          <div className="dp-request-list">
            {filteredOrders.length === 0 ? (
              <div className="dp-empty-state" style={{ padding: '48px 24px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
                <p>{d.noRequests || 'No requests found'}</p>
              </div>
            ) : filteredOrders.map(order => (
              <div
                key={order.id}
                className={`dp-request-card ${order.id === selectedId ? 'selected' : ''}`}
                onClick={() => setSelectedId(order.id)}
              >
                <div className={`dp-request-priority ${order.priority === 'urgent' ? 'high' : order.priority === 'high' ? 'medium' : 'low'}`} />
                <div className="dp-request-body">
                  <div className="dp-request-name">
                    {order.customer_name || d.customer || 'Customer'}
                    {isVip(order) && <span className="dp-vip-badge">VIP</span>}
                    {getCountryFlag(order.customer_country) && <span style={{ fontSize: 10 }}>{getCountryFlag(order.customer_country)}</span>}
                  </div>
                  <div className="dp-request-meta">
                    {order.flight_number && <span className="dp-request-flight">{order.flight_number}</span>}
                    <span>{order.airline || ''}</span>
                    {order.package_name && <><span>·</span><span>{order.package_name}</span></>}
                    {order.destination_address && <><span>·</span><span>{order.destination_address}</span></>}
                  </div>
                </div>
                <div className="dp-request-right">
                  <div className="dp-request-time">{order.arrival_time?.substring(0, 5) || '--:--'}</div>
                  <span className={`dp-request-status ${getDispatchStatusClass(order.dispatch_status)}`}>
                    {STATUS_LABELS[order.dispatch_status || 'pending'] || 'Pending'}
                  </span>
                  <span className={`dp-payment-badge ${order.payment_status === 'completed' ? 'paid' : 'pending'}`}>
                    {order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center Panel: Detail View ── */}
        <div className="dispatch-panel dispatch-center">
          {!selectedOrder ? (
            <div className="dp-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>{d.selectRequest || 'Select a booking'}</h3>
              <p>{d.selectRequestDesc || 'Choose a customer request from the left panel to view details and assign a driver.'}</p>
            </div>
          ) : (
            <div className="dp-detail-view active">
              {/* Guest Header */}
              <div className="dp-detail-header">
                <div className="dp-detail-guest">
                  <div className="dp-detail-avatar">
                    {(selectedOrder.customer_name || 'G').split(' ').map(w => w[0]).join('').substring(0, 2)}
                  </div>
                  <div className="dp-detail-guest-info">
                    <h2>{selectedOrder.customer_name || d.customer || 'Customer'}</h2>
                    <div className="guest-sub">
                      <span>{getCountryFlag(selectedOrder.customer_country)} {selectedOrder.customer_country || ''}</span>
                      {selectedOrder.flight_number && <><span>·</span><span>{selectedOrder.flight_number}</span></>}
                      {selectedOrder.customer_phone && <><span>·</span><span>{selectedOrder.customer_phone}</span></>}
                    </div>
                  </div>
                </div>
                <div className="dp-detail-actions">
                  {selectedOrder.assigned_to && (
                    <button onClick={() => doUnassign(selectedOrder.id)} style={{ padding: '8px 14px', borderRadius: T.radiusSm, border: `1px solid ${T.danger}`, background: 'transparent', color: T.danger, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      {d.unassign || 'Unassign'}
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="dp-detail-timeline">
                {dispatchStatuses.map((s, i) => {
                  const currentStep = getStatusStep(selectedOrder.dispatch_status)
                  const completed = i < currentStep || (i === currentStep && s === 'completed')
                  const active = i === currentStep
                  return (
                    <div key={s} className="dp-timeline-step">
                      <div className={`dp-timeline-dot ${completed ? 'completed' : active ? 'active' : ''}`} />
                      <span className={`dp-timeline-label ${completed ? 'completed' : active ? 'active' : ''}`}>
                        {STATUS_LABELS[s] || s}
                      </span>
                      {i < dispatchStatuses.length - 1 && <div className={`dp-timeline-connector ${completed ? 'completed' : ''}`} />}
                    </div>
                  )
                })}
              </div>

              {/* Sections */}
              <div className="dp-detail-sections">
                {/* Tourist Information */}
                <div className="dp-section-card">
                  <div className="dp-section-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Tourist Information
                  </div>
                  <div className="dp-section-body">
                    <div className="dp-info-grid">
                      <div className="dp-info-item"><span className="dp-info-label">Full Name</span><span className="dp-info-value">{selectedOrder.customer_name || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Country</span><span className="dp-info-value">{getCountryFlag(selectedOrder.customer_country)} {selectedOrder.customer_country || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Phone</span><span className="dp-info-value mono">{selectedOrder.customer_phone || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Email</span><span className="dp-info-value mono">{selectedOrder.customer_email || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">VIP Level</span><span className="dp-info-value">{isVip(selectedOrder) ? 'VIP — Premium' : 'Standard'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="dp-section-card">
                  <div className="dp-section-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/></svg>
                    Service Details
                  </div>
                  <div className="dp-section-body">
                    <div className="dp-info-grid">
                      <div className="dp-info-item"><span className="dp-info-label">Package</span><span className="dp-info-value">{selectedOrder.package_name || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Service Type</span><span className="dp-info-value">{selectedOrder.status || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Arrival</span><span className="dp-info-value mono">{selectedOrder.arrival_date} {selectedOrder.arrival_time || ''}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Flight</span><span className="dp-info-value mono">{selectedOrder.flight_number || '—'}</span></div>
                      {selectedOrder.return_date && (
                        <div className="dp-info-item"><span className="dp-info-label">Return</span><span className="dp-info-value mono">{selectedOrder.return_date} {selectedOrder.return_time || ''}</span></div>
                      )}
                      <div className="dp-info-item" style={{ gridColumn: 'span 2' }}><span className="dp-info-label">Destination</span><span className="dp-info-value">{selectedOrder.destination_address || '—'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Operational Notes */}
                {selectedOrder.customer_notes && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Operational Notes
                    </div>
                    <div className="dp-section-body">
                      <div className="note-text">{selectedOrder.customer_notes}</div>
                    </div>
                  </div>
                )}

                {/* Assign Driver Section */}
                {!selectedOrder.assigned_to && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {d.assignDriver || 'Assign Driver'}
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-assign-area">
                        {suggestedDrivers.length > 0 && (
                          <>
                            <div className="suggested-label">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                              {d.suggested || 'Smart Suggestions'}
                            </div>
                            {suggestedDrivers.slice(0, 3).map(drv => (
                              <div key={drv.id} className="dp-driver-suggestion" onClick={() => { setModalDriverId(drv.id); setModalOpen(true) }}>
                                <div className="d-photo">{drv.name[0]}</div>
                                <div className="d-info">
                                  <div className="d-name">{drv.name}</div>
                                  <div className="d-detail">{drv.vehicle} · {drv.languages} <span style={{ color: T.gold }}>★ {drv.rating}</span></div>
                                </div>
                                <span className="d-badge match">{drv.experience_level}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {otherDrivers.length > 0 && (
                          <div className="dp-other-drivers">
                            <div className="other-label">
                              {suggestedDrivers.length > 0 ? (d.otherAvailable || 'Other Available') : (d.availableDrivers || 'Available Drivers')}
                            </div>
                            {otherDrivers.slice(0, 4).map(drv => (
                              <div key={drv.id} className="dp-other-driver" onClick={() => { setModalDriverId(drv.id); setModalOpen(true) }}>
                                <div className="d-photo">{drv.name[0]}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{drv.name}</div>
                                  <div style={{ fontSize: 11, color: T.fgMuted, marginTop: 1 }}>{drv.vehicle} · ★ {drv.rating}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button className="dp-assign-btn" onClick={() => setModalOpen(true)} disabled={drivers.filter(drv => drv.status === 'available').length === 0}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                          {drivers.filter(drv => drv.status === 'available').length > 0 ? (d.assignButton || 'Assign Driver') : (d.noDriversAvailable || 'No drivers available')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Driver Info */}
                {selectedOrder.assigned_to && selectedOrder.driver_name && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/></svg>
                      {d.driver || 'Driver'}
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-info-grid">
                        <div className="dp-info-item"><span className="dp-info-label">{d.name || 'Name'}</span><span className="dp-info-value" style={{ color: T.accent }}>{selectedOrder.driver_name}</span></div>
                        <div className="dp-info-item"><span className="dp-info-label">{d.vehicle || 'Vehicle'}</span><span className="dp-info-value">{selectedOrder.driver_vehicle || '—'}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {['enroute', 'pickedup', 'completed'].map(s => (
                          <button key={s} style={{ width: 'auto', padding: '6px 12px', fontSize: 11, background: T.surface, color: T.fg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => doStatus(selectedOrder!.id, s)}>
                            {s === 'enroute' ? (d.markEnroute || 'En Route') : s === 'pickedup' ? (d.markPickup || 'Picked Up') : (d.markCompleted || 'Completed')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Drivers ── */}
        <div className="dispatch-panel dispatch-right">
          <div className="dp-header">
            <div className="dp-header-title">
              {d.drivers || 'Drivers'}
              <span className="dp-header-count">{drivers.length}</span>
            </div>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: T.fgSecondary, cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>

          <div className="dp-driver-category-tabs">
            {(['all', 'standard', 'suv', 'vip', 'luxury', 'van'] as const).map(cat => (
              <button key={cat} className={`dp-cat-tab ${driverCat === cat ? 'active' : ''}`} onClick={() => setDriverCat(cat)}>
                {cat === 'all' ? (d.allCategories || 'All') : cat === 'standard' ? (d.standard || 'Standard') : cat === 'suv' ? (d.suv || 'SUV') : cat === 'vip' ? (d.vIPSuv || 'VIP SUV') : cat === 'luxury' ? (d.luxury || 'Luxury') : (d.van || 'Van')}
              </button>
            ))}
          </div>

          <div className="dp-driver-list">
            {drivers.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: T.fgMuted, fontSize: 13 }}>{d.noDrivers || 'No drivers available'}</div>
            ) : drivers.map(drv => {
              const isSuggested = selectedOrder && suggestedDrivers.find(s => s.id === drv.id)
              const isAssigned = Object.values(assignedDrivers).includes(drv.id)
              const isUnavailable = drv.status !== 'available'
              const statusText = drv.status === 'available' ? 'Available' : drv.status === 'busy' ? 'On Trip' : 'Offline'
              return (
                <div
                  key={drv.id}
                  className={`dp-driver-card ${isSuggested ? 'suggested' : ''} ${isAssigned ? 'assigned' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                  onClick={() => { if (selectedOrder && !isUnavailable) { setModalDriverId(drv.id); setModalOpen(true) } }}
                >
                  <div className="dp-driver-photo">
                    {drv.name[0]}
                    <span className={`status-ring ${drv.status === 'available' ? 'online' : drv.status === 'busy' ? 'busy' : 'offline'}`} />
                  </div>
                  <div className="dp-driver-info">
                    <div className="dp-driver-name">
                      {drv.name}
                      {drv.vip_compatible ? <span style={{ fontSize: 9, color: T.gold }}>VIP</span> : null}
                    </div>
                    <div className="dp-driver-meta">
                      <span>{drv.vehicle}</span>
                      <span className="rating">★ {drv.rating}</span>
                      <span className="dp-driver-vehicle-tag">{drv.category}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.fgMuted, marginTop: 1, fontFamily: T.fontMono }}>
                      {drv.plate} · {drv.total_trips} trips
                    </div>
                  </div>
                  <div className="dp-driver-right">
                    <span className={`dp-driver-status-text ${drv.status === 'available' ? 'available' : drv.status === 'busy' ? 'busy' : 'offline'}`}>{statusText}</span>
                    {isSuggested && <span style={{ fontSize: 9, color: T.accent, fontWeight: 600 }}>★ Best match</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Assign Confirmation Modal ── */}
      {modalOpen && (
        <div className="dp-modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            {selectedDriver ? (
              <>
                <div className="assign-confirm-body">
                  <div className="icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3>{d.assignConfirm || 'Assign Driver?'}</h3>
                  <p>Confirm to dispatch this driver to the customer. A notification will be sent immediately.</p>
                  <div className="assign-confirm-details">
                    <div className="assign-confirm-row"><span className="label">{d.customer || 'Customer'}</span><span className="value">{selectedOrder?.customer_name || '—'}</span></div>
                    <div className="assign-confirm-row"><span className="label">{d.driver || 'Driver'}</span><span className="value">{selectedDriver.name}</span></div>
                    <div className="assign-confirm-row"><span className="label">{d.vehicle || 'Vehicle'}</span><span className="value">{selectedDriver.vehicle} ({selectedDriver.plate})</span></div>
                    <div className="assign-confirm-row"><span className="label">{d.pickup || 'Pickup'}</span><span className="value">{selectedOrder?.arrival_time?.substring(0, 5) || '--:--'}</span></div>
                  </div>
                </div>
                <div className="dp-modal-footer" style={{ justifyContent: 'center' }}>
                  <button onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: 'transparent', color: T.fg, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{d.cancel || 'Cancel'}</button>
                  <button onClick={() => selectedOrder && selectedDriver && doAssign(selectedOrder.id, selectedDriver.id)} style={{ padding: '8px 16px', borderRadius: T.radiusSm, border: 'none', background: T.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{d.confirm || 'Confirm Assignment'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="dp-modal-header">
                  <span style={{ fontSize: 16, fontWeight: 600, color: T.fg }}>{d.assignDriver || 'Assign Driver'}</span>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: T.fgSecondary, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                <div className="dp-modal-body">
                  <div style={{ fontSize: 13, color: T.fgSecondary }}>Select a driver from the right panel or suggestions above.</div>
                  {suggestedDrivers.length > 0 && suggestedDrivers.slice(0, 5).map(drv => (
                    <div key={drv.id} className="dp-driver-suggestion" onClick={() => setModalDriverId(drv.id)}>
                      <div className="d-photo">{drv.name[0]}</div>
                      <div className="d-info">
                        <div className="d-name">{drv.name}</div>
                        <div className="d-detail">{drv.vehicle} · ★ {drv.rating}</div>
                      </div>
                      <span className="d-badge match">{drv.experience_level}</span>
                    </div>
                  ))}
                  {otherDrivers.length > 0 && otherDrivers.slice(0, 3).map(drv => (
                    <div key={drv.id} className="dp-other-driver" onClick={() => setModalDriverId(drv.id)}>
                      <div className="d-photo">{drv.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{drv.name}</div>
                        <div style={{ fontSize: 11, color: T.fgMuted }}>{drv.vehicle} · ★ {drv.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dp-modal-footer">
                  <button onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: 'transparent', color: T.fg, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{d.cancel || 'Cancel'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Notifications Stack ── */}
      <div className="dp-notif-stack">
        {notifications.map(n => (
          <div key={n.id} className="dp-notif">
            <div className={`dp-notif-icon ${n.type === 'success' || n.type === 'assign' ? 'success' : n.type === 'warning' || n.type === 'unassign' ? 'warning' : 'info'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {n.type === 'success' || n.type === 'assign' ? <polyline points="20 6 9 17 4 12" /> :
                 n.type === 'warning' || n.type === 'unassign' ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> :
                 <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}
              </svg>
            </div>
            <div className="dp-notif-body">
              <div className="title">{n.title}</div>
              <div className="desc">{n.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Auth Modal ── */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
    </RealtimeProvider>
  )
}
