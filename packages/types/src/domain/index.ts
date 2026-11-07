// Domain entity types — core business objects.
// Part of @lp/types (B7). Pure TS, no external deps.

import type {
  UUID,
  Money,
  Coordinates,
  DateRange,
  Timezone,
  Locale,
  BookingStatus,
  BookingType,
  ExperienceType,
  VehicleType,
  FuelType,
  VehicleStatus,
  DriverStatus,
  LicenseType,
  PaymentStatus,
  PaymentProvider,
  PaymentType,
  CustomerStatus,
  CustomerSource,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  AssignmentStatus,
  AssignmentType,
} from '../shared'

// Re-export shared enums for convenience
export type {
  UUID,
  Money,
  Coordinates,
  DateRange,
  Timezone,
  Locale,
  BookingStatus,
  BookingType,
  ExperienceType,
  VehicleType,
  FuelType,
  VehicleStatus,
  DriverStatus,
  LicenseType,
  PaymentStatus,
  PaymentProvider,
  PaymentType,
  CustomerStatus,
  CustomerSource,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
}

// ─── Address / Location ───
export interface Address {
  readonly street: string
  readonly city: string
  readonly state?: string
  readonly country: string
  readonly postalCode?: string
  readonly coordinates?: Coordinates
}

export interface Location {
  readonly address: Address
  readonly instructions?: string
}

// ─── Core entities ───
export interface Booking {
  readonly id: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly type: BookingType
  readonly experienceType: ExperienceType | null
  readonly vehicleType: VehicleType | null
  readonly passengerCount: number
  readonly luggageCount: number
  readonly arrivalDate: string // ISO date
  readonly arrivalTime: string // HH:mm
  readonly flightNumber: string | null
  readonly origin: Location
  readonly destination: Location
  readonly returnTrip: boolean
  readonly returnDate: string | null
  readonly returnTime: string | null
  readonly specialRequests: string | null
  readonly promoCode: string | null
  readonly price: PriceBreakdown
  readonly contactEmail: string
  readonly contactPhone: string
  readonly contactName: string
  readonly driverId: UUID | null
  readonly vehicleId: UUID | null
  readonly assignedAt: string | null
  readonly actualPickupAt: string | null
  readonly actualDropoffAt: string | null
  readonly cancelledAt: string | null
  readonly cancellationReason: string | null
  readonly cancelledBy: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly metadata: Record<string, unknown>
}

export interface PriceBreakdown {
  readonly basePrice: Money
  readonly returnTripCharge: Money | null
  readonly serviceFee: Money
  readonly tax: Money
  readonly discount: Money | null
  readonly total: Money
  readonly currency: 'USD' | 'COP' | 'EUR'
}

export interface BookingListItem {
  readonly id: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly type: BookingType
  readonly arrivalDate: string
  readonly arrivalTime: string
  readonly origin: Location
  readonly destination: Location
  readonly passengerCount: number
  readonly totalAmount: Money
  readonly currency: 'USD' | 'COP' | 'EUR'
  readonly contactName: string
  readonly contactPhone: string
  readonly driverId: UUID | null
  readonly createdAt: string
}

export interface BookingSearchParams {
  readonly status?: BookingStatus
  readonly type?: BookingType
  readonly driverId?: UUID
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly passengerEmail?: string
  readonly passengerPhone?: string
  readonly hotelId?: number
  readonly limit?: number
  readonly offset?: number
  readonly sortBy?: 'createdAt' | 'arrivalDate' | 'status' | 'totalAmount'
  readonly sortOrder?: 'asc' | 'desc'
}

// ─── Driver ───
export interface Driver {
  readonly id: UUID
  readonly clerkId: string
  readonly firstName: string
  readonly lastName: string
  readonly email: string
  readonly phone: string
  readonly licenseNumber: string
  readonly licenseType: LicenseType
  readonly licenseExpiry: string // ISO date
  readonly status: DriverStatus
  readonly vehicleId: UUID | null
  readonly rating: number // 0-5
  readonly totalTrips: number
  readonly preferredZones: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
}

