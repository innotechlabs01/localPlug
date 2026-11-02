export interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country?: string
  language?: string
  notes?: string
}

export interface Service {
  id: string
  name: string
  description?: string
  includes?: string[]
  price?: number
  currency?: string
}

export interface DriverInfo {
  id: string
  name: string
  phone: string
}

export interface HotelInfo {
  id?: number
  name?: string
  address?: string
  roomId?: number
  roomName?: string
  roomType?: string
  pricePerNight?: number
  numNights?: number
  commissionRate?: number
  isHotelBooking?: boolean
  roomStatus?: string
}

export interface PaymentInfo {
  status: string
  method?: string
  transactionId?: string
  amount?: number
  currency?: string
}

export interface ConsentRecord {
  id: number
  bookingReference: string
  customerEmail: string
  termsAccepted: boolean
  privacyAccepted: boolean
  refundAccepted: boolean
  termsVersion?: string
  privacyVersion?: string
  refundVersion?: string
  acceptedAt?: string
  ipAddress?: string
  userAgent?: string
  createdAt?: string
}

export interface RoomBooking {
  id: number
  orderId: number
  roomId: number
  hotelId: number
  checkIn?: string
  checkOut?: string
  nights?: number
  pricePerNight?: number
  totalAmount?: number
  guestName?: string
  guestEmail?: string
  status?: string
}

export interface ReservationStatusHistory {
  id: number
  orderId: number
  oldStatus?: string
  newStatus: string
  changedBy?: number
  notes?: string
  createdAt: string
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
  clerkUserId?: string
  destinationAddress?: string
  returnDate?: string
  returnTime?: string
  travelerProfile?: string
  additionalTrips?: string[]
  numPeople?: number
  dispatchStatus?: string
  driverAssigned?: DriverInfo
  assignedAt?: string
  priority?: number
  internalNotes?: string
  // New extended fields
  hotel?: HotelInfo
  payment?: PaymentInfo
  consents?: ConsentRecord[]
  roomBookings?: RoomBooking[]
  statusHistory?: ReservationStatusHistory[]
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
