// API contract types — request/response DTOs for HTTP boundaries.
// Part of @lp/types (B7). Pure TS, no external deps.

import type { UUID, Money, PaginationParams, PaginatedResponse, Coordinates } from '../shared'
import type { BookingStatus, BookingType, ExperienceType, VehicleType, DriverStatus, PaymentStatus } from '../domain'

// ─── Common ───
export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: ApiError
}

export function apiOk<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function apiErr(code: string, message: string, details?: Record<string, unknown>): ApiResponse<never> {
  return { success: false, error: { code, message, details } }
}

// ─── Pagination ───
export interface ListQuery extends PaginationParams {
  readonly search?: string
  readonly status?: string
  readonly sortBy?: string
  readonly sortOrder?: 'asc' | 'desc'
}

export interface ListResponse<T> extends PaginatedResponse<T> {}

// ─── Auth ───
export interface SignInRequest {
  readonly email: string
  readonly password: string
  readonly redirectUrl?: string
}

export interface SignUpRequest {
  readonly email: string
  readonly password: string
  readonly firstName: string
  readonly lastName: string
  readonly phone?: string
  readonly redirectUrl?: string
}

export interface AuthResponse {
  readonly user: UserPublic
  readonly sessionToken: string
}

export interface UserPublic {
  readonly id: UUID
  readonly email: string
  readonly firstName: string | null
  readonly lastName: string | null
  readonly role: string
}

// ─── Booking API ───
export interface CreateBookingRequest {
  readonly type: BookingType
  readonly experienceType?: ExperienceType
  readonly vehicleType?: VehicleType
  readonly passengerCount: number
  readonly luggageCount: number
  readonly arrivalDate: string // YYYY-MM-DD
  readonly arrivalTime: string // HH:mm
  readonly flight: {
    readonly airline: string
    readonly flightNumber: string
    readonly arrivalTime: string
    readonly origin: string
    readonly terminal?: string
  }
  readonly passengers: readonly {
    readonly firstName: string
    readonly lastName: string
    readonly email?: string
    readonly phone?: string
    readonly isPrimary: boolean
  }[]
  readonly needReturn: boolean
  readonly returnDate?: string
  readonly returnTime?: string
  readonly hotelId?: number
  readonly specialRequests?: string
  readonly promoCode?: string
  readonly contactEmail: string
  readonly contactPhone: string
  readonly contactName: string
}

export interface CreateBookingResponse {
  readonly bookingId: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly price: Money
}

export interface UpdateBookingRequest {
  readonly arrivalDate?: string
  readonly arrivalTime?: string
  readonly flight?: CreateBookingRequest['flight']
  readonly passengers?: CreateBookingRequest['passengers']
  readonly needReturn?: boolean
  readonly returnDate?: string
  readonly returnTime?: string
  readonly hotelId?: number
  readonly specialRequests?: string
}

export interface BookingListQuery extends PaginationParams {
  readonly status?: BookingStatus
  readonly type?: BookingType
  readonly driverId?: UUID
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly passengerEmail?: string
  readonly passengerPhone?: string
  readonly hotelId?: number
}

