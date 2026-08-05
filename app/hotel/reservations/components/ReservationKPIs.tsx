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
    const totalRevenue = reservations
      .filter(r => r.paymentStatus === 'paid' || r.status === 'completed')
      .reduce((s, r) => s + (r.totalAmount || 0), 0)

    return { total, pending, confirmed, inProgress, completed, cancelled, totalRevenue }
  }, [reservations])

  const kpis = [
    { label: 'Total', value: m.total, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) },
    { label: 'Pendientes', value: m.pending, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>) },
    { label: 'Confirmadas', value: m.confirmed, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>) },
    { label: 'En Progreso', value: m.inProgress, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>) },
    { label: 'Ingresos', value: `$${m.totalRevenue.toLocaleString()}`, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>) },
    { label: 'Canceladas', value: m.cancelled, color: 'var(--accent-gold)', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>) },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
      {kpis.map(k => (
        <div
          key={k.label}
          style={{
            padding: '16px', borderRadius: 'var(--radius-md)', position: 'relative', overflow: 'hidden',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: k.color,
          }} />
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(212,165,116,0.12)',
            color: k.color, marginBottom: '10px',
          }}>
            {k.icon}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
        </div>
      ))}
    </div>
  )
}
