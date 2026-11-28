export interface RideFareRule {
  category: string
  label: string
  base_usd: number
  per_km_usd: number
  per_min_usd: number
  min_fare_usd: number
  avg_speed_kmh: number
  platform_commission_pct: number
  regulation_ref?: string
  last_reviewed_at?: string | null
}

export interface RideFare {
  totalUsd: number
  estimatedMinutes: number
  speedKmh: number
  platformFeeUsd: number
  driverNetUsd: number
  commPct: number
}

export interface RideQuote extends RideFare {
  subtotalUsd: number
  driverPayoutUsd: number
  taxRate: number
  taxUsd: number
  taxableUsd: number
  totalUsd: number
  totalCents: number
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Pure fare math shared by the rider UI and checkout. The Super Admin owns the
 * rate card in `ride_pricing_config`; no component may hardcode these values.
 */
export function calculateRideFare(rule: RideFareRule, distanceKm: number): RideFare {
  const speed = Math.max(10, Number(rule.avg_speed_kmh) || 28)
  const estimatedMinutes = Math.max(4, Math.round((distanceKm / speed) * 60))
  const raw =
    Number(rule.base_usd) +
    distanceKm * Number(rule.per_km_usd) +
    estimatedMinutes * Number(rule.per_min_usd)
  const totalUsd = round2(Math.max(Number(rule.min_fare_usd), raw))
  const commPct = Math.max(0, Math.min(50, Number(rule.platform_commission_pct ?? 20)))
  const platformFeeUsd = round2(totalUsd * (commPct / 100))
  const driverNetUsd = round2(totalUsd - platformFeeUsd)
  return { totalUsd, estimatedMinutes, speedKmh: speed, platformFeeUsd, driverNetUsd, commPct }
}

/**
 * IVA is configured globally in `settings.tax_rate_iva` as a decimal (0.19 =
 * 19%). A bad value must stop checkout instead of charging an arbitrary amount.
 */
export function validateRideTaxRate(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    throw new Error('[Ride Pricing] tax_rate_iva is not configured')
  }

  const rate = typeof value === 'string' ? Number(value.trim()) : Number(value)
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`[Ride Pricing] Invalid tax_rate_iva: ${String(value)}`)
  }

  return Math.round(rate * 1_000_000) / 1_000_000
}

/**
 * The rider pays the regulated fare + the configured platform commission + IVA.
 * The driver payout is the regulated fare; commission and tax are remitted by
 * the platform. Commission therefore changes the charged total immediately.
 */
export function calculateRideQuote(
  rule: RideFareRule,
  distanceKm: number,
  taxRate: unknown,
): RideQuote {
  const fare = calculateRideFare(rule, distanceKm)
  const rate = validateRideTaxRate(taxRate)
  const subtotalUsd = fare.totalUsd
  const platformFeeUsd = fare.platformFeeUsd
  const taxableUsd = round2(subtotalUsd + platformFeeUsd)
  const taxUsd = round2(taxableUsd * rate)
  const totalUsd = round2(taxableUsd + taxUsd)

  return {
    ...fare,
    subtotalUsd,
    driverPayoutUsd: subtotalUsd,
    taxRate: rate,
    taxUsd,
    taxableUsd,
    totalUsd,
    totalCents: Math.round(totalUsd * 100),
  }
}
