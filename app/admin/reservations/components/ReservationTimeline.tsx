import { Reservation } from '@/lib/reservations-api'

interface ReservationTimelineProps {
  reservations: Reservation[]
}

export default function ReservationTimeline({ reservations }: ReservationTimelineProps) {
  // Get upcoming arrivals (next 24 hours)
  const upcomingArrivals = reservations
    .filter(reservation => {
      const now = new Date()
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const arrivalDate = new Date(`${reservation.arrivalDate}T${reservation.arrivalTime || '00:00'}`)
      return arrivalDate >= now && arrivalDate <= next24Hours
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.arrivalDate}${a.arrivalTime || '00:00'}`)
      const dateB = new Date(`${b.arrivalDate}${b.arrivalTime || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })

  if (upcomingArrivals.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No upcoming arrivals
      </div>
    )
  }

  return (
    <div className="timeline-list">
      {upcomingArrivals.map((reservation, index) => (
        <div key={reservation.id} className="timeline-item">
          <div className="timeline-line">
            <div 
              className={`timeline-dot ${getStatusClass(reservation.status)}`} 
              // Add arrived class if it's in the past
              {...(new Date(`${reservation.arrivalDate}${reservation.arrivalTime || '00:00'}`) < new Date() ? 
                { className: 'timeline-dot arrived' } : {})}
            />
          </div>
          <div className="timeline-body">
            <div className="timeline-time">
              {formatTime(reservation.arrivalTime)} — {getStatusText(reservation.status)}
            </div>
            <div className="timeline-guest">
              {reservation.guest.firstName} {reservation.guest.lastName}
            </div>
            <div className="timeline-meta">
              <span className="badge badge-info" style={{ fontSize: '10px' }}>
                {reservation.flightInfo || ''}
              </span> {reservation.service.name}
            </div>
          </div>
          <div className="timeline-right">
            <span 
              className={`status-badge ${getStatusBadgeClass(reservation.status)}`} 
              style={{ fontSize: '10px' }}
            >
              {getStatusText(reservation.status)}
            </span>
          </div>
          {/* Add connecting line except for last item */}
          {index < upcomingArrivals.length - 1 && (
            <div className="timeline-line">
              <div className="timeline-dot" style={{ borderColor: '#e5e7eb' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper functions
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'border-warning',
    confirmed: 'border-success',
    awaiting_payment: 'border-info',
    assigned: 'border-primary',
    in_progress: 'border-secondary',
    completed: 'border-neutral',
    cancelled: 'border-error'
  }
  return statusMap[status] || 'border-warning'
}

function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled'
  }
  return statusMap[status] || 'pending'
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    awaiting_payment: 'Awaiting Payment',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || 'Unknown'
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5) // Ensure HH:MM format
}