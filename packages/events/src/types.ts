// @lp/events — Domain Event Runtime Types
// Part of B10. Runtime event envelope that extends the types from @lp/types.
//
// The existing DomainEvent<T, P> in @lp/types is the schema definition.
// This file defines the RUNTIME event envelope with persistence fields
// (id, aggregateId, aggregateType, producer) that are needed for the
// outbox pattern and event bus routing.

import { randomUUID } from 'crypto'

// ──────────────────────────────────────────────
// Event Type Registry (canonical event names)
// ──────────────────────────────────────────────

export const EventType = {
  // Business Events
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_STATUS_CHANGED: 'booking.status.changed',
  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_ACCEPTED: 'assignment.accepted',
  ASSIGNMENT_REJECTED: 'assignment.rejected',
  ASSIGNMENT_DECLINED: 'assignment.declined',
  TRIP_STARTED: 'trip.started',
  TRIP_PICKED_UP: 'trip.picked_up',
  TRIP_COMPLETED: 'trip.completed',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  DRIVER_APPROVED: 'driver.approved',
  DRIVER_SUSPENDED: 'driver.suspended',
  VEHICLE_REGISTERED: 'vehicle.registered',
  EXPERIENCE_BOOKED: 'experience.booked',
  RATING_SUBMITTED: 'rating.submitted',
  HOTEL_RESERVATION_ACCEPTED: 'hotel.reservation.accepted',
  HOTEL_RESERVATION_DECLINED: 'hotel.reservation.declined',
  HOTEL_CHECKED_IN: 'hotel.reservation.checked_in',
  HOTEL_CHECKED_OUT: 'hotel.reservation.checked_out',

  // Integration Events
  WHATSAPP_MESSAGE_RECEIVED: 'whatsapp.message.received',
  WHATSAPP_MESSAGE_SENT: 'whatsapp.message.sent',
  WHATSAPP_MESSAGE_FAILED: 'whatsapp.message.failed',
  EMAIL_DELIVERED: 'email.delivered',
  EMAIL_BOUNCED: 'email.bounced',
  WEBHOOK_RECEIVED: 'webhook.received',
  N8N_WORKFLOW_COMPLETED: 'n8n.workflow.completed',
  EVOLUTION_INSTANCE_CONNECTED: 'evolution.instance.connected',
  EVOLUTION_INSTANCE_DISCONNECTED: 'evolution.instance.disconnected',
  PADDLE_PAYMENT_WEBHOOK: 'paddle.payment.webhook',

  // System Events
  CACHE_INVALIDATED: 'cache.invalidated',
  FEATURE_FLAG_CHANGED: 'feature.flag.changed',
  USER_LOGGED_IN: 'user.logged.in',
  USER_LOGGED_OUT: 'user.logged.out',
  MIGRATION_COMPLETED: 'migration.completed',
  HEALTH_CHECK_FAILED: 'health.check.failed',
  CIRCUIT_BREAKER_OPENED: 'circuit.breaker.opened',
  QUEUE_PROCESSING_STARTED: 'queue.processing.started',
  QUEUE_PROCESSING_COMPLETED: 'queue.processing.completed',
} as const

export type EventType = (typeof EventType)[keyof typeof EventType]

// ──────────────────────────────────────────────
// Runtime Event Envelope (what flows through the bus)
// ──────────────────────────────────────────────

export interface DomainEvent<T = unknown> {
  /** Unique event identifier (UUID v4) */
  readonly id: string
  /** Event type (e.g., 'booking.created') */
  readonly type: EventType
  /** Schema version (starts at 1) */
  readonly version: number
  /** ID of the entity this event is about */
  readonly aggregateId: string
  /** Entity type (e.g., 'booking', 'driver') */
  readonly aggregateType: string
  /** When the event happened (producer time) */
  readonly occurredAt: Date
  /** Groups events from the same user request */
  readonly correlationId: string
  /** ID of the event that caused this one */
  readonly causationId?: string
  /** Which domain produced this */
  readonly producer: string
  /** Event-specific data */
  readonly payload: T
}

// ──────────────────────────────────────────────
// Event Factory
// ──────────────────────────────────────────────

export interface CreateEventOptions {
  correlationId?: string
  causationId?: string
  version?: number
}

/**
 * Create a typed domain event with all required fields.
 *
 * @example
 * const event = createEvent(
 *   EventType.BOOKING_CREATED,
 *   'booking',
 *   '123',
 *   'booking',
 *   { bookingId: 123, reference: 'BK-001' },
 *   correlationId
 * )
 */
export function createEvent<T>(
  type: EventType,
  aggregateType: string,
  aggregateId: string,
  producer: string,
  payload: T,
  options?: CreateEventOptions
): DomainEvent<T> {
  return {
    id: randomUUID(),
    type,
    version: options?.version ?? 1,
    aggregateId,
    aggregateType,
    occurredAt: new Date(),
    correlationId: options?.correlationId ?? randomUUID(),
    causationId: options?.causationId,
    producer,
    payload,
  }
}
