export interface FlightData {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  needReturn: boolean
  returnDate: string
  returnTime: string
}

export interface DestinationData {
  hasPlace: boolean
  address: string
  wantsGuatape: boolean
  additionalTrips?: string[]
  selectedHotelId?: number
  selectedRoomId?: number
}

export interface Booking {
  id: string
  flight: FlightData
  profile: string
  destination: DestinationData
  package: string
  status: 'draft' | 'submitted' | 'confirmed' | 'failed'
  createdAt: string
  submittedAt?: string
}

export interface PersistenceQueueEntry {
  id: string
  booking: Booking
  timestamp: string
  retryCount: number
  lastError?: string
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface PaymentRecord {
  bookingReference: string
  packageId: string
  packageName: string
  amount: number
  currency: string
  status: PaymentStatus
  paddleTransactionId: string
  paddleWebhookEventId?: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentIntentRequest {
  bookingReference: string
  packageId: string
  customerEmail: string
  customerName: string
}

export interface CreateCheckoutResponse {
  transactionId: string
  amount: number
}

export interface PaymentStatusResponse {
  bookingReference: string
  packageId: string
  packageName: string
  amount: number
  currency: string
  status: PaymentStatus
  paddleTransactionId: string
  customerEmail: string
  customerName: string
  createdAt: string
  updatedAt: string
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastNotification {
  id: string
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
  createdAt: number
  duration?: number
}
