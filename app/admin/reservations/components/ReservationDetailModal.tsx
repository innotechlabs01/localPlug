'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import type { Reservation, ConsentRecord, RoomBooking, ReservationStatusHistory } from '@/lib/reservations-types'
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
  const d = t.admin?.reservations || {}
  const [internalNotes, setInternalNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)

  useEffect(() => {
    if (!reservation) return
    setInternalNotes(reservation.internalNotes || '')
  }, [reservation])

  if (!open || !reservation) return null
  const res = reservation

  const consents = res.consents || []
  const roomBookings = res.roomBookings || []
  const statusHistory = res.statusHistory || []
  const payment = res.payment
  const hotel = res.hotel

  const latestConsent = consents.length > 0 ? consents[0] : null

  async function handleSaveNotes() {
    if (!res.id) return
    setNotesSaving(true)
    try {
      const resp = await adminFetch(`/api/admin/reservations/${res.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: internalNotes }),
      })
      if (!resp.ok) throw new Error('Failed to save notes')
    } catch (err) {
      console.error('Error saving notes:', err)
      alert('Failed to save internal notes. Please try again.')
    } finally {
      setNotesSaving(false)
    }
  }

  function getStatusText(status: string): string {
    const map: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', awaiting_payment: 'Awaiting Payment', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
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

  function getDispatchBadgeSimple(status: string): string {
    const map: Record<string, string> = { pending: 'pending', assigned: 'assigned', enroute: 'enroute', pickedup: 'pickedup', completed: 'completed' }
    return map[status] || 'pending'
  }

  function getAvatarColor(letter: string): string {
    const colors = ['var(--warning)', 'var(--accent)', 'var(--info)', 'var(--satisfaction)', 'var(--ui-surface-active)', 'var(--danger)', 'var(--warning)', 'var(--info-soft)', 'var(--accent-soft)', 'var(--info)']
    return colors[letter.charCodeAt(0) % colors.length]
  }

  function formatDate(dateStr: string): string {
    return formatDateFull(dateStr)
  }

  return (
    <>
      <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'all' }} onClick={onClose} />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="modal detail-modal" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal-header">
            <span className="modal-title">{d.reservationDetails || 'Reservation Details'}</span>
            <div className="flex items-center gap-2">
              <span className={`status-badge ${getStatusBadgeSimple(res.status)} text-xs px-2 py-1`}>
                {getStatusText(res.status)}
              </span>
              <button className="icon-btn" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div className="modal-body space-y-6">

            {/* ── 1. Guest Profile ── */}
            <div className="detail-section">
              <div className="detail-section-title">{d.touristProfile || 'Guest Profile'}</div>
              <div className="detail-grid">
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-field-label">{d.guest || 'Name'}</div>
                  <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="guest-avatar" style={{ background: getAvatarColor(res.guest.firstName.charAt(0)), color: 'white' }}>
                      {res.guest.firstName.charAt(0)}{res.guest.lastName.charAt(0)}
                    </div>
                    {res.guest.firstName} {res.guest.lastName}
                  </div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">{d.country || 'Country'}</div>
                  <div className="detail-field-value">{res.guest.country || 'N/A'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Phone</div>
                  <div className="detail-field-value">{res.guest.phone || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Email</div>
                  <div className="detail-field-value">{res.guest.email || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Language</div>
                  <div className="detail-field-value">{res.guest.language || 'Not specified'}</div>
                </div>
                {res.guest.notes && (
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-field-label">Guest Notes</div>
                    <div className="detail-field-value">{res.guest.notes}</div>
                  </div>
                )}
                {res.vipStatus !== 'none' && (
                  <div className="detail-field">
                    <div className="detail-field-label">VIP Level</div>
                    <div className="detail-field-value" style={{ color: 'var(--gold)' }}>{res.vipStatus}</div>
                  </div>
                )}
                {res.travelerProfile && (
                  <div className="detail-field">
                    <div className="detail-field-label">Traveler Profile</div>
                    <div className="detail-field-value">{res.travelerProfile}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 2. Trip Details ── */}
            <div className="detail-section">
              <div className="detail-section-title">{d.tripDetails || 'Trip Details'}</div>
              <div className="detail-grid">
                <div className="detail-field">
                  <div className="detail-field-label">{d.package || 'Package'}</div>
                  <div className="detail-field-value">{res.service.name}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Flight</div>
                  <div className="detail-field-value">{res.flightInfo || 'Not provided'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">{d.arrival || 'Arrival'}</div>
                  <div className="detail-field-value">{formatDate(String(res.arrivalDate || ''))} {res.arrivalTime || ''}</div>
                </div>
                {res.returnDate && (
                  <div className="detail-field">
                    <div className="detail-field-label">{d.return || 'Return'}</div>
                    <div className="detail-field-value">{res.returnDate} {res.returnTime || ''}</div>
                  </div>
                )}
                <div className="detail-field">
                  <div className="detail-field-label">Destination</div>
                  <div className="detail-field-value">{res.destinationAddress || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">Travelers</div>
                  <div className="detail-field-value">{res.numPeople || 1}</div>
                </div>
                {res.additionalTrips && res.additionalTrips.length > 0 && (
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-field-label">Additional Trips</div>
                    <div className="detail-field-value">{res.additionalTrips.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. Hotel & Room ── */}
            {hotel && (hotel.isHotelBooking || hotel.name || hotel.roomName) && (
              <div className="detail-section">
                <div className="detail-section-title">{d.hotelAccommodation || 'Hotel & Accommodation'}</div>
                <div className="detail-grid">
                  <div className="detail-field">
                    <div className="detail-field-label">Hotel</div>
                    <div className="detail-field-value">{hotel.name || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Room</div>
                    <div className="detail-field-value">{hotel.roomName || '—'}{hotel.roomType ? ` (${hotel.roomType})` : ''}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Nights</div>
                    <div className="detail-field-value">{hotel.numNights || 0}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Price/Night</div>
                    <div className="detail-field-value">${(hotel.pricePerNight || 0).toFixed(2)}</div>
                  </div>
                  {hotel.commissionRate != null && (
                    <div className="detail-field">
                      <div className="detail-field-label">Commission</div>
                      <div className="detail-field-value">${(hotel.commissionRate * 100).toFixed(0)}%</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 4. Payment ── */}
            <div className="detail-section">
              <div className="detail-section-title">{d.paymentDetails || 'Payment Details'}</div>
              <div className="detail-grid">
                <div className="detail-field">
                  <div className="detail-field-label">Amount</div>
                  <div className="detail-field-value"><strong style={{ color: 'var(--accent)' }}>${(res.totalAmount || 0).toLocaleString()}</strong></div>
                </div>
                {payment && (
                  <>
                    <div className="detail-field">
                      <div className="detail-field-label">Status</div>
                      <div className="detail-field-value">
                        <span className={`payment-badge ${getPaymentBadgeSimple(payment.status)}`}>{getPaymentText(payment.status)}</span>
                      </div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label">Method</div>
                      <div className="detail-field-value">{payment.method || 'Not specified'}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label">Transaction ID</div>
                      <div className="detail-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{payment.transactionId || '—'}</div>
                    </div>
                  </>
                )}
                <div className="detail-field">
                  <div className="detail-field-label">Dispatch Status</div>
                  <div className="detail-field-value">
                    <span className={`status-badge ${getDispatchBadgeSimple(res.dispatchStatus ?? 'pending')}`}>{res.dispatchStatus || 'pending'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 5. Legal Consents ── */}
            <div className="detail-section">
              <div className="detail-section-title">{d.legalConsents || 'Legal Consents (Ley 1581)'}</div>
              {consents.length > 0 ? (
                <div className="detail-grid">
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-field-label">Accepted At</div>
                    <div className="detail-field-value">{latestConsent?.acceptedAt || '—'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Terms & Conditions</div>
                    <div className="detail-field-value">
                      <span className={`consent-badge ${latestConsent?.termsAccepted ? 'accepted' : 'rejected'}`}>
                        {latestConsent?.termsAccepted ? d.accepted || 'Accepted' : d.notAccepted || 'Not Accepted'}
                      </span>
                      {latestConsent?.termsVersion && <span className="text-xs text-[var(--fg-muted)] ml-2">v{latestConsent.termsVersion}</span>}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Privacy Policy</div>
                    <div className="detail-field-value">
                      <span className={`consent-badge ${latestConsent?.privacyAccepted ? 'accepted' : 'rejected'}`}>
                        {latestConsent?.privacyAccepted ? d.accepted || 'Accepted' : d.notAccepted || 'Not Accepted'}
                      </span>
                      {latestConsent?.privacyVersion && <span className="text-xs text-[var(--fg-muted)] ml-2">v{latestConsent.privacyVersion}</span>}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-field-label">Refund Policy</div>
                    <div className="detail-field-value">
                      <span className={`consent-badge ${latestConsent?.refundAccepted ? 'accepted' : 'rejected'}`}>
                        {latestConsent?.refundAccepted ? d.accepted || 'Accepted' : d.notAccepted || 'Not Accepted'}
                      </span>
                      {latestConsent?.refundVersion && <span className="text-xs text-[var(--fg-muted)] ml-2">v{latestConsent.refundVersion}</span>}
                    </div>
                  </div>
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-field-label">IP Address</div>
                    <div className="detail-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{latestConsent?.ipAddress || '—'}</div>
                  </div>
                </div>
              ) : (
                <div className="detail-field-value" style={{ color: 'var(--fg-muted)' }}>{d.noConsents || 'No consent records found'}</div>
              )}
            </div>

            {/* ── 6. Driver Assigned ── */}
            {res.driverAssigned && (
              <div className="detail-section">
                <div className="detail-section-title">Assigned Driver</div>
                <div className="flex items-center gap-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 10, marginTop: 4 }}>
                  <div className="guest-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <div className="detail-field-value">{res.driverAssigned.name}</div>
                    <div className="detail-field-label">{res.driverAssigned.phone}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 7. Internal Notes (editable) ── */}
            <div className="detail-section">
              <div className="detail-section-title">{d.internalNotes || 'Internal Notes'}</div>
              <textarea
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                rows={3}
                disabled={loading}
              />
              {!notesSaving && (
                <button
                  onClick={handleSaveNotes}
                  disabled={loading}
                  className="mt-2 btn btn-secondary btn-sm"
                >
                  {d.saveNotes || 'Save Notes'}
                </button>
              )}
              {notesSaving && (
                <span className="mt-2 text-[12px] text-[var(--fg-muted)]">Saving...</span>
              )}
            </div>

            {/* ── 8. Status History ── */}
            {statusHistory && statusHistory.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">{d.statusHistory || 'Status History'}</div>
                <div className="timeline-list">
                  {statusHistory.slice(0, 10).map(h => (
                    <div key={h.id} className="timeline-item" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{getStatusText(h.newStatus)}</div>
                          {h.oldStatus && (
                            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{`From: ${getStatusText(h.oldStatus)}`}</div>
                          )}
                          {h.notes && <div className="text-xs" style={{ color: 'var(--fg-secondary)' }}>{h.notes}</div>}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{new Date(h.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Action buttons ── */}
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={onSendWhatsApp} disabled={loading} className="btn btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                {d.sendWhatsApp || 'Send WhatsApp'}
              </button>
              <button onClick={onCancelReservation} disabled={loading} className="btn btn-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {d.cancelReservation || 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
