// @lp/events — In-Memory Event Bus
// Part of B10. Routes events to handlers. No business logic.
//
// The bus does NOT persist events. Persistence is handled by the OutboxProcessor.
// The bus does NOT retry failed handlers. Retry is handled by the OutboxProcessor.

import type { DomainEvent } from './types'
import type { EventHandler, EventBus, EventBusMetrics, HandlerRegistration } from './handler'

// ──────────────────────────────────────────────
// In-Memory Event Bus
// ──────────────────────────────────────────────

/**
 * In-memory event bus that routes events to handlers.
 *
 * Usage:
 *   const bus = new InMemoryEventBus()
 *   bus.on(new NotificationHandler())
 *   bus.on(new AnalyticsHandler())
 *   await bus.publish(bookingCreatedEvent)
 *
 * The bus is:
 * - Single-process only (no distributed pub/sub)
 * - In-memory (no persistence — use OutboxProcessor for durability)
 * - Fast (no I/O in the routing path)
 *
 * For production with multiple processes, replace with Redis/NATS pub/sub.
 * The handler contract stays the same — only the transport changes.
 */
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, HandlerRegistration[]>()
  private metrics: EventBusMetrics = {
    published: 0,
    consumed: {},
    failed: 0,
    retried: 0,
    dlq: 0,
    avgDispatchLatencyMs: 0,
  }
  private totalLatencyMs = 0
  private dispatchCount = 0

  // ──────────────────────────────────────────
  // Handler Registration
  // ──────────────────────────────────────────

  on(handler: EventHandler, options?: { priority?: number; async?: boolean }): void {
    const registration: HandlerRegistration = {
      handler,
      priority: options?.priority ?? 100,
      async: options?.async ?? true,
    }

    const existing = this.handlers.get(handler.eventType) || []
    existing.push(registration)
    existing.sort((a, b) => a.priority - b.priority)
    this.handlers.set(handler.eventType, existing)
  }

  off(handler: EventHandler): void {
    const existing = this.handlers.get(handler.eventType) || []
    const filtered = existing.filter(r => r.handler !== handler)
    this.handlers.set(handler.eventType, filtered)
  }

  // ──────────────────────────────────────────
  // Event Publishing
  // ──────────────────────────────────────────

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const startTime = Date.now()
    this.metrics.published++

    const registrations = this.handlers.get(event.type) || []

    if (registrations.length === 0) {
      // No handlers registered — event is silently dropped.
      // This is normal during migration (B10 creates the bus, B11+ adds handlers).
      return
    }

    // Execute handlers in priority order
    for (const registration of registrations) {
      try {
        if (registration.async) {
          // Async handlers: fire-and-forget, but catch errors
          registration.handler.handle(event).catch(error => {
            this.handleError(event, registration.handler, error)
          })
        } else {
          // Sync handlers: await completion
          await registration.handler.handle(event)
        }

        // Track consumed metrics
        const handlerName = registration.handler.constructor.name || 'anonymous'
        this.metrics.consumed[handlerName] = (this.metrics.consumed[handlerName] || 0) + 1
      } catch (error) {
        this.handleError(event, registration.handler, error as Error)
      }
    }

    // Track latency
    const latency = Date.now() - startTime
    this.totalLatencyMs += latency
    this.dispatchCount++
    this.metrics.avgDispatchLatencyMs = this.totalLatencyMs / this.dispatchCount
  }

  // ──────────────────────────────────────────
  // Error Handling
  // ──────────────────────────────────────────

  private async handleError<T>(event: DomainEvent<T>, handler: EventHandler, error: Error): Promise<void> {
    this.metrics.failed++

    if (handler.onError) {
      try {
        await handler.onError(event, error)
      } catch {
        // onError itself failed — log and swallow
        console.error(`[EventBus] onError handler failed for ${event.type}:`, error)
      }
    } else {
      // Default: log and swallow
      console.error(`[EventBus] Handler failed for ${event.type}:`, error.message)
    }
  }

  // ──────────────────────────────────────────
  // Metrics
  // ──────────────────────────────────────────

  getMetrics(): EventBusMetrics {
    return { ...this.metrics }
  }

  /** Reset metrics (for testing) */
  resetMetrics(): void {
    this.metrics = {
      published: 0,
      consumed: {},
      failed: 0,
      retried: 0,
      dlq: 0,
      avgDispatchLatencyMs: 0,
    }
    this.totalLatencyMs = 0
    this.dispatchCount = 0
  }
}
