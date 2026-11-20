import { NextResponse } from 'next/server'
import { listEventsSince, getLatestEventId } from '@/lib/events-outbox'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

/**
 * Alias of /api/realtime/events for clients that call /api/events?since=<id>.
 * Returns outbox events strictly newer than `since`.
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const since = Number(searchParams.get('since') || 0)
  const events = await listEventsSince(Number.isFinite(since) ? since : 0)
  const latest = await getLatestEventId()
  return NextResponse.json({ events, cursor: latest })
}
