'use client'

import Link from 'next/link'
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
    <div className="admin-page">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">{d.pageTitle || 'Reservas'}</h1>
          <p className="admin-section-desc">Gestiona todas las reservas de la plataforma. Cambia estados, asigna conductores y notifica a los huéspedes.</p>
        </div>
        <div className="admin-flex-between">
          <button onClick={handleExportCSV} className="admin-btn admin-btn-secondary admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {d.export_ || 'Exportar'}
          </button>
          <Link href="/booking" className="admin-btn admin-btn-primary admin-btn-sm">
            {d.newReservation || 'Nueva Reserva'}
          </Link>
        </div>
      </section>

      <ReservationKPIs reservations={reservations} />

      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.allReservations || 'Todas las Reservas'}</span>
          <div className="admin-tabs">
            <button className={`admin-tab ${selectedFilter === 'all' ? 'active' : ''}`} onClick={() => setSelectedFilter('all')}>
              {d.filters?.all || 'Todas'}
            </button>
            <button className={`admin-tab ${selectedFilter === 'pending' ? 'active' : ''}`} onClick={() => setSelectedFilter('pending')}>
              {d.filters?.pending || 'Pendiente'}
            </button>
            <button className={`admin-tab ${selectedFilter === 'confirmed' ? 'active' : ''}`} onClick={() => setSelectedFilter('confirmed')}>
              {d.filters?.confirmed || 'Confirmada'}
            </button>
            <button className={`admin-tab ${selectedFilter === 'assigned' ? 'active' : ''}`} onClick={() => setSelectedFilter('assigned')}>
              {d.filters?.assigned || 'Asignada'}
            </button>
            <button className={`admin-tab ${selectedFilter === 'completed' ? 'active' : ''}`} onClick={() => setSelectedFilter('completed')}>
              {d.filters?.completed || 'Completada'}
            </button>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-flex-between admin-mb-4">
            <div className="admin-field">
              <label className="admin-field-label">{d.searchPlaceholder || 'Buscar reservas...'}</label>
              <input
                className="admin-input"
                type="text"
                placeholder={d.searchPlaceholder || 'Buscar reservas...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setCountryFilter(''); setFlightFilter(''); setPackageFilter(''); setPaymentFilter('all') }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              {d.clearFilters || 'Limpiar filtros'}
            </button>
          </div>
          <div className="admin-table-wrap admin-mb-4">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Huésped</th>
                  <th>Paquete</th>
                  <th>Llegada</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Monto</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>
                      {d.noReservations || 'No se encontraron reservas'}
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr key={r.id} onClick={() => handleOpenModal(r)} style={{ cursor: 'pointer' }}>
                      <td>
                        <span className="admin-res-ref">{r.orderNumber || r.bookingReference}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-8" style={{ alignItems: 'center' }}>
                          <div className="admin-guest-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ui-accent), var(--ui-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>
                            {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{r.guest.firstName} {r.guest.lastName}</div>
                            <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{r.guest.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.service.name}</td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{r.arrivalDate}</div>
                        <div style={{ fontWeight: 600 }}>{r.arrivalTime || '--:--'}</div>
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeSimple(r.status)}`}>{getStatusText(r.status)}</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${getPaymentBadgeSimple(r.paymentStatus)}`}>{getPaymentText(r.paymentStatus)}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 12 }}>${(r.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(r) }}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Ver detalle"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-8 10-8 10 8 10 8-10 8-10-8"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {upcomingArrivals.length > 0 && (
            <div className="admin-mt-4">
              <div className="admin-section-header">
                <span className="admin-section-title">{d.upcomingArrivals || 'Próximas Llegadas'}</span>
                <span className="admin-badge accent">{upcomingArrivals.length} {d.todayLabel || 'Hoy'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingArrivals.map((r) => (
                  <div
                    key={r.id}
                    className="admin-res-card"
                    onClick={() => handleOpenModal(r)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="admin-res-card-header">
                      <span className="admin-res-ref">{r.orderNumber || r.bookingReference}</span>
                      <span className={`admin-badge ${getStatusBadgeSimple(r.status)}`}>{getStatusText(r.status)}</span>
                    </div>
                    <div className="admin-res-body">
                      <div className="admin-res-row">
                        <span className="admin-res-label">Huésped</span>
                        <span>{r.guest.firstName} {r.guest.lastName}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Paquete</span>
                        <span>{r.service.name}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Llegada</span>
                        <span>{r.arrivalDate} {r.arrivalTime || ''}</span>
                      </div>
                      {r.flightInfo && (
                        <div className="admin-res-row">
                          <span className="admin-res-label">Vuelo</span>
                          <span style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 11 }}>{r.flightInfo}</span>
                        </div>
                      )}
                    </div>
                    <div className="admin-res-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(r) }}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

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

function getPaymentText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded' }
  return map[status] || 'Unknown'
}

function getPaymentBadgeSimple(status: string): string {
  const map: Record<string, string> = { pending: 'pending', paid: 'paid', partial: 'partial', refunded: 'refunded' }
  return map[status] || 'pending'
}
