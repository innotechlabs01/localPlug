'use client'

import { useMemo } from 'react'
import type { Reservation } from '@/lib/reservations-types'

interface Props {
  reservations: Reservation[]
}

export default function ReservationKPIs({ reservations }: Props) {
  const m = useMemo(() => {
    const total = reservations.length
    const pending = reservations.filter(r => r.status === 'pending').length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const inProgress = reservations.filter(r => r.status === 'in_progress').length
    const completed = reservations.filter(r => r.status === 'completed').length
    const cancelled = reservations.filter(r => r.status === 'cancelled').length
    const paid = reservations.filter(r => r.paymentStatus === 'paid').length
    const totalRevenue = reservations
      .filter(r => r.paymentStatus === 'paid' || r.status === 'completed')
      .reduce((s, r) => s + (r.totalAmount || 0), 0)

    return { total, pending, confirmed, inProgress, completed, cancelled, paid, totalRevenue }
  }, [reservations])

  const kpis = [
    { label: 'Total', value: m.total, color: 'var(--text-primary)', bar: '' },
    { label: 'Pendientes', value: m.pending, color: '#facc15', bar: '#facc15' },
    { label: 'Confirmadas', value: m.confirmed, color: '#4ade80', bar: '#4ade80' },
    { label: 'En Progreso', value: m.inProgress, color: '#60a5fa', bar: '#60a5fa' },
    { label: 'Ingresos', value: `$${m.totalRevenue.toLocaleString()}`, color: 'var(--accent-gold)', bar: 'var(--accent-gold)' },
    { label: 'Canceladas', value: m.cancelled, color: '#f87171', bar: '#f87171' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div
          key={k.label}
          className="relative p-4 rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {k.bar && (
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.bar }} />
          )}
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{k.label}</div>
          <div className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
        </div>
      ))}
    </div>
  )
}
