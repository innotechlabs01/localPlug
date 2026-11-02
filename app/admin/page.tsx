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
  total?: number
  driver?: string
  status?: string
  created_at: string
}

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
  if (!res.ok) return []
  const data = await res.json()
  return (data.drivers || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    vehicle: d.vehicle,
    plate: d.plate,
    status: d.status || 'offline',
  }))
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
  const [configValues, setConfigValues] = useState({ returnTripCharge: 48, hotelRevenuePerNight: 85 })
  const [income, setIncome] = useState<any>(null)

  useEffect(() => {
    adminFetch('/api/admin/income-summary', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setIncome(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => setConfigValues({
        returnTripCharge: cfg.returnTripCharge ?? 48,
        hotelRevenuePerNight: 85,
      }))
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [bookingsData, driversData] = await Promise.all([
        fetchReservations(),
        fetchDrivers(),
      ])
      setBookings(bookingsData)
      setDrivers(driversData)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_ERROR') {
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
  const totalRevenue = useMemo(() => todayBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total || 0), 0), [todayBookings])
  const returnCount = useMemo(() => todayBookings.filter(b => b.returnTransport).length, [todayBookings])
  const onlineDrivers = useMemo(() => drivers.filter(d => d.status === 'available'), [drivers])

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          orderId: Number(assignedBookingRef.replace(/^ORD-/, '').match(/\d+/)?.[0] ?? 0),
          driverId: driverObj?.id,
        }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b.ref === assignedBookingRef ? { ...b, driver: selectedDriver, status: 'assigned' } : b
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

  return (
    <div className="admin-page space-y-6">
      {/* ── TOP KPI ROW ── */}
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">{d.executiveOverview as string}</h1>
          <p className="admin-section-desc">{d.updatedJustNow as string}</p>
        </div>
      </section>
      <div className="admin-grid-6 admin-mb-4">
        {[
          {
            label: d.todayArrivals as string,
            value: todayBookings.length,
            sub: `${todayBookings.length} arrival${todayBookings.length > 1 ? 's' : ''} today`,
            color: 'green',
          },
          {
            label: d.totalRevenue as string,
            value: `${totalRevenue.toLocaleString()}`,
            sub: `${totalRevenue ? `$${totalRevenue.toLocaleString()} total revenue` : d.noRevenue as string}`,
            color: 'gold',
          },
          {
            label: d.totalOrders as string,
            value: todayBookings.length,
            sub: `${todayBookings.length} order${todayBookings.length > 1 ? 's' : ''} today`,
            color: 'blue',
          },
          {
            label: d.assigned as string,
            value: assigned.length,
            sub: `${assigned.length ? `${assigned.length} driver${assigned.length > 1 ? 's' : ''} assigned` : d.noDriversAssigned as string}`,
            color: 'amber',
          },
          {
            label: d.returnTransport as string,
            value: returnCount,
            sub: `${returnCount ? `${returnCount} selected return` : d.noReturn as string}`,
            color: 'purple',
          },
          {
            label: d.pendingAssignment as string,
            value: pending.length,
            sub: `${pending.length ? `${pending.length} pending · ${onlineDrivers.length} ${d.online as string}` : d.allAssigned as string}`,
            color: 'teal',
          },
        ].map((card, idx) => (
          <div key={idx} className="admin-kpi-card">
            <div className="admin-kpi-label">{card.label}</div>
            <div className="admin-kpi-value">{card.value}</div>
            <div className={`admin-kpi-sub ${card.color}`}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S BOOKINGS ── */}
      <section className="admin-card">
        <div className="admin-card-header admin-flex-between">
          <div>
            <h1 className="admin-page-title">{d.todaysBookings as string}</h1>
            <p className="admin-section-desc">{d.updatedJustNow as string}</p>
          </div>
          <div className="admin-field" style={{ width: 200 }}>
            <label className="admin-field-label">{d.filter as string}</label>
            <input
              className="admin-input"
              type="text"
              placeholder={d.filter as string}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                  <th style={{ textAlign: 'center' }}>{d.tableAction as string}</th>
                </tr>
              </thead>
              <tbody>
                {sortedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>
                      {d.noReservations as string}
                    </td>
                  </tr>
                ) : (
                  sortedBookings.map((b) => {
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
                        <td>{b.returnTransport ? <span style={{ color: 'var(--ui-accent)' }}>✓ {d.yes as string}</span> : <span style={{ color: 'var(--ui-fg-muted)' }}>—</span>}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          ${(b.total || 0).toLocaleString()}
                        </td>
                        <td>{b.driver || '—'}</td>
                        <td>{b.driver ? <span className="badge badge-accent" style={{ fontSize: 10 }}>{d.assigned_ as string}</span> : <span className="badge badge-warning" style={{ fontSize: 10 }}>{d.pending as string}</span>}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => handleOpenModal(b.ref)}
                          >
                            {d.confirmAssign as string}
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
      </section>

      {/* ── MODAL: Driver Assignment ── */}
      {modalOpen && (
        <div className="admin-modal-overlay open" onClick={handleCloseModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Assign Driver</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={handleCloseModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label className="admin-field-label">{d.tableCustomer as string}</label>
                <div className="admin-field-value">{assignedBookingRef || '—'}</div>
              </div>
              <div className="admin-field">
                <label className="admin-field-label">Driver</label>
                <select className="admin-input" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                  <option value="">{d.selectDriver as string}</option>
                  {drivers.map((dr) => (
                    <option key={dr.id} value={dr.name}>{dr.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={handleCloseModal}>{d.cancel as string}</button>
              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleConfirmAssignment} disabled={!selectedDriver}>
                {d.assignDriver as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
