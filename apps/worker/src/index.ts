import 'dotenv/config'
import { processOutboxEvents } from '@/lib/events-outbox'

const POLL_MS = Math.max(500, parseInt(process.env.OUTBOX_POLL_MS || '2000', 10) || 2000)
let running = true

async function tick() {
  try {
    const stats = await processOutboxEvents(25)
    if (stats.processed > 0) {
      console.log(`[worker] processed=${stats.processed} succeeded=${stats.succeeded} failed=${stats.failed}`)
    }
  } catch (err) {
    console.error('[worker] tick error:', err)
  }
}

async function main() {
  console.log(`[worker] LocalPlug Event-Driven Outbox Worker started (poll=${POLL_MS}ms)`)
  while (running) {
    await tick()
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
}

process.on('SIGINT', () => {
  console.log('[worker] Shutting down (SIGINT)...')
  running = false
})

process.on('SIGTERM', () => {
  console.log('[worker] Shutting down (SIGTERM)...')
  running = false
})

main().catch((err) => {
  console.error('[worker] Fatal error:', err)
  process.exit(1)
})
