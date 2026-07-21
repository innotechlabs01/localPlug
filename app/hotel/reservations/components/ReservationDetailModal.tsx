'use client'

import type { Reservation } from '@/lib/reservations-types'

interface Props {
  open: boolean
  reservation: Reservation | null
  onClose: () => void
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
      fontSize: '12px', fontWeight: 600, background: b.bg, color: b.fg,
    }}>
      {b.label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{children}</div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--accent-gold)', marginBottom: '12px',
}

export default function ReservationDetailModal({ open, reservation: r, onClose }: Props) {
  if (!open || !r) return null

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 100, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 200ms cubic-bezier(0.4,0,0.2,1)',
      }} onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 101,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-md)',
          overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-dark), transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
                color: 'var(--bg-dark)', boxShadow: '0 2px 8px rgba(212,165,116,0.3)',
              }}>
                {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'var(--font-display)' }}>{r.guest.firstName} {r.guest.lastName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.bookingReference || r.orderNumber || ''}</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              color: 'var(--text-muted)', border: 'none', background: 'transparent',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Guest */}
            <section>
              <div style={sectionTitle}>Huésped</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Email">{r.guest.email || '—'}</Field>
                <Field label="Teléfono">{r.guest.phone || '—'}</Field>
                <Field label="País">{r.guest.country || '—'}</Field>
                <Field label="Idioma">{r.guest.language || '—'}</Field>
              </div>
            </section>

            {/* Service */}
            <section>
              <div style={sectionTitle}>Servicio</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Paquete">{r.service.name}</Field>
                <Field label="Vuelo">{r.flightInfo || '—'}</Field>
                <Field label="Llegada">{r.arrivalDate} {r.arrivalTime?.substring(0, 5) || ''}</Field>
                <Field label="Estado"><Badge map={STATUS_MAP} status={r.status} /></Field>
                {r.destinationAddress && <Field label="Destino">{r.destinationAddress}</Field>}
                {r.returnDate && <Field label="Regreso">{r.returnDate} {r.returnTime || ''}</Field>}
              </div>
            </section>

            {/* Payment */}
            <section>
              <div style={sectionTitle}>Pago</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Monto">
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '16px', fontFamily: 'var(--font-display)' }}>${r.totalAmount.toLocaleString()}</span>
                </Field>
                <Field label="Estado"><Badge map={PAYMENT_MAP} status={r.paymentStatus} /></Field>
                <Field label="Método">{r.paymentMethod || '—'}</Field>
                <Field label="Transacción">{r.transactionId || '—'}</Field>
              </div>
            </section>

            {/* Driver */}
            {r.driverAssigned && (
              <section>
                <div style={sectionTitle}>Conductor Asignado</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(74,222,128,0.12)', color: '#4ade80', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.driverAssigned.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.driverAssigned.phone}</div>
                  </div>
                </div>
              </section>
            )}

            {/* Notes */}
            {r.specialRequests && (
              <section>
                <div style={sectionTitle}>Notas</div>
                <div style={{
                  fontSize: '13px', padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', lineHeight: 1.6,
                }}>
                  {r.specialRequests}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  )
}
