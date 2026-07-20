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
    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: b.bg, color: b.fg }}>
      {b.label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  )
}

export default function ReservationDetailModal({ open, reservation: r, onClose }: Props) {
  if (!open || !r) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
              >
                {r.guest.firstName.charAt(0)}{r.guest.lastName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.guest.firstName} {r.guest.lastName}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.bookingReference || r.orderNumber || ''}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Guest */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-gold)' }}>Huésped</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">{r.guest.email || '—'}</Field>
                <Field label="Teléfono">{r.guest.phone || '—'}</Field>
                <Field label="País">{r.guest.country || '—'}</Field>
                <Field label="Idioma">{r.guest.language || '—'}</Field>
              </div>
            </section>

            {/* Service */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-gold)' }}>Servicio</div>
              <div className="grid grid-cols-2 gap-3">
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
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-gold)' }}>Pago</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monto">
                  <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>${r.totalAmount.toLocaleString()}</span>
                </Field>
                <Field label="Estado"><Badge map={PAYMENT_MAP} status={r.paymentStatus} /></Field>
                <Field label="Método">{r.paymentMethod || '—'}</Field>
                <Field label="Transacción">{r.transactionId || '—'}</Field>
              </div>
            </section>

            {/* Driver */}
            {r.driverAssigned && (
              <section>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-gold)' }}>Conductor Asignado</div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.driverAssigned.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.driverAssigned.phone}</div>
                  </div>
                </div>
              </section>
            )}

            {/* Notes */}
            {r.specialRequests && (
              <section>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-gold)' }}>Notas</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {r.specialRequests}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
