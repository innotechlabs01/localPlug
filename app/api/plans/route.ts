import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    const plansResult = await db.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC')
    const plans = plansResult.rows || []

    const plansWithDetails = await Promise.all(plans.map(async (plan: any) => {
      const featuresResult = await db.execute({
        sql: 'SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order',
        args: [plan.id],
      })

      const toursResult = await db.execute({
        sql: 'SELECT * FROM plan_tours WHERE plan_id = ? AND is_active = 1 ORDER BY sort_order',
        args: [plan.id],
      })

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price_usd: plan.price_usd,
        is_popular: plan.is_popular,
        features: featuresResult.rows || [],
        tours: (toursResult.rows || []).map((tour: any) => ({
          id: tour.id,
          name: tour.name,
          description: tour.description,
          price_per_person_usd: tour.price_per_person_usd,
        })),
      }
    }))

    return NextResponse.json({ plans: plansWithDetails })
  } catch (error) {
    console.error('[Plans Public API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
