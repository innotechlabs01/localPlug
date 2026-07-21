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

const STATUS_COLORS: Record<string, string> = {
  all: 'var(--accent-gold)',
  pending: '#facc15',
  confirmed: '#4ade80',
  awaiting_payment: '#60a5fa',
  assigned: '#a855f7',
  in_progress: '#60a5fa',
  completed: '#4ade80',
  cancelled: '#f87171',
}

export default function ReservationFilters({ selectedFilter, onFilterChange, reservations }: Props) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length }
    STATUS_ORDER.forEach(s => { if (s !== 'all') c[s] = reservations.filter(r => r.status === s).length })
    return c
  }, [reservations])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {STATUS_ORDER.map(status => {
        const isActive = selectedFilter === status
        const color = STATUS_COLORS[status] || 'var(--accent-gold)'
        return (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
              background: isActive ? color : 'var(--bg-card)',
              color: isActive ? 'var(--bg-dark)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? color : 'var(--border)'}`,
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.borderColor = color
                e.currentTarget.style.color = color
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-card)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {LABELS[status] || status}
            <span style={{ marginLeft: '6px', opacity: 0.6, fontSize: '11px' }}>{counts[status] || 0}</span>
          </button>
        )
      })}
    </div>
  )
}
