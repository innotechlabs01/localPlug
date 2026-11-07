// @lp/events — Outbox Pattern
// Part of B10. Persists events in same transaction as business state.
//
// This is the mechanism that guarantees atomicity:
// business state + event are written in the same transaction.
// No "wrote to DB but event lost" scenarios.

import type { DomainEvent } from './types'

// ──────────────────────────────────────────────
// Outbox Event (DB representation)
// ──────────────────────────────────────────────

export type OutboxStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dlq'

export interface OutboxEvent {
  id: string
  eventType: string
  aggregateId: string
  aggregateType: string
  payload: string           // JSON-serialized DomainEvent payload
  status: OutboxStatus
  retryCount: number
  maxRetries: number
  nextRetryAt: string | null
  lastError: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────
// Outbox Repository Contract
// ──────────────────────────────────────────────

/**
 * Repository for persisting outbox events.
 * The actual DB implementation lives in @lp/db.
 * This is the contract that the event bus depends on.
 */
export interface OutboxRepository {
  /** Insert an event into the outbox (called within a DB transaction) */
  insert(event: DomainEvent): Promise<void>

  /** Get pending events for processing */
  getPending(limit: number): Promise<OutboxEvent[]>

  /** Mark event as processing */
  markProcessing(id: string): Promise<void>

  /** Mark event as completed */
  markCompleted(id: string): Promise<void>

  /** Mark event as failed (with retry) */
  markFailed(id: string, error: string, nextRetryAt: Date): Promise<void>

  /** Mark event as dead letter (max retries exceeded) */
  markDeadLetter(id: string, error: string): Promise<void>

  /** Check if event was already processed (idempotency) */
  findByIdempotencyKey(eventId: string): Promise<OutboxEvent | null>
}

// ──────────────────────────────────────────────
// Outbox Helper (for use inside DB transactions)
// ──────────────────────────────────────────────

/**
 * Write an event to the outbox within an existing transaction.
 *
 * Usage in a repository/service:
 *   await db.transaction(async (tx) => {
 *     await tx.insert(orders).values(data)
 *     await outbox.insert(event, tx)  // same transaction!
 *   })
 *
 * The event is NOT dispatched here. The OutboxProcessor
 * picks it up after commit and routes it to the EventBus.
 */
export function createOutboxEntry(event: DomainEvent): {
  id: string
  eventType: string
  aggregateId: string
  aggregateType: string
  payload: string
  status: OutboxStatus
  retryCount: number
  maxRetries: number
  nextRetryAt: string | null
  lastError: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
} {
  const now = new Date().toISOString()
  return {
    id: event.id,
    eventType: event.type,
    aggregateId: event.aggregateId,
    aggregateType: event.aggregateType,
    payload: JSON.stringify(event),
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: null,
    lastError: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}
