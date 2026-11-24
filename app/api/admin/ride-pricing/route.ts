import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/admin/permissions'

export interface RidePricingRow {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
}

const DEFAULT_PRICING: RidePricingRow[] = [
  { category: 'standard', label: 'Standard', base_usd: 5, per_km_usd: 0.9, per_min_usd: 0.25, min_fare_usd: 8, avg_speed_kmh: 28 },
  { category: 'suv', label: 'SUV', base_usd: 9, per_km_usd: 1.3, per_min_usd: 0.35, min_fare_usd: 14, avg_speed_kmh: 28 },
  { category: 'vip', label: 'VIP', base_usd: 15, per_km_usd: 1.9, per_min_usd: 0.5, min_fare_usd: 22, avg_speed_kmh: 30 },
  { category: 'luxury', label: 'Luxury', base_usd: 25, per_km_usd: 2.8, per_min_usd: 0.75, min_fare_usd: 35, avg_speed_kmh: 30 },
]

export async function ensureRidePricingTable(): Promise<RidePricingRow[]> {
  const db = getDb()
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS ride_pricing_config (
      category TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      base_usd REAL NOT NULL,
      per_km_usd REAL NOT NULL,
      per_min_usd REAL NOT NULL,
      min_fare_usd REAL NOT NULL,
      avg_speed_kmh REAL NOT NULL DEFAULT 28,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    args: [],
  })

  for (const row of DEFAULT_PRICING) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO ride_pricing_config (category, label, base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [row.category, row.label, row.base_usd, row.per_km_usd, row.per_min_usd, row.min_fare_usd, row.avg_speed_kmh],
    })
  }

  const res = await db.execute({
    sql: `SELECT category, label, base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh
          FROM ride_pricing_config
          ORDER BY base_usd ASC`,
    args: [],
  })
  return (res.rows as unknown as RidePricingRow[])
}

export function calculateRideFare(rule: RidePricingRow, distanceKm: number) {
  const speed = Math.max(10, Number(rule.avg_speed_kmh) || 28)
  const estimatedMinutes = Math.max(4, Math.round((distanceKm / speed) * 60))
  const raw =
    Number(rule.base_usd) +
    distanceKm * Number(rule.per_km_usd) +
    estimatedMinutes * Number(rule.per_min_usd)
  const totalUsd = Math.round(Math.max(Number(rule.min_fare_usd), raw) * 100) / 100
  return { totalUsd, estimatedMinutes, speedKmh: speed }
}

export async function GET() {
  try {
    const pricing = await ensureRidePricingTable()
    return NextResponse.json({ success: true, pricing })
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

    const db = getDb()
    await db.execute({
      sql: `UPDATE ride_pricing_config
            SET base_usd = ?, per_km_usd = ?, per_min_usd = ?, min_fare_usd = ?, avg_speed_kmh = ?, updated_at = datetime('now')
            WHERE category = ?`,
      args: [base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh, category],
    })

    const pricing = await ensureRidePricingTable()
    return NextResponse.json({ success: true, pricing })
  } catch (err) {
    console.error('[Ride Pricing] PUT error:', err)
    return NextResponse.json({ error: 'Failed to update ride pricing' }, { status: 500 })
  }
}