export interface DriverAvailability {
  readonly driverId: UUID
  readonly isAvailable: boolean
  readonly currentLocation: Coordinates | null
  readonly nextAvailableAt: string | null
}

// ─── Vehicle ───
export interface Vehicle {
  readonly id: UUID
  readonly plate: string
  readonly brand: string
  readonly model: string
  readonly year: number
  readonly color: string
  readonly type: VehicleType
  readonly fuelType: FuelType
  readonly capacity: number
  readonly vin: string | null
  readonly registrationExpiry: string
  readonly insuranceExpiry: string
  readonly soatExpiry: string
  readonly techReviewExpiry: string | null
  readonly gpsDeviceId: string | null
  readonly assignedDriverId: UUID | null
  readonly status: VehicleStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface VehicleLocation {
  readonly vehicleId: UUID
  readonly coordinates: Coordinates
  readonly heading: number | null // 0-360
  readonly speed: number | null // km/h
  readonly updatedAt: string
}

// ─── Trip ───
export interface Trip {
  readonly id: UUID
  readonly bookingId: UUID
  readonly driverId: UUID
  readonly vehicleId: UUID
  readonly status: TripStatus
  readonly pickupLocation: Location
  readonly dropoffLocation: Location | null
  readonly scheduledPickupAt: string
  readonly actualPickupAt: string | null
  readonly actualDropoffAt: string | null
  readonly distanceKm: number | null
  readonly durationMinutes: number | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type TripStatus = 'pending' | 'en_route' | 'arrived' | 'completed' | 'cancelled'

// ─── Assignment ───
export interface Assignment {
  readonly id: UUID
  readonly bookingId: UUID
  readonly driverId: UUID | null
  readonly vehicleId: UUID | null
  readonly type: AssignmentType
  readonly status: AssignmentStatus
  readonly scheduledAt: string
  readonly acceptedAt: string | null
  readonly rejectedAt: string | null
  readonly rejectionReason: string | null
  readonly expiresAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

// ─── Payment ───
export interface Payment {
  readonly id: UUID
  readonly bookingId: UUID
  readonly amount: Money
  readonly provider: 'paddle' | 'stripe' | 'cash' | 'transfer'
  readonly type: 'booking' | 'experience' | 'subscription' | 'penalty' | 'adjustment'
  readonly status: PaymentStatus
  readonly providerPaymentId: string | null
  readonly description: string
  readonly customerEmail: string
  readonly customerName: string
  readonly metadata: Record<string, unknown>
  readonly createdAt: string
  readonly updatedAt: string
}

// ─── Customer ───
export interface Customer {
  readonly id: UUID
  readonly clerkId: string
  readonly email: string
  readonly phone: string | null
  readonly firstName: string
  readonly lastName: string
  readonly preferredLanguage: 'en' | 'es'
  readonly timezone: string | null
  readonly status: CustomerStatus
  readonly source: CustomerSource
  readonly referralCode: string | null
  readonly preferences: CustomerPreferences
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CustomerPreferences {
  readonly notifications: {
    readonly email: boolean
    readonly sms: boolean
    readonly push: boolean
    readonly whatsapp: boolean
  }
  readonly preferredVehicleType: VehicleType | null
  readonly specialRequirements: string | null
  readonly accessibilityNeeds: string | null
}

export interface AddressBookEntry {
  readonly id: UUID
  readonly label: string
  readonly address: Address
  readonly isDefault: boolean
}

// ─── Experience ───
export interface Experience {
  readonly id: ExperienceType
  readonly name: string
  readonly description: string
  readonly durationMinutes: number
  readonly price: Money
  readonly maxParticipants: number
  readonly includes: readonly string[]
  readonly excludes: readonly string[]
  readonly requirements?: string
  readonly images: readonly string[]
  readonly isActive: boolean
}

// ─── Promotion ───
export interface Promotion {
  readonly code: string
  readonly name: string
  readonly description: string
  readonly discountType: 'percentage' | 'fixed'
  readonly discountValue: number // percentage (0-100) or amount in minor units
  readonly maxUses: number | null
  readonly usageCount: number
  readonly validFrom: string
  readonly validTo: string
  readonly applicablePackages: readonly BookingType[]
  readonly isActive: boolean
}