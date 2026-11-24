import { getDb } from '@/lib/db'

export interface RidePricingRow {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
  platform_commission_pct: number
  regulation_ref: string
  last_reviewed_at: string | null
}

export const DEFAULT_RIDE_PRICING: Omit<RidePricingRow, 'last_reviewed_at'>[] = [
  {
    category: 'standard',
    label: 'Standard (Básico)',
    base_usd: 1.5,
    per_km_usd: 0.65,
    per_min_usd: 0.1,
    min_fare_usd: 3.0,
    avg_speed_kmh: 28,
    platform_commission_pct: 18,
    regulation_ref: 'Res. 202650004167 Medellín (Piso $8.300 COP)',
  },
  {
    category: 'suv',
    label: 'SUV / Eléctrico',
    base_usd: 2.0,
    per_km_usd: 0.85,
    per_min_usd: 0.14,
    min_fare_usd: 4.5,
    avg_speed_kmh: 28,
    platform_commission_pct: 20,
    regulation_ref: 'Res. 202650004167 Medellín (Piso $9.500 COP)',
  },
  {
    category: 'vip',
    label: 'VIP (De Lujo)',
    base_usd: 3.0,
    per_km_usd: 1.15,
    per_min_usd: 0.2,
    min_fare_usd: 7.0,
    avg_speed_kmh: 30,
    platform_commission_pct: 20,
    regulation_ref: 'Res. 202650004167 Medellín (Piso $12.100 COP)',
  },
  {
    category: 'luxury',
    label: 'Luxury Ejecutivo',
    base_usd: 5.0,
    per_km_usd: 1.65,
    per_min_usd: 0.3,
    min_fare_usd: 12.0,
    avg_speed_kmh: 30,
    platform_commission_pct: 22,
    regulation_ref: 'Transporte Especial Decreto 431/2017',
  },
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
      platform_commission_pct REAL NOT NULL DEFAULT 20,
      regulation_ref TEXT NOT NULL DEFAULT 'Res. 202650004167 Medellín',
      last_reviewed_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    args: [],
  })

  for (const colSql of [
    `ALTER TABLE ride_pricing_config ADD COLUMN platform_commission_pct REAL NOT NULL DEFAULT 20`,
    `ALTER TABLE ride_pricing_config ADD COLUMN regulation_ref TEXT NOT NULL DEFAULT 'Res. 202650004167 Medellín'`,
    `ALTER TABLE ride_pricing_config ADD COLUMN last_reviewed_at TEXT DEFAULT (datetime('now'))`,
  ]) {
    await db.execute({ sql: colSql, args: [] }).catch(() => {})
  }

  for (const row of DEFAULT_RIDE_PRICING) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO ride_pricing_config
              (category, label, base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh, platform_commission_pct, regulation_ref, last_reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        row.category,
        row.label,
        row.base_usd,
        row.per_km_usd,
        row.per_min_usd,
        row.min_fare_usd,
        row.avg_speed_kmh,
        row.platform_commission_pct,
        row.regulation_ref,
      ],
    })
  }

  const res = await db.execute({
    sql: `SELECT category, label, base_usd, per_km_usd, per_min_usd, min_fare_usd, avg_speed_kmh,
                 COALESCE(platform_commission_pct, 20) as platform_commission_pct,
                 COALESCE(regulation_ref, 'Res. 202650004167 Medellín') as regulation_ref,
                 last_reviewed_at
          FROM ride_pricing_config
          ORDER BY base_usd ASC`,
    args: [],
  })
  return res.rows as unknown as RidePricingRow[]
}

export function calculateRideFare(rule: RidePricingRow, distanceKm: number) {
  const speed = Math.max(10, Number(rule.avg_speed_kmh) || 28)
  const estimatedMinutes = Math.max(4, Math.round((distanceKm / speed) * 60))
  const raw =
    Number(rule.base_usd) +
    distanceKm * Number(rule.per_km_usd) +
    estimatedMinutes * Number(rule.per_min_usd)
  const totalUsd = Math.round(Math.max(Number(rule.min_fare_usd), raw) * 100) / 100
  const commPct = Math.max(0, Math.min(50, Number(rule.platform_commission_pct ?? 20)))
  const platformFeeUsd = Math.round(totalUsd * (commPct / 100) * 100) / 100
  const driverNetUsd = Math.round((totalUsd - platformFeeUsd) * 100) / 100
  return { totalUsd, estimatedMinutes, speedKmh: speed, platformFeeUsd, driverNetUsd, commPct }
}
