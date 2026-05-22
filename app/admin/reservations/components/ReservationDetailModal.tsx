import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Reservation } from '@/lib/reservations-api'

interface ReservationDetailModalProps {
  open: boolean
  reservation: Reservation | null
  onClose: () => void
  onSendWhatsApp: () => void
  onCancelReservation: () => void
}

export default function ReservationDetailModal({ 
  open, 
  reservation, 
  onClose, 
  onSendWhatsApp, 
  onCancelReservation 
}: ReservationDetailModalProps) {
  const { t } = useI18n()
  if (!open || !reservation) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        onClick={onClose}
      />
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center" 
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="relative w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <div className="relative bg-white rounded-lg shadow-xl p-6">
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="space-y-6">
              {/* Booking Reference / Order Number */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span><span className="font-medium text-gray-700">Booking Ref:</span> <span className="font-mono">{reservation.bookingReference || '—'}</span></span>
                <span><span className="font-medium text-gray-700">Order #:</span> <span className="font-mono">{reservation.orderNumber || '—'}</span></span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t.admin.reservations.touristProfile || 'Tourist Profile'}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div 
                        className="flex items-center justify-center rounded-full w-8 h-8"
                        style={{ backgroundColor: getAvatarColor(reservation.guest.firstName.charAt(0)), color: 'white' }}
                      >
                        {reservation.guest.firstName.charAt(0)}{reservation.guest.lastName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {reservation.guest.firstName} {reservation.guest.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{reservation.guest.email}</p>
                      </div>
                    </div>
                    <div className="pt-2 space-y-1 text-sm text-gray-500">
                      <p>📞 {reservation.guest.phone}</p>
                      <p>🌐 {reservation.guest.country || (t.admin.reservations.unknown || 'Unknown')}</p>
                      <p>💬 {reservation.guest.language || (t.admin.reservations.notSpecified || 'Not specified')}</p>
                      <p>⭐ {reservation.vipStatus !== 'none' ? reservation.vipStatus : (t.admin.reservations.filters?.all || 'Standard')}</p>
                      {reservation.travelerProfile && <p>🎒 Traveler Profile: {reservation.travelerProfile}</p>}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t.admin.reservations.serviceDetails || 'Service Details'}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-gray-700">{t.admin.reservations.package || 'Package'}:</span> {reservation.service.name}</p>
                    <p><span className="font-medium text-gray-700">{t.admin.reservations.flight || 'Flight'}:</span> {reservation.flightInfo || (t.admin.reservations.notSpecified || 'Not specified')}</p>
                    <p><span className="font-medium text-gray-700">{t.admin.reservations.arrival || 'Arrival'}:</span> {formatDate(reservation.arrivalDate)} {reservation.arrivalTime}</p>
                    <p><span className="font-medium text-gray-700">{t.admin.reservations.status || 'Status'}:</span> <span className={getStatusBadgeClass(reservation.status)}>{getStatusText(reservation.status)}</span></p>
                    {/* Destination address */}
                    {reservation.destinationAddress && (
                      <p><span className="font-medium text-gray-700">Destination:</span> {reservation.destinationAddress}</p>
                    )}
                    {/* Return flight */}
                    {reservation.returnDate && (
                      <p><span className="font-medium text-gray-700">Return Flight:</span> {reservation.returnDate} {reservation.returnTime || ''}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.admin.reservations.paymentDetails || 'Payment Details'}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700">{t.admin.reservations.amount || 'Amount'}:</span> <span className="font-semibold">${reservation.totalAmount.toLocaleString()}</span></p>
                  <p><span className="font-medium text-gray-700">{t.admin.reservations.status || 'Status'}:</span> <span className={getPaymentBadgeClass(reservation.paymentStatus)}>{getPaymentText(reservation.paymentStatus)}</span></p>
                  <p><span className="font-medium text-gray-700">{t.admin.reservations.method || 'Method'}:</span> {reservation.paymentMethod || (t.admin.reservations.notSpecified || 'Not specified')}</p>
                  <p><span className="font-medium text-gray-700">{t.admin.reservations.transaction || 'Transaction'}:</span> <span className="font-mono text-xs">{reservation.transactionId || '—'}</span></p>
                </div>
              </div>
              
              {reservation.specialRequests && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t.admin.reservations.specialRequests || 'Special Requests'}</h3>
                  <p className="text-sm text-gray-500">{reservation.specialRequests}</p>
                </div>
              )}

              {/* Dispatch Status */}
              {reservation.dispatchStatus && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Dispatch Status</h3>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">Status:</span> <span className={getStatusBadgeClass(reservation.dispatchStatus)}>{reservation.dispatchStatus}</span></p>
                  </div>
                </div>
              )}

              {/* Driver Info */}
              {reservation.driverAssigned && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Driver</h3>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">Name:</span> {reservation.driverAssigned.name}</p>
                    <p><span className="font-medium text-gray-700">Phone:</span> {reservation.driverAssigned.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button onClick={onSendWhatsApp} className="btn btn-secondary px-4 py-2 text-sm">
                  {t.admin.reservations.sendWhatsApp || 'Send WhatsApp'}
                </button>
                <button onClick={onCancelReservation} className="btn btn-danger px-4 py-2 text-sm">
                  {t.admin.reservations.cancelReservation || 'Cancel Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs',
    confirmed: 'bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs',
    awaiting_payment: 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs',
    assigned: 'bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs',
    in_progress: 'bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs',
    completed: 'bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs',
    cancelled: 'bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function getPaymentBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs',
    paid: 'bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs',
    partial: 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs',
    refunded: 'bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', awaiting_payment: 'Awaiting Payment',
    assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled'
  }
  return map[status] || 'Unknown'
}

function getPaymentText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending', paid: 'Paid', partial: 'Partial', refunded: 'Refunded'
  }
  return map[status] || 'Unknown'
}

function getAvatarColor(letter: string): string {
  const hash = letter.charCodeAt(0)
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6', '#64748b', '#ef4450', '#f97316', '#84cc16', '#06b6d4']
  return colors[hash % colors.length]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}