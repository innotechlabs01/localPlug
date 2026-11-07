import { listEventsSince } from '@/lib/events-outbox'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const POLL_MS = 2000
const MAX_STREAM_MS = 55_000 // stay under proxy/Vercel limits; client reconnects with `since`

/**
 * Realtime outbox — authenticated SSE stream.
 * Self-closes after ~55s and the client reconnects, passing the last event id
 * as `since`. Auth-required because the outbox carries sensitive data.
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  let cursor = Number(url.searchParams.get('since') || 0) || 0

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream<any>({
    async start(controller) {
      const start = Date.now()
      const push = (text: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(text)) } catch {}
      }

      push(`event: cursor\ndata: ${JSON.stringify({ since: cursor })}\n\n`)

      const poll = async () => {
        if (closed) return
        try {
          const events = await listEventsSince(cursor, 200)
          for (const ev of events) {
            if (closed) return
            push(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`)
            cursor = ev.id
          }
          if (events.length === 0) push(`: ping\n\n`)
          if (Date.now() - start > MAX_STREAM_MS) {
            push(`event: done\ndata: {}\n\n`)
            finish()
          }
        } catch (err) {
          push(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`)
          finish()
        }
      }

      let timer: ReturnType<typeof setInterval>
      const finish = () => {
        if (closed) return
        closed = true
        clearInterval(timer)
        try { controller.close() } catch {}
      }

      const onAbort = () => { clearInterval(timer); closed = true }
      req.signal.addEventListener?.('abort', onAbort, { once: true })

      timer = setInterval(poll, POLL_MS)
      setTimeout(poll, 0)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}