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
    const paid = reservations.filter(r => r.paymentStatus === 'paid').length
    const totalRevenue = reservations.filter(r => r.paymentStatus === 'paid' || r.status === 'completed').reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    const vipClients = reservations.filter(r => r.vipStatus !== 'none').length

    return { total, pending, confirmed, inProgress, completed, paid, totalRevenue, vipClients, paidPercent: total > 0 ? Math.round((paid / total) * 100) : 0 }
  }, [reservations])

  const kpis = [
    { label: t.admin.reservations.kpis?.total || 'Total', value: metrics.total, sub: `${metrics.paidPercent}% paid`, color: 'var(--accent)' },
    { label: t.admin.reservations.filters?.pending || 'Pending', value: metrics.pending, sub: 'Awaiting action', color: 'var(--warning)' },
    { label: t.admin.reservations.filters?.confirmed || 'Confirmed', value: metrics.confirmed, sub: 'Ready', color: 'var(--accent)' },
    { label: t.admin.reservations.filters?.inProgress || 'In Progress', value: metrics.inProgress, sub: 'Active', color: 'var(--info)' },
    { label: t.admin.reservations.kpis?.revenue || 'Revenue', value: `$${metrics.totalRevenue.toLocaleString()}`, sub: `${metrics.vipClients} VIP`, color: 'var(--accent)' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map(kpi => (
        <div key={kpi.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
          <div className="text-[11px] text-[var(--fg-muted)] mb-1">{kpi.label}</div>
          <div className="text-[20px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}
