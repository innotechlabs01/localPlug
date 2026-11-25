import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { requireSuperAdmin, isSuperAdminClerkUser } from '@/lib/admin/permissions'
import { DEFAULT_RIDE_PRICING, ensureRidePricingTable } from '@/lib/ride-pricing'

export async function GET() {
  try {
    const pricing = await ensureRidePricingTable()
    const { userId } = await auth().catch(() => ({ userId: null }))
    const isSuper = userId ? await isSuperAdminClerkUser(userId) : false

    // Hide internal platform commission percentage from non-super-admin callers
    const safePricing = isSuper
      ? pricing
      : pricing.map(({ platform_commission_pct: _omit, ...pub }) => pub)

    return NextResponse.json({ success: true, pricing: safePricing })
  } catch (err) {
    console.error('[Ride Pricing] GET error:', err)
    return NextResponse.json({ error: 'Failed to load ride pricing' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authError = await requireSuperAdmin()
    if (authError) return authError

    await ensureRidePricingTable()
    const body = await request.json()
    const category = String(body.category || '').trim().toLowerCase()
    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const base_usd = Math.max(0, Number(body.base_usd))
    const per_km_usd = Math.max(0, Number(body.per_km_usd))
    const per_min_usd = Math.max(0, Number(body.per_min_usd))
    const min_fare_usd = Math.max(0, Number(body.min_fare_usd))
    const avg_speed_kmh = Math.max(10, Math.min(90, Number(body.avg_speed_kmh) || 28))
    const platform_commission_pct = Math.max(0, Math.min(50, Number(body.platform_commission_pct ?? 20)))

    const db = getDb()
    await db.execute({
      sql: `UPDATE ride_pricing_config
            SET base_usd = ?, per_km_usd = ?, per_min_usd = ?, min_fare_usd = ?, avg_speed_kmh = ?,
                platform_commission_pct = ?, last_reviewed_at = datetime('now'), updated_at = datetime('now')
            WHERE category = ?`,
      args: [base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh, platform_commission_pct, category],
    })

    const pricing = await ensureRidePricingTable()
    return NextResponse.json({ success: true, pricing })
  } catch (err) {
    console.error('[Ride Pricing] PUT error:', err)
    return NextResponse.json({ error: 'Failed to update ride pricing' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const authError = await requireSuperAdmin()
    if (authError) return authError

    await ensureRidePricingTable()
    const db = getDb()
    for (const row of DEFAULT_RIDE_PRICING) {
      await db.execute({
        sql: `UPDATE ride_pricing_config
              SET label = ?, base_usd = ?, per_km_usd = ?, per_min_usd = ?, min_fare_usd = ?,
                  avg_speed_kmh = ?, platform_commission_pct = ?, regulation_ref = ?,
                  last_reviewed_at = datetime('now'), updated_at = datetime('now')
              WHERE category = ?`,
        args: [
          row.label, row.base_usd, row.per_km_usd, row.per_min_usd, row.min_fare_usd,
          row.avg_speed_kmh, row.platform_commission_pct, row.regulation_ref, row.category,
        ],
      })
    }
    const pricing = await ensureRidePricingTable()
    return NextResponse.json({ success: true, pricing })
  } catch (err) {
    console.error('[Ride Pricing] POST reset error:', err)
    return NextResponse.json({ error: 'Failed to sync regulation defaults' }, { status: 500 })
  }
}
