'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>
        <button
          onClick={loadReservations}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reservaciones</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} de {reservations.length} reservaciones
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Buscar huésped, vuelo, paquete..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg text-sm w-full sm:w-72"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
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
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
