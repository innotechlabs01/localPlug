import { Reservation } from '@/lib/reservations-api'

interface ReservationKPIsProps {
  reservations: Reservation[]
}

export default function ReservationKPIs({ reservations }: ReservationKPIsProps) {
  const total = reservations.length
  const pending = reservations.filter(r => r.status === 'pending').length
  const confirmed = reservations.filter(r => r.status === 'confirmed').length
  const awaitingPayment = reservations.filter(r => r.status === 'awaiting_payment').length
  const completed = reservations.filter(r => r.status === 'completed').length
  const cancelled = reservations.filter(r => r.status === 'cancelled').length

  // Calculate percentage changes (mock data for now)
  const pendingChange = Math.round((pending / total) * 100) || 0
  const confirmedChange = total > 0 ? Math.round(((confirmed - (total * 0.5)) / total) * 100) : 0
  const awaitingChange = total > 0 ? Math.round(((awaitingPayment - (total * 0.1)) / total) * 100) : 0
  const completedChange = total > 0 ? Math.round(((completed - (total * 0.3)) / total) * 100) : 0
  const cancelledChange = Math.abs(cancelled - (total * 0.05)) // Mock change

  return (
    <div className="kpi-row">
      <div className="res-kpi kpi-total">
        <div className="res-kpi-label">Total Reservations</div>
        <div className="res-kpi-value">{total}</div>
        <div className="res-kpi-change up">↑ +{Math.max(0, confirmedChange)}% vs last month</div>
      </div>
      <div className="res-kpi kpi-pending">
        <div className="res-kpi-label">Pending</div>
        <div className="res-kpi-value">{pending}</div>
        <div className="res-kpi-change neutral">{pendingChange}% of total</div>
      </div>
      <div className="res-kpi kpi-confirmed">
        <div className="res-kpi-label">Confirmed</div>
        <div className="res-kpi-value">{confirmed}</div>
        <div className="res-kpi-change up">↑ +{Math.max(0, confirmedChange)}% vs last month</div>
      </div>
      <div className="res-kpi kpi-awaiting">
        <div className="res-kpi-label">Awaiting Payment</div>
        <div className="res-kpi-value">{awaitingPayment}</div>
        <div className="res-kpi-change down">↓ -{Math.max(0, Math.abs(awaitingChange))}% vs last month</div>
      </div>
      <div className="res-kpi kpi-completed">
        <div className="res-kpi-label">Completed</div>
        <div className="res-kpi-value">{completed}</div>
        <div className="res-kpi-change up">↑ +{Math.max(0, completedChange)}% vs last month</div>
      </div>
      <div className="res-kpi kpi-cancelled">
        <div className="res-kpi-label">Cancelled</div>
        <div className="res-kpi-value">{cancelled}</div>
        <div className="res-kpi-change down">↑ +{Math.max(0, cancelledChange)} vs last month</div>
      </div>
    </div>
  )
}