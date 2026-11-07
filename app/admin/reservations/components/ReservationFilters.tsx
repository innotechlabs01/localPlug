'use client'

import { useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Reservation, ReservationStatus } from '@/lib/reservations-types'

interface ReservationFiltersProps {
  selectedFilter: ReservationStatus | 'all'
  onFilterChange: (filter: ReservationStatus | 'all') => void
  reservations: Reservation[]
}

const STATUS_ORDER: ReservationStatus[] = ['pending', 'confirmed', 'awaiting_payment', 'assigned', 'in_progress', 'completed', 'cancelled']

export default function ReservationFilters({ selectedFilter, onFilterChange, reservations }: ReservationFiltersProps) {
  const { t } = useI18n()
  const labels = t.admin?.reservations?.filters || {}

  const getLabel = (status: ReservationStatus | 'all'): string => {
    if (status === 'all') return labels.all || 'All'
    if (status === 'awaiting_payment') return labels.awaitingPayment || 'Awaiting'
    if (status === 'in_progress') return labels.inProgress || 'In Progress'
    return labels[status] || status
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length }
    STATUS_ORDER.forEach(status => { c[status] = reservations.filter(r => r.status === status).length })
    return c
  }, [reservations])

  return (
    <div className="filter-tabs">
      <button
        className={selectedFilter === 'all' ? 'filter-tab active' : 'filter-tab'}
        onClick={() => onFilterChange('all')}
      >
        {labels.all || 'All'} <span className="count">{counts.all}</span>
      </button>
      {STATUS_ORDER.map(status => (
        <button
          key={status}
          className={selectedFilter === status ? 'filter-tab active' : 'filter-tab'}
          onClick={() => onFilterChange(status)}
        >
          {getLabel(status)} <span className="count">{counts[status]}</span>
        </button>
      ))}
    </div>
  )
}
