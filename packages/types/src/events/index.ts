// Event types for domain-driven communication (message bus, webhooks, n8n).
// Part of @lp/types (B7). Pure TS, no external deps.

import type { UUID, Money, Coordinates, DateRange } from '../shared'
import type { BookingStatus, BookingType, ExperienceType, VehicleType, DriverStatus, PaymentStatus, PaymentProvider, NotificationType } from '../domain'

// ─── Base event ───
export interface DomainEvent<T extends string, P> {
  readonly type: T
  readonly payload: P
  readonly timestamp: string // ISO datetime
  readonly correlationId?: UUID
  readonly causationId?: UUID
  readonly version: number
}

export function createEvent<T extends string, P>(type: T, payload: P, options?: {
  correlationId?: UUID
  causationId?: UUID
  version?: number
}): DomainEvent<T, P> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    correlationId: options?.correlationId,
    causationId: options?.causationId,
    version: options?.version ?? 1,
  }
}

// ─── Booking events ───
export interface BookingCreatedPayload {
  readonly bookingId: UUID
  readonly bookingNumber: string
  readonly status: BookingStatus
  readonly type: BookingType
  readonly experienceType?: ExperienceType
  readonly arrivalDate: string
  readonly arrivalTime: string
  readonly passengerCount: number
  readonly price: Money
  readonly contactEmail: string
  readonly contactPhone: string
  readonly contactName: string
}

export interface BookingUpdatedPayload {
  readonly bookingId: UUID
  readonly changes: Record<string, { readonly from: unknown; readonly to: unknown }>
  readonly previousStatus?: BookingStatus
  readonly newStatus?: BookingStatus
}

export interface BookingCancelledPayload {
  readonly bookingId: UUID
  readonly reason: string
  readonly cancelledBy: 'customer' | 'driver' | 'dispatch' | 'system'
  readonly refundAmount?: Money
}

export interface BookingAssignedPayload {
  readonly bookingId: UUID
  readonly driverId: UUID
  readonly vehicleId: UUID
  readonly assignedAt: string
}

export interface BookingStatusChangedPayload {
  readonly bookingId: UUID
  readonly fromStatus: BookingStatus
  readonly toStatus: BookingStatus
  readonly changedAt: string
}

// ─── Driver events ───
export interface DriverCreatedPayload {
  readonly driverId: UUID
  readonly clerkId: string
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly licenseType: string
  readonly status: DriverStatus
}

export interface DriverStatusChangedPayload {
  readonly driverId: UUID
  readonly fromStatus: DriverStatus
  readonly toStatus: DriverStatus
  readonly changedBy: UUID
}

export interface DriverLocationUpdatedPayload {
  readonly driverId: UUID
  readonly coordinates: Coordinates
  readonly heading?: number
  readonly speed?: number
  readonly isOnline: boolean
  readonly timestamp: string
}

export interface DriverAvailabilityChangedPayload {
  readonly driverId: UUID
  readonly isAvailable: boolean
  readonly nextAvailableAt?: string
}

// ─── Trip events ───
export interface TripStartedPayload {
  readonly tripId: UUID
  readonly bookingId: UUID
  readonly driverId: UUID
  readonly vehicleId: UUID
  readonly pickupCoordinates: Coordinates
  readonly startedAt: string
}

export interface TripCompletedPayload {
  readonly tripId: UUID
  readonly bookingId: UUID
  readonly driverId: UUID
  readonly vehicleId: UUID
  readonly dropoffCoordinates: Coordinates
  readonly distanceKm: number
  readonly durationMinutes: number
  readonly completedAt: string
}

export interface TripCancelledPayload {
  readonly tripId: UUID
  readonly bookingId: UUID
  readonly reason: string
  readonly cancelledBy: 'customer' | 'driver' | 'dispatch'
}

// ─── Payment events ───
export interface PaymentCreatedPayload {
  readonly paymentId: UUID
  readonly bookingId: UUID
  readonly amount: Money
  readonly provider: 'paddle' | 'stripe' | 'cash' | 'transfer'
  readonly type: string
  readonly status: PaymentStatus
  readonly customerEmail: string
}

export interface PaymentCompletedPayload {
  readonly paymentId: UUID
  readonly bookingId: UUID
  readonly amount: Money
  readonly providerPaymentId: string
  readonly completedAt: string
}

export interface PaymentFailedPayload {
  readonly paymentId: UUID
  readonly bookingId: UUID
  readonly errorCode: string
  readonly errorMessage: string
  readonly failedAt: string
}

export interface PaymentRefundedPayload {
  readonly paymentId: UUID
  readonly bookingId: UUID
  readonly amount: Money
  readonly reason: string
  readonly refundedAt: string
}

// ─── Assignment events ───
export interface AssignmentCreatedPayload {
  readonly assignmentId: UUID
  readonly bookingId: UUID
  readonly driverId?: UUID
  readonly vehicleId?: UUID
  readonly type: 'auto' | 'manual' | 'broadcast'
  readonly expiresAt?: string
}

export interface AssignmentAcceptedPayload {
  readonly assignmentId: UUID
  readonly driverId: UUID
  readonly acceptedAt: string
}

export interface AssignmentRejectedPayload {
  readonly assignmentId: UUID
  readonly driverId: UUID
  readonly reason: string
  readonly rejectedAt: string
}

export interface AssignmentExpiredPayload {
  readonly assignmentId: UUID
  readonly expiredAt: string
}

