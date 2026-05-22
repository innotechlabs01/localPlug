export interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country?: string
  language?: string
}

export interface Service {
  id: string
  name: string
  description?: string
  includes?: string[]
}

export interface DriverInfo {
  id: string
  name: string
  phone: string
}

export interface Reservation {
  id: string
  guest: Guest
  service: Service
  arrivalDate: string // YYYY-MM-DD format
  arrivalTime?: string // HH:MM format
  flightInfo?: string
  status: ReservationStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  paymentMethod?: string
  transactionId?: string
  specialRequests?: string
  vipStatus: VIPStatus
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
  // Extended fields
  bookingReference?: string
  orderNumber?: string
  destinationAddress?: string
  returnDate?: string
  returnTime?: string
  travelerProfile?: string
  additionalTrips?: string[]
  dispatchStatus?: string
  driverAssigned?: DriverInfo
  assignedAt?: string
  priority?: number
  internalNotes?: string
}

export type ReservationStatus = 
  | 'pending'
  | 'confirmed'
  | 'awaiting_payment'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'partial'
  | 'refunded'

export type VIPStatus = 
  | 'none'
  | 'silver'
  | 'gold'
  | 'platinum'