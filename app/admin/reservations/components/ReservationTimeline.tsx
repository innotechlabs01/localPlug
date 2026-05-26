import type { Reservation } from '@/lib/reservations-types'

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
      const dateA = new Date(`${a.arrivalDate}T${a.arrivalTime || '00:00'}`)
      const dateB = new Date(`${b.arrivalDate}T${b.arrivalTime || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })

  if (upcomingArrivals.length === 0) {
    return (
      <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
        No upcoming arrivals
      </div>
    )
  }

  return (
    <div className="timeline-list">
      {upcomingArrivals.map(reservation => {
        const arrivalDate = new Date(`${reservation.arrivalDate}T${reservation.arrivalTime || '00:00'}`)
        const isArrived = arrivalDate < new Date()
        const dotClass = isArrived ? 'arrived' : reservation.status === 'pending' ? 'pending' : reservation.status === 'awaiting_payment' ? 'awaiting' : ''
        return (
          <div key={reservation.id} className="timeline-item">
            <div className={`timeline-dot${dotClass ? ` ${dotClass}` : ''}`} style={{ marginTop: 6, position: 'relative', zIndex: 1 }} />
            <div className="timeline-body" style={{ padding: 0 }}>
              <div className="timeline-time">
                {formatTime(reservation.arrivalTime)} — {getStatusText(reservation.status)}
              </div>
              <div className="timeline-guest">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </div>
              <div className="timeline-meta">
                {reservation.flightInfo && <span className="badge badge-info" style={{ fontSize: 10 }}>{reservation.flightInfo}</span>}
                {reservation.service.name}
              </div>
            </div>
            <div className="timeline-right">
              <span className={`status-badge ${getStatusBadgeClass(reservation.status)}`} style={{ fontSize: 10 }}>
                {getStatusText(reservation.status)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
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