// ─── Vehicle events ───
export interface VehicleCreatedPayload {
  readonly vehicleId: UUID
  readonly plate: string
  readonly type: string
  readonly capacity: number
  readonly status: string
}

export interface VehicleStatusChangedPayload {
  readonly vehicleId: UUID
  readonly fromStatus: string
  readonly toStatus: string
  readonly reason?: string
}

// ─── Experience events ───
export interface ExperienceBookedPayload {
  readonly bookingId: UUID
  readonly experienceId: string
  readonly date: string
  readonly time: string
  readonly participants: number
  readonly price: Money
}

// ─── Notification events ───
export interface NotificationSentPayload {
  readonly notificationId: UUID
  readonly userId?: UUID
  readonly channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'in_app'
  readonly type: string
  readonly status: 'sent' | 'failed' | 'delivered' | 'read'
  readonly sentAt: string
}

// ─── Customer events ───
export interface CustomerCreatedPayload {
  readonly customerId: UUID
  readonly clerkId: string
  readonly email: string
  readonly source: string
}

export interface CustomerUpdatedPayload {
  readonly customerId: UUID
  readonly changes: Record<string, { readonly from: unknown; readonly to: unknown }>
}

// ─── System events ───
export interface SystemAlertPayload {
  readonly level: 'info' | 'warning' | 'error' | 'critical'
  readonly message: string
  readonly context?: Record<string, unknown>
  readonly source: string
}

// ─── Type unions for convenience ───
export type BookingEvent =
  | { type: 'booking.created'; payload: BookingCreatedPayload }
  | { type: 'booking.updated'; payload: BookingUpdatedPayload }
  | { type: 'booking.cancelled'; payload: BookingCancelledPayload }
  | { type: 'booking.assigned'; payload: BookingAssignedPayload }
  | { type: 'booking.status_changed'; payload: BookingStatusChangedPayload }

export type DriverEvent =
  | { type: 'driver.created'; payload: DriverCreatedPayload }
  | { type: 'driver.status_changed'; payload: DriverStatusChangedPayload }
  | { type: 'driver.location_updated'; payload: DriverLocationUpdatedPayload }
  | { type: 'driver.availability_changed'; payload: DriverAvailabilityChangedPayload }

export type TripEvent =
  | { type: 'trip.started'; payload: TripStartedPayload }
  | { type: 'trip.completed'; payload: TripCompletedPayload }
  | { type: 'trip.cancelled'; payload: TripCancelledPayload }

export type PaymentEvent =
  | { type: 'payment.created'; payload: PaymentCreatedPayload }
  | { type: 'payment.completed'; payload: PaymentCompletedPayload }
  | { type: 'payment.failed'; payload: PaymentFailedPayload }
  | { type: 'payment.refunded'; payload: PaymentRefundedPayload }

export type AssignmentEvent =
  | { type: 'assignment.created'; payload: AssignmentCreatedPayload }
  | { type: 'assignment.accepted'; payload: AssignmentAcceptedPayload }
  | { type: 'assignment.rejected'; payload: AssignmentRejectedPayload }
  | { type: 'assignment.expired'; payload: AssignmentExpiredPayload }

export type VehicleEvent =
  | { type: 'vehicle.created'; payload: VehicleCreatedPayload }
  | { type: 'vehicle.status_changed'; payload: VehicleStatusChangedPayload }

export type ExperienceEvent =
  | { type: 'experience.booked'; payload: ExperienceBookedPayload }

export type NotificationEvent =
  | { type: 'notification.sent'; payload: NotificationSentPayload }

export type CustomerEvent =
  | { type: 'customer.created'; payload: CustomerCreatedPayload }
  | { type: 'customer.updated'; payload: CustomerUpdatedPayload }

export type SystemEvent =
  | { type: 'system.alert'; payload: SystemAlertPayload }

export type AnyDomainEvent =
  | BookingEvent
  | DriverEvent
  | TripEvent
  | PaymentEvent
  | AssignmentEvent
  | VehicleEvent
  | ExperienceEvent
  | NotificationEvent
  | CustomerEvent
  | SystemEvent

// ─── Event type guards ───
export function isBookingEvent(event: AnyDomainEvent): event is BookingEvent {
  return event.type.startsWith('booking.')
}

export function isDriverEvent(event: AnyDomainEvent): event is DriverEvent {
  return event.type.startsWith('driver.')
}

export function isTripEvent(event: AnyDomainEvent): event is TripEvent {
  return event.type.startsWith('trip.')
}

export function isPaymentEvent(event: AnyDomainEvent): event is PaymentEvent {
  return event.type.startsWith('payment.')
}

export function isAssignmentEvent(event: AnyDomainEvent): event is AssignmentEvent {
  return event.type.startsWith('assignment.')
}

export function isVehicleEvent(event: AnyDomainEvent): event is VehicleEvent {
  return event.type.startsWith('vehicle.')
}

export function isExperienceEvent(event: AnyDomainEvent): event is ExperienceEvent {
  return event.type.startsWith('experience.')
}

export function isNotificationEvent(event: AnyDomainEvent): event is NotificationEvent {
  return event.type.startsWith('notification.')
}

export function isCustomerEvent(event: AnyDomainEvent): event is CustomerEvent {
  return event.type.startsWith('customer.')
}

export function isSystemEvent(event: AnyDomainEvent): event is SystemEvent {
  return event.type.startsWith('system.')
}