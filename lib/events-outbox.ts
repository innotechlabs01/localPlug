// Append-only domain event outbox for realtime sync across LocalPlug actors
// (admin, drivers, hotels, clients). Every key mutation emits an event here;
// consumers poll GET /api/realtime/events?since=<id> or subscribe to the SSE
// stream /api/realtime/events/stream (both authenticated).
import { getDb } from '@/lib/db'

export type OutboxEventStatus = 'pending' | 'published' | 'failed'

export interface OutboxEvent {
  id: number
  type: string
  payload: Record<string, unknown>
  correlation_id: string | null
  status?: OutboxEventStatus
  retry_count?: number
  max_retries?: number
  error_message?: string | null
  processed_at?: string | null
  created_at: string
}

export interface EmitEventOptions {
  correlationId?: string
  status?: OutboxEventStatus
  maxRetries?: number
}

/**
 * Append an event to the outbox.
 * Supports Transactional Outbox: events can start as 'pending' to be relayed by the worker,
 * or default to 'published' for instantaneous pub/sub notification.
 */
export async function emitEvent(
  type: string,
  payload: Record<string, unknown>,
  opts: EmitEventOptions = {},
): Promise<number | null> {
  try {
    const db = getDb()
    const status = opts.status || 'published'
    const maxRetries = opts.maxRetries ?? 5
    const result = await db.execute({
      sql: `INSERT INTO events_outbox (type, payload, correlation_id, status, max_retries)
            VALUES (?, ?, ?, ?, ?)`,
      args: [type, JSON.stringify(payload), opts.correlationId || null, status, maxRetries],
    })
    return Number(result.lastInsertRowid)
  } catch (err) {
    // The event bus must never break the business write that calls it.
    console.error('[events-outbox] emit failed:', err)
    return null
  }
}

/**
 * Transactional event emission helper using an existing database transaction client or executor.
 */
export async function emitTransactionalEvent(
  dbExecutor: { execute: (stmt: { sql: string; args: unknown[] }) => Promise<unknown> },
  type: string,
  payload: Record<string, unknown>,
  opts: EmitEventOptions = {},
): Promise<void> {
  const status = opts.status || 'pending'
  const maxRetries = opts.maxRetries ?? 5
  await dbExecutor.execute({
    sql: `INSERT INTO events_outbox (type, payload, correlation_id, status, max_retries)
          VALUES (?, ?, ?, ?, ?)`,
    args: [type, JSON.stringify(payload), opts.correlationId || null, status, maxRetries],
  })
}

export type OutboxConsumer = (event: OutboxEvent) => Promise<void> | void

const _consumers: Map<string, Set<OutboxConsumer>> = new Map()

/**
 * Register an event consumer/listener for an outbox event type or '*' for all.
 */
export function registerOutboxConsumer(type: string, consumer: OutboxConsumer): () => void {
  if (!_consumers.has(type)) {
    _consumers.set(type, new Set())
  }
  _consumers.get(type)!.add(consumer)
  return () => {
    _consumers.get(type)?.delete(consumer)
  }
}

/**
 * Internal event dispatcher executing registered consumers and external webhooks (e.g. n8n).
 */
async function dispatchOutboxEvent(event: OutboxEvent): Promise<void> {
  // 1. Invoke programmatic consumers
  const specificConsumers = _consumers.get(event.type) || new Set()
  const wildcardConsumers = _consumers.get('*') || new Set()
  const all = [...specificConsumers, ...wildcardConsumers]

  for (const consumer of all) {
    await consumer(event)
  }

  // 2. Integration: trigger n8n event webhook if configured
  const n8nWebhookUrl = process.env.N8N_EVENTS_WEBHOOK_URL
  if (n8nWebhookUrl) {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-signature': process.env.N8N_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        event: event.type,
        data: event.payload,
        correlation_id: event.correlation_id,
        timestamp: new Date().toISOString(),
      }),
    })
    if (!res.ok) {
      throw new Error(`n8n webhook error: HTTP ${res.status}`)
    }
  }
}

/**
 * Background worker relay: polls pending outbox events, processes their external actions,
 * and updates their status to 'published' or 'failed' with retry tracking.
 */
export async function processOutboxEvents(batchSize = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, type, payload, correlation_id, retry_count, max_retries, created_at
          FROM events_outbox
          WHERE status = 'pending' AND retry_count < max_retries
          ORDER BY id ASC LIMIT ?`,
    args: [batchSize],
  })

  let succeeded = 0
  let failed = 0

  for (const row of result.rows) {
    const eventId = Number(row.id)
    const eventType = String(row.type)
    const retryCount = Number(row.retry_count || 0)
    const maxRetries = Number(row.max_retries || 5)
    let parsedPayload: Record<string, unknown> = {}
    try {
      parsedPayload = JSON.parse((row.payload as string) || '{}')
    } catch {
      parsedPayload = {}
    }

    const outboxEvent: OutboxEvent = {
      id: eventId,
      type: eventType,
      payload: parsedPayload,
      correlation_id: (row.correlation_id as string) || null,
      status: 'pending',
      retry_count: retryCount,
      max_retries: maxRetries,
      created_at: String(row.created_at),
    }

    try {
      // Execute genuine dispatch to listeners and external endpoints
      await dispatchOutboxEvent(outboxEvent)

      await db.execute({
        sql: `UPDATE events_outbox
              SET status = 'published', processed_at = datetime('now')
              WHERE id = ?`,
        args: [eventId],
      })
      succeeded++
    } catch (processErr) {
      failed++
      const newRetry = retryCount + 1
      const isExhausted = newRetry >= maxRetries
      const errorMsg = processErr instanceof Error ? processErr.message : String(processErr)

      await db.execute({
        sql: `UPDATE events_outbox
              SET retry_count = ?,
                  status = ?,
                  error_message = ?,
                  processed_at = datetime('now')
              WHERE id = ?`,
        args: [newRetry, isExhausted ? 'failed' : 'pending', errorMsg.slice(0, 500), eventId],
      }).catch(e => console.error('[events-outbox] failed to record error state:', e))
    }
  }

  return { processed: result.rows.length, succeeded, failed }
}

/** Events strictly after `sinceId`. */
export async function listEventsSince(sinceId: number, limit = 200): Promise<OutboxEvent[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, type, payload, correlation_id, created_at
          FROM events_outbox WHERE id > ? ORDER BY id ASC LIMIT ?`,
    args: [sinceId, limit],
  })
  return result.rows.map(row => ({
    id: row.id as number,
    type: row.type as string,
    payload: JSON.parse((row.payload as string) || '{}'),
    correlation_id: row.correlation_id as string | null,
    created_at: row.created_at as string,
  }))
}

/** Highest event id currently in the outbox (the "cursor"). */
export async function getLatestEventId(): Promise<number> {
  const db = getDb()
  const result = await db.execute(`SELECT COALESCE(MAX(id), 0) AS m FROM events_outbox`)
  return Number(result.rows[0]?.m || 0)
}

/** Namespace helpers — callbacks the frontend uses to react and refetch.*/
export type EventHandler = (event: OutboxEvent) => void