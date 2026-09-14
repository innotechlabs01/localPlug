// Append-only domain event outbox for realtime sync across LocalPlug actors
// (admin, drivers, hotels, clients). Every key mutation emits an event here;
// consumers poll GET /api/realtime/events?since=<id> or subscribe to the SSE
// stream /api/realtime/events/stream (both authenticated).
import { getDb } from '@/lib/db'

export interface OutboxEvent {
  id: number
  type: string
  payload: Record<string, unknown>
  correlation_id: string | null
  created_at: string
}

/** Append an event to the outbox. Fire-and-forget friendly (never throws on insert). */
export async function emitEvent(
  type: string,
  payload: Record<string, unknown>,
  opts: { correlationId?: string } = {},
): Promise<number | null> {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO events_outbox (type, payload, correlation_id) VALUES (?, ?, ?)`,
      args: [type, JSON.stringify(payload), opts.correlationId || null],
    })
    return Number(result.lastInsertRowid)
  } catch (err) {
    // The event bus must never break the business write that calls it.
    console.error('[events-outbox] emit failed:', err)
    return null
  }
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