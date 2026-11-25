import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    const [plansResult, featuresResult, toursResult] = await Promise.all([
      db.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC'),
      db.execute('SELECT * FROM plan_features ORDER BY plan_id ASC, sort_order ASC'),
      db.execute('SELECT * FROM plan_tours WHERE is_active = 1 ORDER BY plan_id ASC, sort_order ASC'),
    ])

    const plans = plansResult.rows || []
    const features = featuresResult.rows || []
    const tours = toursResult.rows || []

    const featuresByPlanId = new Map<string, string[]>()
    for (const f of (features as any[])) {
      const planId = String(f.plan_id)
      const text = f.text ?? ''
      const list = featuresByPlanId.get(planId)
      if (list) {
        list.push(text)
      } else {
        featuresByPlanId.set(planId, [text])
      }
    }

    const toursByPlanId = new Map<string, any[]>()
    for (const tour of (tours as any[])) {
      const planId = String(tour.plan_id)
      const item = {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        price_per_person_usd: tour.price_per_person_usd,
      }
      const list = toursByPlanId.get(planId)
      if (list) {
        list.push(item)
      } else {
        toursByPlanId.set(planId, [item])
      }
    }

    const plansWithDetails = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price_usd: plan.price_usd,
      is_popular: plan.is_popular,
      features: featuresByPlanId.get(String(plan.id)) || [],
      tours: toursByPlanId.get(String(plan.id)) || [],
    }))

    return NextResponse.json({ plans: plansWithDetails })
  } catch (error) {
    console.error('[Plans Public API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
