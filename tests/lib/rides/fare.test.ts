import { describe, expect, it } from 'vitest'
import {
  calculateRideFare,
  calculateRideQuote,
  validateRideTaxRate,
  type RideFareRule,
} from '@/lib/rides/fare'

const standardRule: RideFareRule = {
  category: 'standard',
  label: 'Standard (Básico)',
  base_usd: 1.5,
  per_km_usd: 0.65,
  per_min_usd: 0.1,
  min_fare_usd: 3,
  avg_speed_kmh: 28,
  platform_commission_pct: 18,
  regulation_ref: 'Res. 202650004167 Medellín',
  last_reviewed_at: null,
}

describe('validateRideTaxRate', () => {
  it('accepts numeric and string rates between 0 and 1', () => {
    expect(validateRideTaxRate('0.19')).toBe(0.19)
    expect(validateRideTaxRate(0)).toBe(0)
    expect(validateRideTaxRate(1)).toBe(1)
  })

  it('rejects missing, non-numeric and out-of-range rates', () => {
    expect(() => validateRideTaxRate(undefined)).toThrow(/tax_rate_iva/)
    expect(() => validateRideTaxRate('abc')).toThrow(/tax_rate_iva/)
    expect(() => validateRideTaxRate(-0.01)).toThrow(/tax_rate_iva/)
    expect(() => validateRideTaxRate(1.2)).toThrow(/tax_rate_iva/)
  })
})

describe('calculateRideQuote', () => {
  it('adds the configured platform commission and validated IVA to the charged total', () => {
    const fare = calculateRideFare(standardRule, 10)
    const quote = calculateRideQuote(standardRule, 10, 0.19)

    expect(fare.totalUsd).toBe(10.1)
    expect(quote.subtotalUsd).toBe(10.1)
    expect(quote.commPct).toBe(18)
    expect(quote.platformFeeUsd).toBe(1.82)
    expect(quote.driverPayoutUsd).toBe(10.1)
    expect(quote.taxRate).toBe(0.19)
    expect(quote.taxUsd).toBe(2.26)
    expect(quote.totalUsd).toBe(14.18)
    expect(quote.totalCents).toBe(1418)
  })

  it('changes the charged total when super_admin changes commission', () => {
    const lower = calculateRideQuote({ ...standardRule, platform_commission_pct: 0 }, 10, 0.19)
    const higher = calculateRideQuote({ ...standardRule, platform_commission_pct: 40 }, 10, 0.19)

    expect(lower.totalUsd).toBe(12.02)
    expect(higher.totalUsd).toBe(16.83)
    expect(higher.platformFeeUsd).toBeGreaterThan(lower.platformFeeUsd)
  })

  it('keeps the split consistent after rounding', () => {
    for (const km of [0, 3.7, 7.33, 25]) {
      const quote = calculateRideQuote(standardRule, km, 0.19)
      const chargedCents =
        Math.round(quote.driverPayoutUsd * 100) +
        Math.round(quote.platformFeeUsd * 100) +
        Math.round(quote.taxUsd * 100)
      expect(chargedCents).toBe(quote.totalCents)
    }
  })
})
