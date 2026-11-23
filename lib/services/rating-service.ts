// lib/services/rating-service.ts
import { getDb } from '@/lib/db'

export interface Rating {
  id: number
  conversation_id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  resolved: number
  first_response_time_ms: number | null
  created_at: string
  updated_at: string
}

export interface RatingStats {
  avg_rating: number
  total_ratings: number
  resolved_pct: number
  avg_response_time_ms: number | null
}

export async function createRating(data: {
  conversation_id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  resolved?: number
  first_response_time_ms?: number | null
}): Promise<Rating> {
  const db = getDb()

  const result = await db.execute({
    sql: `INSERT INTO ratings (conversation_id, customer_name, customer_country, rating, comment, resolved, first_response_time_ms)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.conversation_id,
      data.customer_name,
      data.customer_country,
      data.rating,
      data.comment || '',
      data.resolved ?? 1,
      data.first_response_time_ms ?? null,
    ],
  })

  const inserted = await db.execute({
    sql: 'SELECT * FROM ratings WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })

  return inserted.rows[0] as unknown as Rating
}

export async function getLatestRatings(limit: number = 10): Promise<Rating[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, conversation_id, customer_name, customer_country, rating, comment, resolved, created_at
          FROM ratings
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [limit],
  })
  return result.rows as unknown as Rating[]
}

export async function getRatingStats(): Promise<RatingStats> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT
            COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating,
            COUNT(*) AS total_ratings,
            COALESCE(ROUND(CAST(SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100), 0) AS resolved_pct,
            COALESCE(ROUND(AVG(first_response_time_ms)), NULL) AS avg_response_time_ms
          FROM ratings`,
    args: [],
  })

  const row = result.rows[0]
  return {
    avg_rating: Number(row?.avg_rating || 0),
    total_ratings: Number(row?.total_ratings || 0),
    resolved_pct: Number(row?.resolved_pct || 0),
    avg_response_time_ms: row?.avg_response_time_ms != null ? Number(row.avg_response_time_ms) : null,
  }
}

export async function ratingExistsForConversation(conversationId: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM ratings WHERE conversation_id = ?',
    args: [conversationId],
  })
  return Number(result.rows[0]?.cnt || 0) > 0
}

export async function getFirstResponseTimeMs(conversationId: number): Promise<number | null> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT (julianday(first_agent_response_at) - julianday(created_at)) * 86400000 AS ms
          FROM conversations
          WHERE id = ? AND first_agent_response_at IS NOT NULL`,
    args: [conversationId],
  })
  if (result.rows.length === 0) return null
  const ms = Number(result.rows[0].ms)
  return isNaN(ms) ? null : Math.round(ms)
}
