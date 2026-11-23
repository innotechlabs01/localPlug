import { NextResponse } from 'next/server'
import { getActivePromoEvents } from '@/lib/promo-events'

export const dynamic = 'force-dynamic'

/** Public endpoint: currently-visible promo events/banners for the landing site. */
export async function GET() {
  try {
    const [heroEvents, sectionEvents] = await Promise.all([
      getActivePromoEvents('hero_banner'),
      getActivePromoEvents('section'),
    ])
    return NextResponse.json({
      events: [...heroEvents, ...sectionEvents],
      hero_banner: heroEvents[0] ?? null,
      section: sectionEvents[0] ?? null,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    })
  } catch (err) {
    console.error('[promo events GET]', err)
    return NextResponse.json({ events: [], hero_banner: null, section: null })
  }
}