import { Reservation } from '@/lib/reservations-api'

interface ReservationDetailModalProps {
  open: boolean
  reservation: Reservation | null
  onClose: () => void
  onAssignDriver: (driverId: string) => void
  onSendWhatsApp: () => void
  onCancelReservation: () => void
}

export default function ReservationDetailModal({ 
  open, 
  reservation, 
  onClose, 
  onAssignDriver, 
  onSendWhatsApp, 
  onCancelReservation 
}: ReservationDetailModalProps) {
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <div className="relative bg-white rounded-lg shadow-xl">
            {/* Close button */}
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <svg 
                className="h-4 w-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Tourist Profile */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tourist Profile
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div 
                          className="flex items-center justify-center rounded-full"
                          style={{
                            backgroundColor: getAvatarColor(reservation.guest.firstName.charAt(0)),
                            color: 'white'
                          }}
                        >
                          {reservation.guest.firstName.charAt(0)}{reservation.guest.lastName.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {reservation.guest.firstName} {reservation.guest.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reservation.guest.email}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center">
                        <span className="mr-2">📞</span>
                        <span className="text-sm text-gray-500">{reservation.guest.phone}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">🌐</span>
                        <span className="text-sm text-gray-500">
                          {reservation.guest.country || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">💬</span>
                        <span className="text-sm text-gray-500">
                          {reservation.guest.language || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">⭐</span>
                        <span className="text-sm text-gray-500">
                          {reservation.vipStatus !== 'none' ? 
                            reservation.vipStatus.charAt(0).toUpperCase() + reservation.vipStatus.slice(1) : 
                            'Standard'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Service Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Service Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-20 inline-block text-sm font-medium text-gray-700">
                        Package:
                      </span>
                      <span className="text-sm text-gray-500">{reservation.service.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 inline-block text-sm font-medium text-gray-700">
                        Services:
                      </span>
                      <span className="text-sm text-gray-500">
                        {reservation.service.includes || 'Standard package'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 inline-block text-sm font-medium text-gray-700">
                        Flight:
                      </span>
                      <span className="text-sm text-gray-500">
                        {reservation.flightInfo || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 inline-block text-sm font-medium text-gray-700">
                        Pickup:
                      </span>
                      <span className="text-sm text-gray-500">
                        {reservation.selectedHotel || 'To be arranged'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 inline-block text-sm font-medium text-gray-700">
                        Destination:
                      </span>
                      <span className="text-sm text-gray-500">
                        {reservation.selectedHotel ? 'City Center Tour' : 'To be arranged'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-24 inline-block text-sm font-medium text-gray-700">
                      Amount:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${reservation.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 inline-block text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentClass(reservation.paymentStatus)} bg-${getPaymentClass(reservation.paymentStatus)}-light text-${getPaymentClass(reservation.paymentStatus)}-dark`}
                    >
                      {getPaymentText(reservation.paymentStatus)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 inline-block text-sm font-medium text-gray-700">
                      Method:
                    </span>
                    <span className="text-sm text-gray-500">
                      {reservation.paymentMethod || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 inline-block text-sm font-medium text-gray-700">
                      Transaction ID:
                    </span>
                    <span className="text-sm text-gray-500 font-mono">
                      {reservation.transactionId || '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Notes & Support */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Notes & Support
                </h3>
                <div className="space-y-3">
                  {reservation.specialRequests ? (
                    <>
                      <div className="flex items-start">
                        <span className="w-24 inline-block text-sm font-medium text-gray-700">
                          Special Requests:
                        </span>
                        <span className="text-sm text-gray-500">
                          {reservation.specialRequests}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 mt-3"></div>
                    </>
                  ) : null}
                  <div className="text-sm text-gray-500">
                    <strong>Today {getCurrentTime()} — Admin:</strong>{' '}
                    Confirmed pickup at {reservation.selectedHotel || 'Hotel'}.{'\n'}
                    <strong>Yesterday 16:10 — Support:</strong>{' '}
                    Added photography package per guest request.{'\n'}
                    <strong>Yesterday 09:45 — System:</strong>{' '}
                    Payment confirmed via {reservation.paymentMethod?.split(' ')[0] || 'card'}.
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={onAssignDriver}
                  disabled={!reservation} // Enable only if reservation exists
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Assign Driver
                </button>
                <button 
                  onClick={onSendWhatsApp}
                  className="btn btn-secondary px-4 py-2 text-sm"
                >
                  Send WhatsApp
                </button>
                <button 
                  onClick={onCancelReservation}
                  className="btn btn-danger px-4 py-2 text-sm"
                >
                  Cancel Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Helper functions
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'border-warning',
    confirmed: 'border-success',
    awaiting_payment: 'border-info',
    assigned: 'border-primary',
    in_progress: 'border-secondary',
    completed: 'border-neutral',
    cancelled: 'border-error'
  }
  return statusMap[status] || 'border-warning'
}

function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    awaiting_payment: 'awaiting',
    assigned: 'assigned',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled'
  }
  return statusMap[status] || 'pending'
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    awaiting_payment: 'Awaiting Payment',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || 'Unknown'
}

function getPaymentClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'border-warning',
    paid: 'border-success',
    partial: 'border-info',
    refunded: 'border-error'
  }
  return statusMap[status] || 'border-warning'
}

function getPaymentText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    partial: 'Partial',
    refunded: 'Refunded'
  }
  return statusMap[status] || 'Unknown'
}

function getAvatarColor(letter: string): string {
  // Generate a consistent color based on the first letter
  const hash = letter.charCodeAt(0)
  const colors = [
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#14b8a6', // teal-500
    '#64748b', // slate-500
    '#ef4450', // red-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
    '#06b6d4'  // cyan-500
  ]
  return colors[hash % colors.length]
}

function getCurrentTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace(':00', '') // Remove seconds if they're 00
}