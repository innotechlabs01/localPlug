'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import ReservationKPIs from './components/ReservationKPIs'
import ReservationFilters from './components/ReservationFilters'
import ReservationTable from './components/ReservationTable'
import ReservationDetailModal from './components/ReservationDetailModal'
import type { Reservation, ReservationStatus } from '@/lib/reservations-types'

export default function AdminReservations() {
  const { t } = useI18n()
  const d = t.admin?.reservations || {}

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ReservationStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [flightFilter, setFlightFilter] = useState('')
  const [packageFilter, setPackageFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [countries, setCountries] = useState<{ code: string; name: string; flag: string }[]>([])

  useEffect(() => {
    adminFetch('/api/admin/lookup')
      .then(res => res.json())
      .then((data: any) => {
        if (data.countries) setCountries(data.countries)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadReservations()
    const interval = setInterval(loadReservations, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminFetch('/api/admin/reservations')
      const data = await res.json()
      setReservations(data.reservations || [])
    } catch (err) {
      setError('Failed to load reservations. Please try again.')
      console.error('Error fetching reservations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      if (selectedFilter !== 'all' && reservation.status !== selectedFilter) return false
      if (paymentFilter !== 'all' && reservation.paymentStatus !== paymentFilter) return false
      if (dateFrom && new Date(reservation.arrivalDate) < new Date(dateFrom)) return false
      if (dateTo && new Date(reservation.arrivalDate) > new Date(dateTo)) return false
      if (countryFilter && reservation.guest.country !== countryFilter) return false
      if (flightFilter && !reservation.flightInfo?.toLowerCase().includes(flightFilter.toLowerCase())) return false
      if (packageFilter && !reservation.service.name.toLowerCase().includes(packageFilter.toLowerCase())) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          reservation.guest.firstName.toLowerCase().includes(q) ||
          reservation.guest.lastName.toLowerCase().includes(q) ||
          reservation.guest.email.toLowerCase().includes(q) ||
          reservation.guest.country?.toLowerCase().includes(q) ||
          reservation.service.name.toLowerCase().includes(q) ||
          reservation.flightInfo?.toLowerCase().includes(q) ||
          reservation.bookingReference?.toLowerCase().includes(q) ||
          reservation.orderNumber?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [reservations, searchQuery, selectedFilter, dateFrom, dateTo, countryFilter, flightFilter, packageFilter, paymentFilter])

  const upcomingArrivals = useMemo(() => {
    const now = new Date()
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return reservations
      .filter(r => {
        const d = new Date(`${r.arrivalDate}T${r.arrivalTime || '00:00'}`)
        return d >= now && d <= next24Hours
      })
      .sort((a, b) => {
        const dA = new Date(`${a.arrivalDate}T${a.arrivalTime || '00:00'}`)
        const dB = new Date(`${b.arrivalDate}T${b.arrivalTime || '00:00'}`)
        return dA.getTime() - dB.getTime()
      })
  }, [reservations])

  const handleOpenModal = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setSelectedReservation(null)
  }, [])

  const handleSendWhatsApp = useCallback(async () => {
    if (!selectedReservation) return
    setActionLoading(true)
    try {
      const res = await adminFetch(`/api/admin/reservations/${selectedReservation.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedReservation.guest.phone,
          guestName: `${selectedReservation.guest.firstName} ${selectedReservation.guest.lastName}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to send WhatsApp')
      handleCloseModal()
    } catch (err) {
      console.error('Error sending WhatsApp:', err)
      alert('Failed to send WhatsApp message. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }, [selectedReservation, handleCloseModal])

  const handleCancelReservation = useCallback(async () => {
    if (!selectedReservation) return
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setActionLoading(true)
    try {
      const res = await adminFetch(`/api/admin/reservations?id=${selectedReservation.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to cancel reservation')
      setReservations(prev => prev.map(r =>
        r.id === selectedReservation.id ? { ...r, status: 'cancelled' as const } : r
      ))
      handleCloseModal()
    } catch (err) {
      console.error('Error cancelling reservation:', err)
      alert('Failed to cancel reservation. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }, [selectedReservation, handleCloseModal])

  const handleExportCSV = useCallback(() => {
    const headers = ['Guest', 'Country', 'Package', 'Arrival', 'Flight', 'Status', 'Payment', 'Amount']
    const rows = filteredReservations.map(r => [
      `${r.guest.firstName} ${r.guest.lastName}`,
      r.guest.country || '',
      r.service.name,
      `${r.arrivalDate} ${r.arrivalTime || ''}`,
      r.flightInfo || '',
      r.status,
      r.paymentStatus,
      `$${r.totalAmount}`,
    ])
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredReservations])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent w-10 h-10" />
        <span className="ml-4 text-[var(--fg-secondary)]">{d.loading || 'Loading reservations...'}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="bg-[var(--danger-soft)] border border-[var(--danger)] rounded-lg px-6 py-4 max-w-xl">
          <h3 className="text-sm font-medium text-[var(--danger)]">{d.errorTitle || 'Error loading reservations'}</h3>
          <div className="mt-2 text-sm text-[var(--fg-secondary)]">{error}</div>
          <button onClick={loadReservations} className="mt-4 bg-[var(--accent)] text-white font-medium py-1.5 px-4 rounded-[var(--radius-sm)] text-sm hover:opacity-90">
            {d.retry || 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  return (
      <div className="reservations-page">
        <ReservationKPIs reservations={reservations} />

        <div className="flex flex-wrap items-end gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
          <div className="input-group">
            <label className="input-label">{d.dateFrom || 'From'}</label>
            <input type="date" className="input" style={{ fontSize: 12, padding: '6px 10px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{d.dateTo || 'To'}</label>
            <input type="date" className="input" style={{ fontSize: 12, padding: '6px 10px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{d.country || 'Country'}</label>
            <select className="input" style={{ fontSize: 12, padding: '6px 10px' }} value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
              <option value="">All</option>
              {countries.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">{d.flight || 'Flight'}</label>
            <input type="text" className="input" style={{ fontSize: 12, padding: '6px 10px', width: 120 }} placeholder="Search..." value={flightFilter} onChange={e => setFlightFilter(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{d.package || 'Package'}</label>
            <input type="text" className="input" style={{ fontSize: 12, padding: '6px 10px', width: 120 }} placeholder="Search..." value={packageFilter} onChange={e => setPackageFilter(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{d.payment || 'Payment'}</label>
            <select className="input" style={{ fontSize: 12, padding: '6px 10px' }} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setCountryFilter(''); setFlightFilter(''); setPackageFilter(''); setPaymentFilter('all') }}>
            {d.clearFilters || 'Clear'}
          </button>
        </div>

        <ReservationFilters selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} reservations={reservations} />

        <div className="res-table-section">
          <div className="res-table-card">
            <div className="card-header">
              <span className="card-title">{d.allReservations || 'All Reservations'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <ReservationTable reservations={filteredReservations} onViewReservation={handleOpenModal} />
            </div>
          </div>

          <div className="timeline-card">
            <div className="card-header">
              <span className="card-title">{d.upcomingArrivals || 'Upcoming Arrivals'}</span>
              <span className="badge badge-accent" style={{ fontSize: 10 }}>
                {upcomingArrivals.length} {d.todayLabel || 'Today'}
              </span>
            </div>
            <div className="timeline-list">
              {upcomingArrivals.length > 0 ? upcomingArrivals.map(r => {
                const arrivalDate = new Date(`${r.arrivalDate}T${r.arrivalTime || '00:00'}`)
                const isArrived = arrivalDate < new Date()
                const dotClass = isArrived ? 'arrived' : r.status === 'pending' ? 'pending' : r.status === 'awaiting_payment' ? 'awaiting' : ''
                return (
                  <div key={r.id} className="timeline-item" onClick={() => handleOpenModal(r)} style={{ cursor: 'pointer' }}>
                    <div className={`timeline-dot${dotClass ? ` ${dotClass}` : ''}`} style={{ marginTop: 6, position: 'relative', zIndex: 1 }} />
                    <div className="timeline-body" style={{ padding: 0 }}>
                      <div className="timeline-time">{formatTime(r.arrivalTime)} — {getStatusText(r.status)}</div>
                      <div className="timeline-guest">{r.guest.firstName} {r.guest.lastName}</div>
                      <div className="timeline-meta">
                        {r.flightInfo && <span className="badge badge-info" style={{ fontSize: 10 }}>{r.flightInfo}</span>}
                        {r.service.name}
                      </div>
                    </div>
                    <div className="timeline-right">
                      <span className={`status-badge ${getStatusBadgeSimple(r.status)}`} style={{ fontSize: 10 }}>{getStatusText(r.status)}</span>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>{d.noUpcomingArrivals || 'No upcoming arrivals'}</div>
              )}
            </div>
          </div>
        </div>

        <ReservationDetailModal
          open={modalOpen}
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onSendWhatsApp={handleSendWhatsApp}
          onCancelReservation={handleCancelReservation}
          loading={actionLoading}
        />
      </div>
  )
}

function getStatusText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', awaiting_payment: 'Awaiting', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
  return map[status] || 'Unknown'
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[rgba(250,204,21,0.15)] text-yellow-400',
    confirmed: 'bg-[rgba(74,222,128,0.15)] text-green-400',
    awaiting_payment: 'bg-[rgba(96,165,250,0.15)] text-blue-400',
    assigned: 'bg-[rgba(167,139,250,0.15)] text-purple-400',
    in_progress: 'bg-[rgba(99,102,241,0.15)] text-indigo-400',
    completed: 'bg-[var(--surface-hover)] text-[var(--fg-secondary)]',
    cancelled: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  }
  return map[status] || 'bg-[var(--surface-hover)] text-[var(--fg-muted)]'
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5)
}

function getStatusBadgeSimple(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  return map[status] || 'pending'
}