export interface BookingDetailResponse {
  readonly id: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly type: BookingType
  readonly experienceType?: ExperienceType
  readonly vehicleType?: VehicleType
  readonly passengerCount: number
  readonly luggageCount: number
  readonly arrivalDate: string
  readonly arrivalTime: string
  readonly flightNumber?: string
  readonly origin: { readonly address: string; readonly coordinates?: Coordinates }
  readonly destination: { readonly address: string; readonly coordinates?: Coordinates }
  readonly returnTrip: boolean
  readonly returnDate?: string
  readonly returnTime?: string
  readonly specialRequests?: string
  readonly promoCode?: string
  readonly price: Money
  readonly contactEmail: string
  readonly contactPhone: string
  readonly contactName: string
  readonly driverId?: UUID
  readonly vehicleId?: UUID
  readonly assignedAt?: string
  readonly actualPickupAt?: string
  readonly actualDropoffAt?: string
  readonly cancelledAt?: string
  readonly cancellationReason?: string
  readonly cancelledBy?: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface BookingListItemResponse {
  readonly id: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly type: BookingType
  readonly arrivalDate: string
  readonly arrivalTime: string
  readonly origin: { readonly address: string }
  readonly destination: { readonly address: string }
  readonly passengerCount: number
  readonly totalAmount: Money
  readonly currency: 'USD' | 'COP' | 'EUR'
  readonly contactName: string
  readonly contactPhone: string
  readonly driverId?: UUID
  readonly createdAt: string
}

// ─── Driver API ───
export interface CreateDriverRequest {
  readonly clerkId: string
  readonly firstName: string
  readonly lastName: string
  readonly email: string
  readonly phone: string
  readonly licenseNumber: string
  readonly licenseType: string
  readonly licenseExpiry: string
  readonly vehicleId?: number
}

export interface UpdateDriverRequest {
  readonly firstName?: string
  readonly lastName?: string
  readonly phone?: string
  readonly licenseNumber?: string
  readonly licenseType?: string
  readonly licenseExpiry?: string
  readonly vehicleId?: number
  readonly status?: string
  readonly preferredZones?: readonly string[]
  readonly rating?: number
  readonly totalTrips?: number
}

export interface DriverQuery extends PaginationParams {
  readonly status?: string
  readonly vehicleId?: number
  readonly zone?: string
  readonly licenseType?: string
}

export interface DriverResponse {
  readonly id: UUID
  readonly clerkId: string
  readonly firstName: string
  readonly lastName: string
  readonly email: string
  readonly phone: string
  readonly licenseNumber: string
  readonly licenseType: string
  readonly licenseExpiry: string
  readonly status: string
  readonly vehicleId?: number
  readonly rating: number
  readonly totalTrips: number
  readonly preferredZones: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
}

// ─── Vehicle API ───
export interface CreateVehicleRequest {
  readonly plate: string
  readonly brand: string
  readonly model: string
  readonly year: number
  readonly color: string
  readonly type: VehicleType
  readonly fuelType: string
  readonly capacity: number
  readonly vin?: string
  readonly registrationExpiry: string
  readonly insuranceExpiry: string
  readonly soatExpiry: string
  readonly techReviewExpiry?: string
  readonly gpsDeviceId?: string
  readonly assignedDriverId?: UUID
}

export interface UpdateVehicleRequest {
  readonly brand?: string
  readonly model?: string
  readonly year?: number
  readonly color?: string
  readonly type?: VehicleType
  readonly fuelType?: string
  readonly capacity?: number
  readonly vin?: string
  readonly registrationExpiry?: string
  readonly insuranceExpiry?: string
  readonly soatExpiry?: string
  readonly techReviewExpiry?: string
  readonly gpsDeviceId?: string
  readonly assignedDriverId?: UUID | null
  readonly status?: string
}

export interface VehicleQuery extends PaginationParams {
  readonly status?: string
  readonly type?: VehicleType
  readonly fuelType?: string
  readonly driverId?: UUID
  readonly plate?: string
}

export interface VehicleResponse {
  readonly id: UUID
  readonly plate: string
  readonly brand: string
  readonly model: string
  readonly year: number
  readonly color: string
  readonly type: VehicleType
  readonly fuelType: string
  readonly capacity: number
  readonly vin?: string
  readonly registrationExpiry: string
  readonly insuranceExpiry: string
  readonly soatExpiry: string
  readonly techReviewExpiry?: string
  readonly gpsDeviceId?: string
  readonly assignedDriverId?: UUID
  readonly status: string
  readonly createdAt: string
  readonly updatedAt: string
}

// ─── Payment API ───
export interface CreatePaymentRequest {
  readonly bookingId: UUID
  readonly amount: Money
  readonly provider: 'paddle' | 'stripe' | 'cash' | 'transfer'
  readonly type: 'booking' | 'experience' | 'subscription' | 'penalty' | 'adjustment'
  readonly description: string
  readonly customerEmail: string
  readonly customerName: string
}

export interface PaymentResponse {
  readonly id: UUID
  readonly bookingId: UUID
  readonly amount: Money
  readonly provider: string
  readonly type: string
  readonly status: PaymentStatus
  readonly providerPaymentId?: string
  readonly description: string
  readonly customerEmail: string
  readonly customerName: string
  readonly createdAt: string
  readonly updatedAt: string
}

// ─── Experience API ───
export interface ExperienceBookingRequest {
  readonly experienceId: ExperienceType
  readonly date: string
  readonly time: string
  readonly participants: number
  readonly hotelId?: number
  readonly specialRequests?: string
}

export interface ExperienceBookingResponse {
  readonly bookingId: UUID
  readonly experienceId: ExperienceType
  readonly date: string
  readonly time: string
  readonly participants: number
  readonly price: Money
}