'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { getToday, getLocalDatePart } from '@/lib/date-utils'

interface Booking {
  id: string
  ref: string
  customerName: string
  country?: string
  airline?: string
  flightNumber?: string
  arrivalDate: string
  arrivalTime?: string
  selectedHotel?: string
  numNights?: number
  returnTransport?: boolean
  returnFee?: number
  total?: number
  driver?: string
  status?: string
  created_at: string
  travelPurpose?: string
  interests?: string[]
  hotelSubtotal?: number
}

// Fetch data from Real API
async function fetchReservations(): Promise<Booking[]> {
  const res = await adminFetch('/api/admin/reservations', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return (data.reservations || []).map((r: any) => ({
    id: r.id,
    ref: r.bookingReference || r.orderNumber || `ORD-${r.id}`,
    customerName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}`.trim() : 'Unknown',
    country: r.guest?.country,
    flightNumber: r.flightInfo?.split(' — ')[0] || '',
    airline: r.flightInfo?.split(' — ')[1] || '',
    arrivalDate: r.arrivalDate,
    arrivalTime: r.arrivalTime,
    selectedHotel: r.destinationAddress || '',
    total: r.totalAmount || 0,
    driver: r.driverAssigned?.name,
    status: r.status,
    created_at: r.createdAt,
    returnTransport: false,
  }))
}

async function fetchDrivers(): Promise<{ id: number; name: string; vehicle: string; plate: string; status: string }[]> {
  const res = await adminFetch('/api/admin/dispatch?tab=all', { cache: 'no-store' })
  if (!res.ok) return getMockDrivers()
  const data = await res.json()
  return (data.drivers || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    vehicle: d.vehicle,
    plate: d.plate,
    status: d.status || 'offline',
  }))
}

function getMockDrivers() {
  return [
    { id: 1, name: 'Carlos Mendoza', vehicle: 'Mercedes V-Class', plate: 'MDE-782', status: 'offline' },
    { id: 2, name: 'María González', vehicle: 'BMW X5', plate: 'MDE-511', status: 'offline' },
    { id: 3, name: 'Felipe López', vehicle: 'Mercedes S-Class', plate: 'VIP-001', status: 'offline' },
    { id: 4, name: 'Andrea Patiño', vehicle: 'Toyota Hiace', plate: 'MDE-903', status: 'offline' },
    { id: 5, name: 'Juan Ramírez', vehicle: 'Chevrolet Captiva', plate: 'MDE-217', status: 'offline' },
    { id: 6, name: 'Laura Jaramillo', vehicle: 'Nissan Urvan', plate: 'MDE-645', status: 'offline' },
    { id: 7, name: 'Pedro Restrepo', vehicle: 'Mercedes Sprinter', plate: 'VIP-002', status: 'offline' },
    { id: 8, name: 'Sofía Acevedo', vehicle: 'Kia Carnival', plate: 'MDE-388', status: 'offline' },
    { id: 9, name: 'Ricardo Toro', vehicle: 'Hyundai Staria', plate: 'MDE-779', status: 'offline' },
    { id: 10, name: 'Camila Duque', vehicle: 'Ford Transit', plate: 'MDE-124', status: 'offline' },
  ]
}

function getFlag(country?: string): string {
  const flags: Record<string, string> = {
    Argentina: '🇦🇷', USA: '🇺🇸', Spain: '🇪🇸', Mexico: '🇲🇽', UK: '🇬🇧',
    France: '🇫🇷', Colombia: '🇨🇴', Brazil: '🇧🇷', Chile: '🇨🇱', Peru: '🇵🇪',
    Ecuador: '🇪🇨', Canada: '🇨🇦', Germany: '🇩🇪', Italy: '🇮🇹', Portugal: '🇵🇹',
    Australia: '🇦🇺',
  }
  return flags[country || ''] || '🌍'
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const d = t.admin.dashboard

  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [assignedBookingRef, setAssignedBookingRef] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [drivers, setDrivers] = useState<{ id: number; name: string; vehicle: string; plate: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [bookingsData, driversData] = await Promise.all([
        fetchReservations(),
        fetchDrivers()
      ])
      setBookings(bookingsData)
      setDrivers(driversData)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_ERROR') {
        if (intervalRef.current) clearInterval(intervalRef.current)
        window.location.href = '/sign-in'
        return
      }
    }
    setLoading(false)
  }, [])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadData()
    intervalRef.current = setInterval(loadData, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadData])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const today = getToday()
  const todayBookings = useMemo(() => bookings.filter(b => getLocalDatePart(b.created_at) === today), [bookings, today])
  const pending = useMemo(() => todayBookings.filter(b => !b.driver), [todayBookings])
  const assigned = useMemo(() => todayBookings.filter(b => b.driver), [todayBookings])
  const totalRevenue = useMemo(() => todayBookings.reduce((s, b) => s + (b.total || 0), 0), [todayBookings])
  const returnCount = useMemo(() => todayBookings.filter(b => b.returnTransport).length, [todayBookings])
  const onlineDrivers = useMemo(() => drivers.filter(d => d.status === 'online'), [drivers])

  const filteredBookings = useMemo(() => {
    let list = todayBookings
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b =>
        b.customerName?.toLowerCase().includes(q) ||
        b.ref?.toLowerCase().includes(q) ||
        b.airline?.toLowerCase().includes(q) ||
        b.flightNumber?.toLowerCase().includes(q)
      )
    }
    return list
  }, [todayBookings, searchQuery])

  const sortedBookings = useMemo(() =>
    [...todayBookings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [todayBookings],
  )

  const activityItems = useMemo(() => sortedBookings.slice(0, 6), [sortedBookings])

  const hotelCount = useMemo(() =>
    todayBookings.filter(b => b.selectedHotel && (b.numNights || 0) > 0).length,
    [todayBookings],
  )

  const avgOrderValue = useMemo(() =>
    todayBookings.length ? Math.round(totalRevenue / todayBookings.length) : 0,
    [todayBookings, totalRevenue],
  )

  const handleOpenModal = useCallback((ref: string) => {
    const booking = bookings.find(b => b.ref === ref)
    if (!booking) return
    setAssignedBookingRef(ref)
    setSelectedDriver(booking.driver || '')
    setModalOpen(true)
  }, [bookings])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setAssignedBookingRef(null)
    setSelectedDriver('')
  }, [])

  const handleConfirmAssignment = useCallback(async () => {
    if (!selectedDriver || !assignedBookingRef) {
      setToast({ message: 'Please select a driver' })
      return
    }
    try {
      const driverObj = drivers.find(d => d.name === selectedDriver)
      const res = await adminFetch('/api/admin/dispatch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'assign', 
          orderId: parseInt(assignedBookingRef.replace('ORD-', '') || assignedBookingRef),
          driverId: driverObj?.id
        })
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => 
          b.ref === assignedBookingRef ? {...b, driver: selectedDriver, status: 'assigned'} : b
        ))
        handleCloseModal()
        setToast({ message: `✅ ${selectedDriver} assigned` })
      } else {
        setToast({ message: 'Failed to assign driver' })
      }
    } catch (err) {
      setToast({ message: 'Error assigning driver' })
    }
  }, [selectedDriver, assignedBookingRef, handleCloseModal, drivers])

  const openModal = useCallback((ref: string) => {
    handleOpenModal(ref)
  }, [handleOpenModal])

  const modalBooking = useMemo(() => {
    if (!assignedBookingRef) return null
    return bookings.find(b => b.ref === assignedBookingRef) || null
  }, [assignedBookingRef, bookings])

  const serviceChartData = useMemo(() => {
    const total = todayBookings.length || 1
    return [
      { label: 'Airport', count: todayBookings.length, color: 'accent' },
      { label: 'Return', count: returnCount, color: 'gold' },
      { label: 'Hotel', count: hotelCount, color: 'info' },
      { label: 'VIP', count: todayBookings.filter(b => b.travelPurpose === 'business' || b.interests?.includes('VIP')).length, color: 'purple' },
      { label: 'Transfer', count: todayBookings.filter(b => !b.returnTransport).length, color: 'teal' },
    ]
  }, [todayBookings, returnCount, hotelCount])

  const maxServiceCount = useMemo(() =>
    Math.max(...serviceChartData.map(s => s.count), 1),
    [serviceChartData],
  )

  return (
    <div className="exec-dash">
      {/* ── TOP KPI ROW ── */}
      <div>
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {d.executiveOverview as string}
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--fg-muted)' }}>
            {d.updatedJustNow as string}
          </span>
        </div>
        <div className="exec-kpi-row">
          <div className="exec-kpi kpi-arrivals">
            <div className="kpi-top">
              <div className="kpi-icon green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2M8 21h8"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.todayArrivals as string}</div>
            <div className="kpi-value">{todayBookings.length}</div>
            <div className={`kpi-sub ${todayBookings.length ? 'up' : ''}`}>
              {todayBookings.length ? `${todayBookings.length} arrival${todayBookings.length > 1 ? 's' : ''} today` : d.noArrivals as string}
            </div>
          </div>

          <div className="exec-kpi kpi-revenue">
            <div className="kpi-top">
              <div className="kpi-icon gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.totalRevenue as string}</div>
            <div className="kpi-value">${totalRevenue.toLocaleString()}</div>
            <div className={`kpi-sub ${totalRevenue ? 'up' : ''}`}>
              {totalRevenue ? `$${totalRevenue.toLocaleString()} total revenue` : d.noRevenue as string}
            </div>
          </div>

          <div className="exec-kpi kpi-services">
            <div className="kpi-top">
              <div className="kpi-icon blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.totalOrders as string}</div>
            <div className="kpi-value">{todayBookings.length}</div>
            <div className={`kpi-sub ${todayBookings.length ? 'up' : 'neutral'}`}>
              {todayBookings.length ? `${todayBookings.length} order${todayBookings.length > 1 ? 's' : ''} today` : d.noOrders as string}
            </div>
          </div>

          <div className="exec-kpi kpi-vehicles">
            <div className="kpi-top">
              <div className="kpi-icon amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.assigned as string}</div>
            <div className="kpi-value">{assigned.length}</div>
            <div className={`kpi-sub ${assigned.length ? 'up' : 'neutral'}`}>
              {assigned.length ? `${assigned.length} driver${assigned.length > 1 ? 's' : ''} assigned` : d.noDriversAssigned as string}
            </div>
          </div>

          <div className="exec-kpi kpi-satisfaction">
            <div className="kpi-top">
              <div className="kpi-icon purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.returnTransport as string}</div>
            <div className="kpi-value">{returnCount}</div>
            <div className={`kpi-sub ${returnCount ? 'up' : ''}`}>
              {returnCount ? `${returnCount} selected return` : d.noReturn as string}
            </div>
          </div>

          <div className="exec-kpi kpi-growth">
            <div className="kpi-top">
              <div className="kpi-icon teal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div className="kpi-label">{d.pendingAssignment as string}</div>
            <div className="kpi-value">{pending.length}</div>
            <div className={`kpi-sub ${pending.length ? 'neutral' : ''}`}>
              {pending.length ? `${pending.length} pending · ${onlineDrivers.length} ${d.online as string}` : d.allAssigned as string}
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S BOOKINGS ── */}
      <div>
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {d.todaysBookings as string}
          <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
            {pending.length} pending · {assigned.length} assigned
          </span>
        </div>
        <div className="todays-ops">
          {/* Left: Tourist Bookings */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.tourists as string}</span>
              <input
                type="text"
                className="input"
                style={{ width: 140, padding: '5px 10px', fontSize: 12 }}
                placeholder={d.filter as string}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="card-body" style={{ padding: '8px 12px' }}>
              <div className="ops-tourist-list">
                {filteredBookings.length === 0 ? (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                    <h3>{d.noBookingsYet as string}</h3>
                    <p>{d.noBookingsDesc as string}</p>
                  </div>
                ) : (
                  filteredBookings.map(b => {
                    const isVip = b.travelPurpose === 'business' || b.interests?.includes('VIP')
                    const hasDriver = !!b.driver
                    const status = hasDriver ? (d.assigned_ as string) : (d.pending as string)
                    const statusClass = hasDriver ? 'green' : 'amber'
                    const time = b.arrivalTime || '--:--'
                    const flag = getFlag(b.country)
                    return (
                      <div
                        key={b.ref}
                        className="ops-tourist-card"
                        onClick={() => openModal(b.ref)}
                      >
                        <div>
                          <div className="ops-tourist-name">
                            {b.customerName}
                            {isVip ? (
                              <span className="badge badge-gold" style={{ fontSize: 9, padding: '1px 6px' }}>VIP</span>
                            ) : b.returnTransport ? (
                              <span className="badge badge-accent" style={{ fontSize: 9, padding: '1px 6px' }}>Return</span>
                            ) : null}
                          </div>
                          <div className="ops-tourist-meta">
                            <span>{flag} {b.country || 'Unknown'}</span><span>·</span>
                            <span>✈️ {b.airline || ''}{b.flightNumber || ''}</span><span>·</span>
                            <span>{b.selectedHotel || 'No hotel'}</span>
                            {hasDriver && <><span>·</span><span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>🚗 {b.driver}</span></>}
                          </div>
                        </div>
                        <div className="ops-tourist-right">
                          <div className="ops-tourist-time">{time}</div>
                          <span className={`metric-pill ${statusClass}`} style={{ fontSize: 9 }}>{status}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Center: Assignment & Status Feed */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.assignmentStatus as string}</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="ops-activity-feed">
                {activityItems.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                    {d.noRecentActivity as string}
                  </div>
                ) : (
                  activityItems.map(b => (
                    <div
                      key={b.ref}
                      className={`ops-activity-item ${b.driver ? 'info' : ''}`}
                      style={!b.driver ? { borderLeftColor: 'var(--accent)' } : undefined}
                    >
                      <div
                        className="ops-activity-dot"
                        style={b.driver
                          ? { background: 'var(--info)', boxShadow: '0 0 8px var(--info)' }
                          : { background: 'var(--accent)' }
                        }
                      />
                      <div className="ops-activity-body">
                        {b.driver ? (
                          <>
                            <div className="ops-activity-title">🚗 Driver Assigned — {b.customerName}</div>
                            <div className="ops-activity-desc">
                              {b.driver} · {b.airline || ''}{b.flightNumber || ''} · {b.selectedHotel || 'No hotel'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="ops-activity-title">✅ New Booking — {b.customerName}</div>
                            <div className="ops-activity-desc">
                              {b.airline || ''}{b.flightNumber || ''} · ${(b.total || 0).toLocaleString()} · {b.returnTransport ? 'Return incl.' : 'Airport only'}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="ops-activity-time">{getTimeAgo(b.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Available Drivers */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.availableDrivers as string}</span>
              <span className="badge badge-accent" style={{ fontSize: 10 }}>{onlineDrivers.length} {d.online as string}</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...onlineDrivers, ...drivers.filter(d => d.status !== 'online')].map(driver => {
                  const dotClass = driver.status === 'online' ? 'online' : driver.status === 'away' ? 'away' : 'offline'
                  const badge = driver.status === 'online'
                    ? <span className="badge badge-accent" style={{ fontSize: 9 }}>Available</span>
                    : driver.status === 'away'
                      ? <span className="badge badge-warning" style={{ fontSize: 9 }}>Away</span>
                      : <span className="badge badge-warning" style={{ fontSize: 9 }}>Offline</span>
                  return (
                    <div key={driver.name} className="fleet-mini-card">
                      <div className="fleet-mini-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/>
                        </svg>
                      </div>
                      <div className="fleet-mini-info">
                        <div className="fleet-mini-name">{driver.name}</div>
                        <div className="fleet-mini-status">
                          <span className={`status-dot ${dotClass}`}></span> {driver.vehicle} · {driver.plate}
                        </div>
                      </div>
                      {badge}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REVENUE OVERVIEW ── */}
      <div>
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          {d.revenueOverview as string}
        </div>
        <div className="financial-breakdown">
          {/* Revenue Breakdown */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.revenueBreakdown as string}</span>
              <span className="badge badge-accent" style={{ fontSize: 10 }}>Today</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="rev-breakdown-list">
                <div className="rev-item">
                  <div className="rev-dot" style={{ background: 'var(--accent)' }} />
                  <span className="rev-label">{d.baseServices as string}</span>
                  <span className="rev-amount">
                    ${(totalRevenue - (todayBookings.filter(b => b.returnTransport).reduce((s, b) => s + (b.returnFee || 48), 0)) - (todayBookings.reduce((s, b) => s + (b.hotelSubtotal || (b.numNights || 0) * 85), 0))).toLocaleString()}
                  </span>
                </div>
                <div className="rev-item">
                  <div className="rev-dot" style={{ background: 'var(--info)' }} />
                  <span className="rev-label">{d.returnTransportRev as string}</span>
                  <span className="rev-amount">
                    ${todayBookings.filter(b => b.returnTransport).reduce((s, b) => s + (b.returnFee || 48), 0).toLocaleString()}
                  </span>
                </div>
                <div className="rev-item">
                  <div className="rev-dot" style={{ background: 'var(--gold)' }} />
                  <span className="rev-label">{d.hotelAccommodation as string}</span>
                  <span className="rev-amount">
                    ${todayBookings.reduce((s, b) => s + (b.hotelSubtotal || (b.numNights || 0) * 85), 0).toLocaleString()}
                  </span>
                </div>
                <div className="rev-item" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                  <div className="rev-dot" style={{ background: 'var(--fg)' }} />
                  <span className="rev-label" style={{ fontWeight: 700 }}>{d.totalRevenueLabel as string}</span>
                  <span className="rev-amount" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                    ${totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Popularity */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.servicePopularity as string}</span>
              <button className="btn btn-ghost btn-sm">Details</button>
            </div>
            <div className="card-body">
              <div className="chart-bar-row" style={{ height: 160 }}>
                {serviceChartData.map(s => {
                  const pct = Math.round((s.count / maxServiceCount) * 100)
                  return (
                    <div key={s.label} className="chart-bar-col">
                      <div className={`bar ${s.color}`} style={{ height: Math.max(pct, 4) }} />
                      <span className="bar-label">{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Payment Overview */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <span className="card-title">{d.paymentOverview as string}</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex-between">
                    <span style={{ fontSize: 12 }}>{d.totalTransactions as string}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{todayBookings.length}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: 12 }}>{d.withReturnTransport as string}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{returnCount}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: 12 }}>{d.withHotel as string}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--info)' }}>{hotelCount}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: 12 }}>{d.assignedToDriver as string}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>{assigned.length}</span>
                  </div>
                <div className="flex-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                  <span style={{ fontSize: 12 }}>{d.avgOrderValue as string}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>${avgOrderValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESERVATIONS TABLE ── */}
      <div>
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {d.allReservations as string}
          <span className="badge badge-accent">{todayBookings.length}</span>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{d.tableRef as string}</th>
                    <th>{d.tableCustomer as string}</th>
                    <th>{d.tableFlight as string}</th>
                    <th>{d.tableArrival as string}</th>
                    <th>{d.tableHotel as string}</th>
                    <th>{d.tableNights as string}</th>
                    <th>{d.tableReturn as string}</th>
                    <th>{d.tableTotal as string}</th>
                    <th>{d.tableDriver as string}</th>
                    <th>{d.tableStatus as string}</th>
                    <th>{d.tableAction as string}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)' }}>
                        {d.noReservations as string}
                      </td>
                    </tr>
                  ) : (
                    sortedBookings.map(b => {
                      const status = b.driver ? (d.assigned_ as string) : (d.pending as string)
                      const statusBadge = b.driver
                        ? <span className="badge badge-accent" style={{ fontSize: 10 }}>{d.assigned_ as string}</span>
                        : <span className="badge badge-warning" style={{ fontSize: 10 }}>{d.pending as string}</span>
                      const returnText = b.returnTransport
                        ? <span style={{ color: 'var(--accent)' }}>✓ {d.yes as string}</span>
                        : <span style={{ color: 'var(--fg-muted)' }}>—</span>
                      const arrivalText = b.arrivalDate
                        ? b.arrivalDate.split('T')[0] + (b.arrivalTime ? ' ' + b.arrivalTime : '')
                        : '—'
                      return (
                        <tr key={b.ref}>
                          <td><span className="booking-ref">{b.ref}</span></td>
                          <td><strong>{b.customerName}</strong></td>
                          <td>{b.airline || ''}{b.flightNumber || '' || '—'}</td>
                          <td style={{ fontSize: 12 }}>{arrivalText}</td>
                          <td>{b.selectedHotel || '—'}</td>
                          <td>{b.numNights || '—'}</td>
                          <td>{returnText}</td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            ${(b.total || 0).toLocaleString()}
                          </td>
                          <td>{b.driver || '—'}</td>
                          <td>{statusBadge}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openModal(b.ref)}
                              title={b.driver ? 'Reassign' : 'Assign driver'}
                            >
                              {b.driver ? '🔄' : '👤'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 0 20px', textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)', borderTop: '1px solid var(--border-light)' }}>
        Medellín Admin v2.0 · Operational Command Center · © 2025
      </div>

      {/* ── DRIVER ASSIGNMENT MODAL ── */}
      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={handleCloseModal}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{d.assignDriver as string}</span>
            <button className="icon-btn" onClick={handleCloseModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-label">{d.booking as string}</span>
              <span className="detail-value">
                {modalBooking ? <span className="booking-ref">{modalBooking.ref}</span> : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{d.customer as string}</span>
              <span className="detail-value">{modalBooking?.customerName || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{d.flight as string}</span>
              <span className="detail-value">{modalBooking ? `${modalBooking.airline || ''}${modalBooking.flightNumber || ''}` : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{d.total as string}</span>
              <span className="detail-value">${(modalBooking?.total || 0).toLocaleString()}</span>
            </div>
            <div className="input-group">
              <span className="input-label">{d.selectDriver as string}</span>
              <select
                className="input"
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
              >
                <option value="">{d.chooseDriver as string}</option>
                {drivers.map(driver => (
                  <option
                    key={driver.name}
                    value={driver.name}
                    disabled={driver.status !== 'online'}
                  >
                    {driver.name} · {driver.vehicle} ({driver.plate})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleCloseModal}>
              {d.cancel as string}
            </button>
            <button className="btn btn-primary" onClick={handleConfirmAssignment}>
              {d.confirmAssign as string}
            </button>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
