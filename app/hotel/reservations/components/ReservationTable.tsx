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
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 'var(--radius-sm)',
      fontSize: '11px', fontWeight: 600, background: b.bg, color: b.fg,
      letterSpacing: '0.02em',
    }}>
      {b.label}
    </span>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: '11px', fontWeight: 600,
  color: 'var(--text-muted)', textAlign: 'left',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border)',
}

export default function ReservationTable({ reservations, onView }: Props) {
  if (reservations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-elevated)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: 500 }}>No hay reservaciones</p>
        <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>Las reservaciones aparecerán aquí cuando estén disponibles</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Huésped', 'Paquete', 'Llegada', 'Vuelo', 'Estado', 'Pago', 'Acciones'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservations.map((r, idx) => (
            <tr
              key={r.id}
              onClick={() => onView(r)}
              style={{
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
                    color: 'var(--bg-dark)', boxShadow: '0 2px 6px rgba(212,165,116,0.2)',
                  }}>
                    {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{r.guest.firstName} {r.guest.lastName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.guest.country || ''}</div>
                  </div>
                </div>
              </td>
              <td style={tdStyle}>{r.service.name}</td>
              <td style={tdStyle}>
                <div style={{ color: 'var(--text-primary)' }}>{r.arrivalDate}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.arrivalTime?.substring(0, 5) || ''}</div>
              </td>
              <td style={{ ...tdStyle, fontSize: '12px' }}>{r.flightInfo || '—'}</td>
              <td style={tdStyle}><Badge map={STATUS_MAP} status={r.status} /></td>
              <td style={tdStyle}><Badge map={PAYMENT_MAP} status={r.paymentStatus} /></td>
              <td style={tdStyle}>
                <button
                  onClick={e => { e.stopPropagation(); onView(r) }}
                  style={{
                    padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    color: 'var(--text-muted)', border: 'none', background: 'transparent',
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-gold)'; e.currentTarget.style.background = 'rgba(212,165,116,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
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
