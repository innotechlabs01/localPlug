import { Reservation } from '@/lib/reservations-api'

interface ReservationFiltersProps {
  selectedFilter: 'all' | 'pending' | 'confirmed' | 'awaiting_payment' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  onFilterChange: (filter: 'all' | 'pending' | 'confirmed' | 'awaiting_payment' | 'assigned' | 'in_progress' | 'completed' | 'cancelled') => void
  reservationsCount: number
}

export default function ReservationFilters({ 
  selectedFilter, 
  onFilterChange, 
  reservationsCount 
}: ReservationFiltersProps) {
  const filters = [
    { id: 'all', label: 'All', count: reservationsCount },
    { id: 'pending', label: 'Pending', count: 0 }, // Will be calculated
    { id: 'confirmed', label: 'Confirmed', count: 0 },
    { id: 'awaiting_payment', label: 'Awaiting Payment', count: 0 },
    { id: 'assigned', label: 'Assigned', count: 0 },
    { id: 'in_progress', label: 'In Progress', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 },
    { id: 'cancelled', label: 'Cancelled', count: 0 }
  ]

  // Calculate counts for each filter (in a real app, this would come from the API)
  const filteredCounts = filters.map(filter => {
    if (filter.id === 'all') return { ...filter, count: reservationsCount }
    return {
      ...filter,
      count: reservations.filter(r => r.status === filter.id).length
    }
  })

  return (
    <div className="filter-tabs" id="filterTabs">
      {filteredCounts.map(filter => (
        <button
          key={filter.id}
          className={`filter-tab ${selectedFilter === filter.id ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.id as any)}
          data-filter={filter.id}
        >
          {filter.label} <span className="count">{filter.count}</span>
        </button>
      ))}
    </div>
  )
}