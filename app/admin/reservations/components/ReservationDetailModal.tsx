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
      <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'all' }} onClick={onClose} />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="modal detail-modal" style={{ maxWidth: 640 }}>
          <div className="modal-header">
            <span className="modal-title">{t.admin.reservations.touristProfile || 'Reservation Details'}</span>
            <button className="icon-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="detail-section-title">{t.admin.reservations.touristProfile || 'Tourist Profile'}</div>
            <div className="detail-grid">
              <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                <div className="detail-field-label">{t.admin.reservations.guest || 'Name'}</div>
                <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="guest-avatar" style={{ background: getAvatarColor(reservation.guest.firstName.charAt(0)), color: 'white' }}>
                    {reservation.guest.firstName.charAt(0)}{reservation.guest.lastName.charAt(0)}
                  </div>
                  {reservation.guest.firstName} {reservation.guest.lastName}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">{t.admin.reservations.country || 'Country'}</div>
                <div className="detail-field-value">{reservation.guest.country || 'Unknown'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Phone</div>
                <div className="detail-field-value">{reservation.guest.phone}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Email</div>
                <div className="detail-field-value">{reservation.guest.email}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Language</div>
                <div className="detail-field-value">{reservation.guest.language || 'Not specified'}</div>
              </div>
              {reservation.vipStatus !== 'none' && (
                <div className="detail-field">
                  <div className="detail-field-label">VIP Level</div>
                  <div className="detail-field-value" style={{ color: 'var(--gold)' }}>{reservation.vipStatus}</div>
                </div>
              )}
              {reservation.travelerProfile && (
                <div className="detail-field">
                  <div className="detail-field-label">Traveler Profile</div>
                  <div className="detail-field-value">{reservation.travelerProfile}</div>
                </div>
              )}
            </div>

            <div className="detail-section-title">{t.admin.reservations.serviceDetails || 'Service Details'}</div>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field-label">Package</div>
                <div className="detail-field-value">{reservation.service.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Flight</div>
                <div className="detail-field-value">{reservation.flightInfo || 'Not specified'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Arrival</div>
                <div className="detail-field-value">{formatDate(reservation.arrivalDate)} {reservation.arrivalTime}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Status</div>
                <div className="detail-field-value">
                  <span className={`status-badge ${getStatusBadgeSimple(reservation.status)}`}>{getStatusText(reservation.status)}</span>
                </div>
              </div>
              {reservation.destinationAddress && (
                <div className="detail-field">
                  <div className="detail-field-label">Destination</div>
                  <div className="detail-field-value">{reservation.destinationAddress}</div>
                </div>
              )}
              {reservation.returnDate && (
                <div className="detail-field">
                  <div className="detail-field-label">Return</div>
                  <div className="detail-field-value">{reservation.returnDate} {reservation.returnTime || ''}</div>
                </div>
              )}
            </div>

            <div className="detail-section-title">{t.admin.reservations.paymentDetails || 'Payment Details'}</div>
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field-label">Amount</div>
                <div className="detail-field-value"><strong style={{ color: 'var(--accent)' }}>${reservation.totalAmount.toLocaleString()}</strong></div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Status</div>
                <div className="detail-field-value">
                  <span className={`payment-badge ${getPaymentBadgeSimple(reservation.paymentStatus)}`}>{getPaymentText(reservation.paymentStatus)}</span>
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Method</div>
                <div className="detail-field-value">{reservation.paymentMethod || 'Not specified'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Transaction ID</div>
                <div className="detail-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{reservation.transactionId || '—'}</div>
              </div>
            </div>

            {/* Special Requests */}
            {reservation.specialRequests && (
              <>
                <div className="detail-section-title">{t.admin.reservations.specialRequests || 'Notes & Support'}</div>
                <div className="detail-notes">{reservation.specialRequests}</div>
              </>
            )}

            {/* Driver Info */}
            {reservation.driverAssigned && (
              <>
                <div className="detail-section-title">Assigned Driver</div>
                <div className="flex items-center gap-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 10, marginTop: 4 }}>
                  <div className="guest-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <div className="detail-field-value">{reservation.driverAssigned.name}</div>
                    <div className="detail-field-label">{reservation.driverAssigned.phone}</div>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={onSendWhatsApp} disabled={loading} className="btn btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                {t.admin.reservations.sendWhatsApp || 'Send WhatsApp'}
              </button>
              <button onClick={onCancelReservation} disabled={loading} className="btn btn-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {t.admin.reservations.cancelReservation || 'Cancel Reservation'}
              </button>
            </div>
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

function getStatusBadgeSimple(status: string): string {
  const map: Record<string, string> = { pending: 'pending', confirmed: 'confirmed', awaiting_payment: 'awaiting', assigned: 'assigned', in_progress: 'in-progress', completed: 'completed', cancelled: 'cancelled' }
  return map[status] || 'pending'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded' }
  return map[status] || 'Unknown'
}

function getPaymentBadgeSimple(status: string): string {
  const map: Record<string, string> = { pending: 'pending', paid: 'paid', partial: 'partial', refunded: 'refunded' }
  return map[status] || 'pending'
}

function getAvatarColor(letter: string): string {
  const colors = ['var(--warning)', 'var(--accent)', 'var(--info)', '#8b5cf6', '#14b8a6', '#64748b', 'var(--danger)', '#f97316', '#84cc16', '#06b6d4']
  return colors[letter.charCodeAt(0) % colors.length]
}

function formatDate(dateStr: string): string {
  return formatDateFull(dateStr)
}
