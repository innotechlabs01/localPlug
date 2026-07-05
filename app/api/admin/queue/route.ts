import { NextResponse } from 'next/server'
import { processQueue } from '@/lib/queue/whatsapp-worker'
import { getQueueStats, requeueDeadMessages } from '@/lib/queue/message-queue'
import { getCircuitStats, getAllCircuitStats } from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/logger'

const AUTH_TOKEN = process.env.QUEUE_WORKER_TOKEN || process.env.CLERK_SECRET_KEY

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (AUTH_TOKEN && auth !== `Bearer ${AUTH_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const action = (body as Record<string, unknown>).action as string | undefined

    if (action === 'requeue') {
      const count = await requeueDeadMessages()
      return NextResponse.json({ action: 'requeue', count })
    }

    const statsBefore = await getQueueStats()
    const result = await processQueue(10)
    const statsAfter = await getQueueStats()

    return NextResponse.json({
      processed: result.processed,
      failed: result.failed,
      queueBefore: statsBefore,
      queueAfter: statsAfter,
    })
  } catch (err) {
    logger.error('Queue worker endpoint failed', err instanceof Error ? err : undefined)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  const [queueStats, circuits] = await Promise.all([
    getQueueStats(),
    Promise.resolve(getAllCircuitStats()),
  ])

  return NextResponse.json({
    queue: queueStats,
    circuits,
  })
}
