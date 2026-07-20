'use client'

import type { Reservation } from '@/lib/reservations-types'

interface Props {
  reservations: Reservation[]
  onView: (r: Reservation) => void
}

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  confirmed: { label: 'Confirmada', bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  awaiting_payment: { label: 'Pago Pendiente', bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  assigned: { label: 'Asignada', bg: 'rgba(168,85,247,0.12)', fg: '#a855f7' },
  in_progress: { label: 'En Progreso', bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  completed: { label: 'Completada', bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  cancelled: { label: 'Cancelada', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

const PAYMENT_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  paid: { label: 'Pagado', bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  partial: { label: 'Parcial', bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  refunded: { label: 'Reembolsado', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

function Badge({ map, status }: { map: Record<string, { label: string; bg: string; fg: string }>; status: string }) {
  const b = map[status] || { label: status, bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: b.bg, color: b.fg }}
    >
      {b.label}
    </span>
  )
}

export default function ReservationTable({ reservations, onView }: Props) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-sm">No hay reservaciones</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Huésped', 'Paquete', 'Llegada', 'Vuelo', 'Estado', 'Pago', 'Acciones'].map(h => (
              <th key={h} className="text-left py-3 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr
              key={r.id}
              onClick={() => onView(r)}
              className="cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
                  >
                    {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.guest.firstName} {r.guest.lastName}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.guest.country || ''}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>{r.service.name}</td>
              <td className="py-3 px-3">
                <div style={{ color: 'var(--text-primary)' }}>{r.arrivalDate}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.arrivalTime?.substring(0, 5) || ''}</div>
              </td>
              <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.flightInfo || '—'}</td>
              <td className="py-3 px-3"><Badge map={STATUS_MAP} status={r.status} /></td>
              <td className="py-3 px-3"><Badge map={PAYMENT_MAP} status={r.paymentStatus} /></td>
              <td className="py-3 px-3">
                <button
                  onClick={e => { e.stopPropagation(); onView(r) }}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-gold)'; (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,98,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
