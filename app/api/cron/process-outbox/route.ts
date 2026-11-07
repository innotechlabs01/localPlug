import { NextResponse } from 'next/server'
import { processOutboxEvents } from '@/lib/events-outbox'
import { timingSafeEqual } from '@/lib/string-utils'

/**
 * Background outbox processor endpoint.
 * Intended to be called by a periodic cron worker (e.g. Vercel Cron, n8n, or external timer)
 * to process any pending transactional outbox events without message loss.
 */
export async function GET(req: Request) {
  return handleProcess(req)
}

export async function POST(req: Request) {
  return handleProcess(req)
}

async function handleProcess(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, '') || ''
      if (!timingSafeEqual(token, cronSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))

    const stats = await processOutboxEvents(limit)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
    })
  } catch (err) {
    console.error('[cron/process-outbox] Relay error:', err)
    return NextResponse.json(
      { error: 'Failed to process outbox events' },
      { status: 500 },
    )
  }
}
