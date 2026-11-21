import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { processOutboxEvents } from '@/lib/events-outbox'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authError = await requirePermission('queue', 'view')
  if (authError) return authError

  const db = getDb()
  const [countsRes, eventsRes] = await Promise.all([
    db.execute(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
      FROM events_outbox
    `),
    db.execute(`
      SELECT id, type, correlation_id, status, retry_count, max_retries, error_message, processed_at, created_at
      FROM events_outbox
      ORDER BY id DESC
      LIMIT 60
    `),
  ])

  const c = countsRes.rows[0] || {}
  return NextResponse.json({
    counts: {
      pending: Number(c.pending || 0),
      processing: Number(c.processing || 0),
      published: Number(c.published || 0),
      failed: Number(c.failed || 0),
    },
    events: eventsRes.rows,
  })
}

export async function POST(req: Request) {
  const authError = await requirePermission('queue', 'update')
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'process'
  const eventId = body.eventId ? Number(body.eventId) : null

  const db = getDb()

  if (action === 'retry' && eventId) {
    await db.execute({
      sql: `UPDATE events_outbox
            SET status = 'pending', retry_count = 0, locked_at = NULL, error_message = NULL
            WHERE id = ?`,
      args: [eventId],
    })
  } else if (action === 'retry_all_failed') {
    await db.execute(
      `UPDATE events_outbox
       SET status = 'pending', retry_count = 0, locked_at = NULL, error_message = NULL
       WHERE status = 'failed'`,
    )
  }

  const stats = await processOutboxEvents(50)
  return NextResponse.json({ success: true, stats })
}
