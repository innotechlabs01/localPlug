'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { cardStyle, btnPrimary } from '@/lib/hotel/styles'
import type { Reservation, ReservationStatus } from '@/lib/reservations-types'
import ReservationKPIs from './components/ReservationKPIs'
import ReservationFilters from './components/ReservationFilters'
import ReservationTable from './components/ReservationTable'
import ReservationDetailModal from './components/ReservationDetailModal'

export default function HotelReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ReservationStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/hotel/reservations')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setReservations(data.reservations || [])
    } catch {
      setError('Error al cargar reservaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReservations()
    const interval = setInterval(loadReservations, 30000)
    return () => clearInterval(interval)
  }, [loadReservations])

  const filtered = useMemo(() => {
    return reservations.filter(r => {
      if (selectedFilter !== 'all' && r.status !== selectedFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          r.guest.firstName.toLowerCase().includes(q) ||
          r.guest.lastName.toLowerCase().includes(q) ||
          r.guest.email.toLowerCase().includes(q) ||
          r.service.name.toLowerCase().includes(q) ||
          r.flightInfo?.toLowerCase().includes(q) ||
          r.bookingReference?.toLowerCase().includes(q) ||
          r.orderNumber?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [reservations, searchQuery, selectedFilter])

  if (loading && reservations.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-gold)', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(248,113,113,0.1)', color: 'var(--danger)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={loadReservations}
          style={{ ...btnPrimary, padding: '10px 24px' }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', margin: 0,
            }}>Reservaciones</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {filtered.length} de {reservations.length} reservaciones
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted)">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Buscar huésped, vuelo, paquete..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
                borderRadius: 'var(--radius-sm)', fontSize: '13px', width: '280px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', outline: 'none',
                transition: 'border-color 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <ReservationKPIs reservations={reservations} />

      {/* Filters */}
      <ReservationFilters
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        reservations={reservations}
      />

      {/* Table */}
      <div style={cardStyle}>
        <ReservationTable
          reservations={filtered}
          onView={r => { setSelectedReservation(r); setModalOpen(true) }}
        />
      </div>

      {/* Detail Modal */}
      <ReservationDetailModal
        open={modalOpen}
        reservation={selectedReservation}
        onClose={() => { setModalOpen(false); setSelectedReservation(null) }}
      />
    </div>
  )
}
