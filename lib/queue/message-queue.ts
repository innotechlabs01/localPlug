import { getDb, executeWithRetry } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface QueuedMessage {
  id: number
  channel: 'whatsapp' | 'n8n' | 'email'
  recipient: string
  content: string
  content_type: 'text' | 'buttons'
  metadata?: Record<string, unknown>
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'dead'
  attempts: number
  max_attempts: number
  next_retry_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export async function enqueueMessage(msg: {
  channel: QueuedMessage['channel']
  recipient: string
  content: string
  content_type?: QueuedMessage['content_type']
  metadata?: Record<string, unknown>
  max_attempts?: number
}): Promise<number> {
  const db = getDb()
  const result = await db.execute({
    sql: `INSERT INTO outgoing_messages (channel, recipient, content, content_type, metadata, max_attempts)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      msg.channel,
      msg.recipient,
      msg.content,
      msg.content_type || 'text',
      msg.metadata ? JSON.stringify(msg.metadata) : null,
      msg.max_attempts ?? 3,
    ],
  })
  return Number(result.lastInsertRowid)
}

export async function dequeuePendingMessages(limit = 10): Promise<QueuedMessage[]> {
  const db = getDb()
  const now = new Date().toISOString()
  const result = await db.execute({
    sql: `UPDATE outgoing_messages
          SET status = 'processing', updated_at = datetime('now')
          WHERE id IN (
            SELECT id FROM outgoing_messages
            WHERE status IN ('pending', 'failed')
              AND (next_retry_at IS NULL OR next_retry_at <= ?)
              AND attempts < max_attempts
            ORDER BY created_at ASC
            LIMIT ?
          )
          RETURNING *`,
    args: [now, limit],
  })
  return result.rows.map(row => ({
    id: row.id as number,
    channel: row.channel as QueuedMessage['channel'],
    recipient: row.recipient as string,
    content: row.content as string,
    content_type: (row.content_type as QueuedMessage['content_type']) || 'text',
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    status: row.status as QueuedMessage['status'],
    attempts: row.attempts as number,
    max_attempts: row.max_attempts as number,
    next_retry_at: row.next_retry_at as string | null,
    last_error: row.last_error as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))
}

export async function markMessageSent(messageId: number): Promise<void> {
  await executeWithRetry(
    `UPDATE outgoing_messages SET status = 'sent', updated_at = datetime('now') WHERE id = ?`,
    [messageId],
  )
}

export async function markMessageFailed(messageId: number, error: string): Promise<void> {
  const db = getDb()
  const msg = await db.execute({
    sql: 'SELECT attempts, max_attempts FROM outgoing_messages WHERE id = ?',
    args: [messageId],
  })

  if (msg.rows.length === 0) return

  const attempts = Number(msg.rows[0].attempts) + 1
  const maxAttempts = Number(msg.rows[0].max_attempts)
  const newStatus = attempts >= maxAttempts ? 'dead' : 'failed'
  const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 120000)
  const nextRetry = new Date(Date.now() + backoffMs).toISOString()

  await db.execute({
    sql: `UPDATE outgoing_messages
          SET status = ?, attempts = ?, last_error = ?,
              next_retry_at = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      newStatus,
      attempts,
      error.slice(0, 500),
      newStatus === 'dead' ? null : nextRetry,
      messageId,
    ],
  })
}

export async function requeueDeadMessages(): Promise<number> {
  const db = getDb()
  const result = await db.execute({
    sql: `UPDATE outgoing_messages
          SET status = 'pending', attempts = 0, next_retry_at = NULL, last_error = NULL,
              max_attempts = max_attempts + 3, updated_at = datetime('now')
          WHERE status = 'dead' AND updated_at >= datetime('now', '-24 hours')`,
    args: []
  })
  logger.info('Requeued dead messages', { count: result.rowsAffected })
  return result.rowsAffected
}

export async function getQueueStats(): Promise<{
  pending: number
  processing: number
  failed: number
  dead: number
  sent: number
}> {
  const db = getDb()
  const result = await db.execute(
    `SELECT status, COUNT(*) as cnt FROM outgoing_messages GROUP BY status`,
  )
  const stats = { pending: 0, processing: 0, failed: 0, dead: 0, sent: 0 }
  for (const row of result.rows) {
    const s = row.status as string
    const c = Number(row.cnt)
    if (s in stats) (stats as Record<string, number>)[s] = c
  }
  return stats
}
