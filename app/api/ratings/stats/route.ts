// app/api/ratings/stats/route.ts
import { NextResponse } from 'next/server'
import { getRatingStats } from '@/lib/services/rating-service'

// Simple in-memory cache
let statsCache: { data: Awaited<ReturnType<typeof getRatingStats>>; timestamp: number } | null = null
const CACHE_TTL_MS = 30_000

export async function GET() {
  try {
    const now = Date.now()
    if (statsCache && now - statsCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(statsCache.data)
    }

    const stats = await getRatingStats()
    statsCache = { data: stats, timestamp: now }
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Ratings Stats API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
