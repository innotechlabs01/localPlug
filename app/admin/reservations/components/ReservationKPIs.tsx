'use client'

import { useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Reservation } from '@/lib/reservations-types'

interface ReservationKPIsProps {
  reservations: Reservation[]
}

export default function ReservationKPIs({ reservations }: ReservationKPIsProps) {
  const { t } = useI18n()
  const metrics = useMemo(() => {
    const total = reservations.length
    const pending = reservations.filter(r => r.status === 'pending').length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const inProgress = reservations.filter(r => r.status === 'in_progress').length
    const completed = reservations.filter(r => r.status === 'completed').length
    const cancelled = reservations.filter(r => r.status === 'cancelled').length
    const paid = reservations.filter(r => r.paymentStatus === 'paid').length
    const totalRevenue = reservations.filter(r => r.paymentStatus === 'paid' || r.status === 'completed').reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    const vipClients = reservations.filter(r => r.vipStatus !== 'none').length

    return { total, pending, confirmed, inProgress, completed, cancelled, paid, totalRevenue, vipClients, paidPercent: total > 0 ? Math.round((paid / total) * 100) : 0 }
  }, [reservations])

  const kpis = [
    { label: t.admin.reservations.kpis?.total || 'Total', value: metrics.total, sub: `${metrics.paidPercent}% paid`, variant: 'kpi-total' },
    { label: t.admin.reservations.filters?.pending || 'Pending', value: metrics.pending, sub: 'Awaiting action', variant: 'kpi-pending' },
    { label: t.admin.reservations.filters?.confirmed || 'Confirmed', value: metrics.confirmed, sub: 'Ready', variant: 'kpi-confirmed' },
    { label: t.admin.reservations.filters?.inProgress || 'In Progress', value: metrics.inProgress, sub: 'Active', variant: '', barColor: 'var(--info)' },
    { label: t.admin.reservations.kpis?.revenue || 'Revenue', value: `$${metrics.totalRevenue.toLocaleString()}`, sub: `${metrics.vipClients} VIP`, variant: '', barColor: 'var(--accent)' },
    { label: t.admin.reservations.filters?.cancelled || 'Cancelled', value: metrics.cancelled, sub: 'Cancelled', variant: 'kpi-cancelled' },
  ]

  return (
    <div className="kpi-row">
      {kpis.map(kpi => (
        <div key={kpi.label} className={`res-kpi${kpi.variant ? ` ${kpi.variant}` : ''}`}>
          {kpi.barColor && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.barColor }} />}
          <div className="res-kpi-label">{kpi.label}</div>
          <div className="res-kpi-value">{kpi.value}</div>
          <div className="res-kpi-change">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}
