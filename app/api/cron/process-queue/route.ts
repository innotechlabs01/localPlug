import { NextResponse } from 'next/server'
import { processQueue } from '@/lib/queue/whatsapp-worker'
import { getQueueStats, requeueDeadMessages } from '@/lib/queue/message-queue'
import { getAllCircuitStats } from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/logger'

let _callsSinceLastRequeue = 0
const REQUEUE_INTERVAL = 12 // requeue dead messages every 12 cron runs (~1 hour if every 5 min)

function verifyAuth(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true

  const token = process.env.CRON_SECRET
  if (token && req.headers.get('x-cron-secret') === token) return true

  return false
}

export async function GET(req: Request) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processQueue(10)
    const stats = await getQueueStats()

    _callsSinceLastRequeue++
    let requeued = 0
    if (_callsSinceLastRequeue >= REQUEUE_INTERVAL) {
      requeued = await requeueDeadMessages()
      _callsSinceLastRequeue = 0
    }

    if (result.processed > 0 || result.failed > 0 || requeued > 0) {
      logger.info('Cron: queue processed', { ...result, requeued, ...stats })
    }

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      failed: result.failed,
      requeued,
      queue: stats,
    })
  } catch (err) {
    logger.error('Cron: queue processing failed', err instanceof Error ? err : undefined)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
