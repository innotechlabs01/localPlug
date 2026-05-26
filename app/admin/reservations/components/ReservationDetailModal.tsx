'use client'

import { useI18n } from '@/lib/i18n'
import type { Reservation } from '@/lib/reservations-types'
import { formatDateFull } from '@/lib/date-utils'

interface ReservationDetailModalProps {
  open: boolean
  reservation: Reservation | null
  onClose: () => void
  onSendWhatsApp: () => void
  onCancelReservation: () => void
  loading?: boolean
}

export default function ReservationDetailModal({ open, reservation, onClose, onSendWhatsApp, onCancelReservation, loading }: ReservationDetailModalProps) {
  const { t } = useI18n()
  if (!open || !reservation) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div>
              <div className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{t.admin.reservations.touristProfile || 'Reservation Details'}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-[var(--fg-muted)] font-mono">Ref: {reservation.bookingReference || '—'}</span>
                <span className="text-[11px] text-[var(--fg-muted)] font-mono">#{reservation.orderNumber || '—'}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--fg-muted)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Guest Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h4 className="text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">{t.admin.reservations.touristProfile || 'Tourist Profile'}</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(reservation.guest.firstName.charAt(0)) }}>
                    {reservation.guest.firstName.charAt(0)}{reservation.guest.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{reservation.guest.firstName} {reservation.guest.lastName}</div>
                    <div className="text-[11px] text-[var(--fg-muted)]">{reservation.guest.email}</div>
                  </div>
                </div>
                <div className="space-y-1.5 text-[12px] text-[var(--fg-secondary)]">
                  <p>{reservation.guest.phone}</p>
                  <p>{reservation.guest.country || 'Unknown'}</p>
                  <p>{reservation.guest.language || 'Not specified'}</p>
                  {reservation.vipStatus !== 'none' && <p className="text-[var(--accent)] font-medium">VIP: {reservation.vipStatus}</p>}
                  {reservation.travelerProfile && <p>Profile: {reservation.travelerProfile}</p>}
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">{t.admin.reservations.serviceDetails || 'Service Details'}</h4>
                <div className="space-y-1.5 text-[12px] text-[var(--fg-secondary)]">
                  <p><span className="text-[var(--fg-muted)]">Package:</span> {reservation.service.name}</p>
                  <p><span className="text-[var(--fg-muted)]">Flight:</span> {reservation.flightInfo || 'Not specified'}</p>
                  <p><span className="text-[var(--fg-muted)]">Arrival:</span> {formatDate(reservation.arrivalDate)} {reservation.arrivalTime}</p>
                  <p><span className="text-[var(--fg-muted)]">Status:</span> <span className={getStatusBadgeClass(reservation.status)}>{getStatusText(reservation.status)}</span></p>
                  {reservation.destinationAddress && <p><span className="text-[var(--fg-muted)]">Destination:</span> {reservation.destinationAddress}</p>}
                  {reservation.returnDate && <p><span className="text-[var(--fg-muted)]">Return:</span> {reservation.returnDate} {reservation.returnTime || ''}</p>}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border-t border-[var(--border)] pt-4">
              <h4 className="text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">{t.admin.reservations.paymentDetails || 'Payment Details'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">
                  <div className="text-[10px] text-[var(--fg-muted)]">Amount</div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>${reservation.totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">
                  <div className="text-[10px] text-[var(--fg-muted)]">Status</div>
                  <span className={`text-[11px] font-semibold ${getPaymentBadgeClass(reservation.paymentStatus)}`}>{getPaymentText(reservation.paymentStatus)}</span>
                </div>
                <div className="bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">
                  <div className="text-[10px] text-[var(--fg-muted)]">Method</div>
                  <div className="text-[12px]" style={{ color: 'var(--fg)' }}>{reservation.paymentMethod || 'Not specified'}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">
                  <div className="text-[10px] text-[var(--fg-muted)]">Transaction</div>
                  <div className="text-[11px] font-mono text-[var(--fg-secondary)]">{reservation.transactionId || '—'}</div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {reservation.specialRequests && (
              <div className="border-t border-[var(--border)] pt-4">
                <h4 className="text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">{t.admin.reservations.specialRequests || 'Special Requests'}</h4>
                <p className="text-[12px] text-[var(--fg-secondary)] bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">{reservation.specialRequests}</p>
              </div>
            )}

            {/* Driver Info */}
            {reservation.driverAssigned && (
              <div className="border-t border-[var(--border)] pt-4">
                <h4 className="text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">Assigned Driver</h4>
                <div className="flex items-center gap-3 bg-[var(--bg)] rounded-[var(--radius-sm)] p-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium" style={{ color: 'var(--fg)' }}>{reservation.driverAssigned.name}</div>
                    <div className="text-[11px] text-[var(--fg-muted)]">{reservation.driverAssigned.phone}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
            <button onClick={onSendWhatsApp} disabled={loading} className="flex items-center gap-2 text-[12px] font-medium px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              {t.admin.reservations.sendWhatsApp || 'Send WhatsApp'}
            </button>
            <button onClick={onCancelReservation} disabled={loading} className="flex items-center gap-2 text-[12px] font-medium px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {t.admin.reservations.cancelReservation || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function getStatusText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', awaiting_payment: 'Awaiting', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
  return map[status] || 'Unknown'
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[rgba(250,204,21,0.15)] text-yellow-400 px-2 py-0.5 rounded-full',
    confirmed: 'bg-[rgba(74,222,128,0.15)] text-green-400 px-2 py-0.5 rounded-full',
    awaiting_payment: 'bg-[rgba(96,165,250,0.15)] text-blue-400 px-2 py-0.5 rounded-full',
    assigned: 'bg-[rgba(167,139,250,0.15)] text-purple-400 px-2 py-0.5 rounded-full',
    in_progress: 'bg-[rgba(99,102,241,0.15)] text-indigo-400 px-2 py-0.5 rounded-full',
    completed: 'bg-[var(--surface-hover)] text-[var(--fg-secondary)] px-2 py-0.5 rounded-full',
    cancelled: 'bg-[var(--danger-soft)] text-[var(--danger)] px-2 py-0.5 rounded-full',
  }
  return map[status] || 'bg-[var(--surface-hover)] text-[var(--fg-muted)] px-2 py-0.5 rounded-full'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded' }
  return map[status] || 'Unknown'
}

function getPaymentBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[rgba(250,204,21,0.15)] text-yellow-400 px-2 py-0.5 rounded-full',
    paid: 'bg-[rgba(74,222,128,0.15)] text-green-400 px-2 py-0.5 rounded-full',
    partial: 'bg-[rgba(96,165,250,0.15)] text-blue-400 px-2 py-0.5 rounded-full',
    refunded: 'bg-[var(--danger-soft)] text-[var(--danger)] px-2 py-0.5 rounded-full',
  }
  return map[status] || 'bg-[var(--surface-hover)] text-[var(--fg-muted)] px-2 py-0.5 rounded-full'
}

function getAvatarColor(letter: string): string {
  const colors = ['var(--warning)', 'var(--accent)', 'var(--info)', '#8b5cf6', '#14b8a6', '#64748b', 'var(--danger)', '#f97316', '#84cc16', '#06b6d4']
  return colors[letter.charCodeAt(0) % colors.length]
}

function formatDate(dateStr: string): string {
  return formatDateFull(dateStr)
}
