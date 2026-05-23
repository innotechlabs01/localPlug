import { useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { Reservation } from '@/lib/reservations-api'

interface ReservationKPIsProps {
  reservations: Reservation[]
}

export default function ReservationKPIs({ reservations }: ReservationKPIsProps) {
  const { t } = useI18n()
  const metrics = useMemo(() => {
    const total = reservations.length
    const pending = reservations.filter(r => r.status === 'pending').length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const awaitingPayment = reservations.filter(r => r.status === 'awaiting_payment').length
    const assigned = reservations.filter(r => r.status === 'assigned').length
    const inProgress = reservations.filter(r => r.status === 'in_progress').length
    const completed = reservations.filter(r => r.status === 'completed').length
    const cancelled = reservations.filter(r => r.status === 'cancelled').length
    
    const paid = reservations.filter(r => r.paymentStatus === 'paid').length
    const unpaid = reservations.filter(r => r.paymentStatus === 'pending').length
    const partiallyPaid = reservations.filter(r => r.paymentStatus === 'partial').length
    
    const totalRevenue = reservations
      .filter(r => r.paymentStatus === 'paid' || r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    
    const vipClients = reservations.filter(r => r.vipStatus !== 'none').length
    
    return {
      total,
      pending,
      confirmed,
      awaitingPayment,
      assigned,
      inProgress,
      completed,
      cancelled,
      paid,
      unpaid,
      partiallyPaid,
      totalRevenue,
      vipClients,
      paidPercent: total > 0 ? Math.round((paid / total) * 100) : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [reservations])

  return (
    <div className="kpi-row">
      <div className="res-kpi kpi-total">
        <div className="res-kpi-label">{t.admin.reservations.kpis?.total || 'Total'}</div>
        <div className="res-kpi-value">{metrics.total}</div>
        <div className="res-kpi-change">{metrics.paidPercent}% paid</div>
      </div>
      <div className="res-kpi kpi-pending">
        <div className="res-kpi-label">{t.admin.reservations.filters.pending || 'Pending'}</div>
        <div className="res-kpi-value">{metrics.pending}</div>
        <div className="res-kpi-change">{metrics.awaitingPayment} awaiting payment</div>
      </div>
      <div className="res-kpi kpi-confirmed">
        <div className="res-kpi-label">{t.admin.reservations.filters.confirmed || 'Confirmed'}</div>
        <div className="res-kpi-value">{metrics.confirmed}</div>
        <div className="res-kpi-change">{metrics.assigned} assigned</div>
      </div>
      <div className="res-kpi kpi-awaiting">
        <div className="res-kpi-label">{t.admin.reservations.filters.inProgress || 'In Progress'}</div>
        <div className="res-kpi-value">{metrics.inProgress}</div>
        <div className="res-kpi-change">{metrics.completionRate}% completed</div>
      </div>
      <div className="res-kpi kpi-completed">
        <div className="res-kpi-label">{t.admin.reservations.kpis?.revenue || 'Revenue'}</div>
        <div className="res-kpi-value">${metrics.totalRevenue.toLocaleString()}</div>
        <div className="res-kpi-change">{metrics.vipClients} VIP</div>
      </div>
    </div>
  )
}