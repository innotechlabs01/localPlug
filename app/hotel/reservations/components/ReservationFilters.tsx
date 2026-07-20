'use client'

import { useMemo } from 'react'
import type { Reservation, ReservationStatus } from '@/lib/reservations-types'

interface Props {
  selectedFilter: ReservationStatus | 'all'
  onFilterChange: (f: ReservationStatus | 'all') => void
  reservations: Reservation[]
}

const STATUS_ORDER: (ReservationStatus | 'all')[] = [
  'all', 'pending', 'confirmed', 'awaiting_payment', 'assigned', 'in_progress', 'completed', 'cancelled',
]

const LABELS: Record<string, string> = {
  all: 'Todas',
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  awaiting_payment: 'Pago Pendiente',
  assigned: 'Asignadas',
  in_progress: 'En Progreso',
  completed: 'Completadas',
  cancelled: 'Canceladas',
}

export default function ReservationFilters({ selectedFilter, onFilterChange, reservations }: Props) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length }
    STATUS_ORDER.forEach(s => { if (s !== 'all') c[s] = reservations.filter(r => r.status === s).length })
    return c
  }, [reservations])

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ORDER.map(status => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: selectedFilter === status ? 'var(--accent-gold)' : 'var(--bg-card)',
            color: selectedFilter === status ? 'var(--bg-dark)' : 'var(--text-secondary)',
            border: `1px solid ${selectedFilter === status ? 'var(--accent-gold)' : 'var(--border)'}`,
          }}
        >
          {LABELS[status] || status}
          <span className="ml-1.5 opacity-60">{counts[status] || 0}</span>
        </button>
      ))}
    </div>
  )
}
