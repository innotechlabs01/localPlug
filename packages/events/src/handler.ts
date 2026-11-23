// @lp/events — Event Handler Contract
// Part of B10. Defines the interface for all event consumers.

import type { DomainEvent, EventType } from './types'

// ──────────────────────────────────────────────
// Event Handler Interface
// ──────────────────────────────────────────────

/**
 * Contract for all event handlers.
 *
 * A handler:
 * - Subscribes to ONE event type
 * - Processes the event independently
 * - Fails independently (does not block other handlers)
 * - Never knows about other handlers
 * - Never calls back into the producer domain
 *
 * @example
 * class NotificationHandler implements EventHandler<BookingCreatedPayload> {
 *   eventType = EventType.BOOKING_CREATED
 *   async handle(event: DomainEvent<BookingCreatedPayload>) {
 *     await sendWhatsApp(event.payload.contactPhone, 'Booking confirmed!')
 *   }
 * }
 */
export interface EventHandler<T = unknown> {
  /** Which event type this handler processes */
  readonly eventType: EventType

  /** Process the event. Must be idempotent (safe to call multiple times). */
  handle(event: DomainEvent<T>): Promise<void>

  /** Called when handle() throws. Optional — default behavior is log + swallow. */
  onError?(event: DomainEvent<T>, error: Error): Promise<void>
}

// ──────────────────────────────────────────────
// Handler Registration
// ──────────────────────────────────────────────

export interface HandlerRegistration {
  handler: EventHandler
  /** Priority (lower = earlier). Default 100. */
  priority: number
  /** Whether to run this handler asynchronously (non-blocking). Default true. */
  async: boolean
}

// ──────────────────────────────────────────────
// Event Bus Interface
// ──────────────────────────────────────────────

/**
 * The Event Bus routes events to handlers. It does NOT execute business logic.
 *
 * Responsibilities:
 * - Route events to registered handlers
 * - Support synchronous and asynchronous handlers
 * - Provide ordering guarantees per aggregate
 * - Emit metrics (published, consumed, failed, latency)
 *
 * Anti-patterns (never do this):
 * - Handler calls back into the producer domain
 * - Handler modifies the event payload
 * - Handler blocks the bus for other events
 * - Bus contains business logic
 */
export interface EventBus {
  /** Register a handler for an event type */
  on(handler: EventHandler, options?: { priority?: number; async?: boolean }): void

  /** Remove a handler */
  off(handler: EventHandler): void

  /** Publish an event to all registered handlers */
  publish<T>(event: DomainEvent<T>): Promise<void>

  /** Get current metrics */
  getMetrics(): EventBusMetrics
}

// ──────────────────────────────────────────────
// Event Bus Metrics
// ──────────────────────────────────────────────

export interface EventBusMetrics {
  published: number
  consumed: Record<string, number>  // per handler name
  failed: number
  retried: number
  dlq: number
  avgDispatchLatencyMs: number
}
