import { describe, it, expect } from 'vitest'
import {
  DEFAULT_RIDE_PRICING,
  calculateRideFare,
  type RidePricingRow,
} from '@/lib/ride-pricing'

function toRow(tier: (typeof DEFAULT_RIDE_PRICING)[number]): RidePricingRow {
  return { ...tier, last_reviewed_at: '2026-01-15T00:00:00Z' }
}

const getTier = (category: string): RidePricingRow => {
  const found = DEFAULT_RIDE_PRICING.find((t) => t.category === category)
  if (!found) throw new Error(`Missing default tier: ${category}`)
  return toRow(found)
}

describe('DEFAULT_RIDE_PRICING (Medellín 2026 tiers)', () => {
  it('defines all four expected tiers ordered by ascending base fare', () => {
    expect(DEFAULT_RIDE_PRICING.map((t) => t.category)).toEqual([
      'standard',
      'suv',
      'vip',
      'luxury',
    ])

    for (let i = 1; i < DEFAULT_RIDE_PRICING.length; i++) {
      expect(DEFAULT_RIDE_PRICING[i].base_usd).toBeGreaterThan(
        DEFAULT_RIDE_PRICING[i - 1].base_usd,
      )
      expect(DEFAULT_RIDE_PRICING[i].min_fare_usd).toBeGreaterThan(
        DEFAULT_RIDE_PRICING[i - 1].min_fare_usd,
      )
    }
  })

  it('contains valid Medellín 2026 rates and regulation references', () => {
    const standard = getTier('standard')
    expect(standard.base_usd).toBe(1.5)
    expect(standard.per_km_usd).toBe(0.65)
    expect(standard.per_min_usd).toBe(0.1)
    expect(standard.min_fare_usd).toBe(3.0)
    expect(standard.avg_speed_kmh).toBe(28)
    expect(standard.platform_commission_pct).toBe(18)
    expect(standard.regulation_ref).toContain('Res. 202650004167')

    const suv = getTier('suv')
    expect(suv.min_fare_usd).toBe(4.5)
    expect(suv.platform_commission_pct).toBe(20)
    expect(suv.regulation_ref).toContain('Res. 202650004167')

    const vip = getTier('vip')
    expect(vip.min_fare_usd).toBe(7.0)
    expect(vip.platform_commission_pct).toBe(20)
    expect(vip.regulation_ref).toContain('Res. 202650004167')

    const luxury = getTier('luxury')
    expect(luxury.min_fare_usd).toBe(12.0)
    expect(luxury.platform_commission_pct).toBe(22)
    expect(luxury.regulation_ref).toContain('Decreto 431/2017')
  })
})

describe('calculateRideFare', () => {
  it('enforces the minimum fare floor and 4-minute minimum duration for short trips', () => {
    for (const tier of DEFAULT_RIDE_PRICING) {
      const rule = toRow(tier)
      const zeroKm = calculateRideFare(rule, 0)
      expect(zeroKm.totalUsd).toBe(rule.min_fare_usd)
      expect(zeroKm.estimatedMinutes).toBe(4)

      const shortKm = calculateRideFare(rule, 0.5)
      expect(shortKm.totalUsd).toBe(rule.min_fare_usd)
      expect(shortKm.estimatedMinutes).toBe(4)
    }
  })

  it('computes distance, estimated minutes, speed, and fare accurately', () => {
    // standard: base 1.5, per_km 0.65, per_min 0.10, speed 28 km/h, comm 18%
    // 10 km at 28 km/h => round((10 / 28) * 60) = 21 min
    // raw = 1.5 + 10 * 0.65 + 21 * 0.10 = 10.10
    const std = calculateRideFare(getTier('standard'), 10)
    expect(std.speedKmh).toBe(28)
    expect(std.estimatedMinutes).toBe(21)
    expect(std.totalUsd).toBe(10.1)
    expect(std.commPct).toBe(18)
    expect(std.platformFeeUsd).toBe(1.82)
    expect(std.driverNetUsd).toBe(8.28)

    // luxury: base 5.0, per_km 1.65, per_min 0.30, speed 30 km/h, comm 22%
    // 25 km at 30 km/h => round((25 / 30) * 60) = 50 min
    // raw = 5.0 + 25 * 1.65 + 50 * 0.30 = 61.25
    const lux = calculateRideFare(getTier('luxury'), 25)
    expect(lux.speedKmh).toBe(30)
    expect(lux.estimatedMinutes).toBe(50)
    expect(lux.totalUsd).toBe(61.25)
    expect(lux.commPct).toBe(22)
    expect(lux.platformFeeUsd).toBe(13.48)
    expect(lux.driverNetUsd).toBe(47.77)
  })

  it('clamps avg_speed_kmh to at least 10 km/h and defaults falsy speed to 28 km/h', () => {
    const slowRule: RidePricingRow = { ...getTier('standard'), avg_speed_kmh: 5 }
    const slowFare = calculateRideFare(slowRule, 10)
    expect(slowFare.speedKmh).toBe(10)
    expect(slowFare.estimatedMinutes).toBe(60)

    const zeroSpeedRule: RidePricingRow = { ...getTier('standard'), avg_speed_kmh: 0 }
    const defaultSpeedFare = calculateRideFare(zeroSpeedRule, 14)
    expect(defaultSpeedFare.speedKmh).toBe(28)
    expect(defaultSpeedFare.estimatedMinutes).toBe(30)
  })

  it('ensures platformFeeUsd + driverNetUsd === totalUsd across all tiers and distances', () => {
    const distances = [0, 0.5, 1, 3.7, 7.33, 12.5, 25, 42.195]

    for (const tier of DEFAULT_RIDE_PRICING) {
      const rule = toRow(tier)
      for (const km of distances) {
        const result = calculateRideFare(rule, km)
        const sumCents = Math.round((result.platformFeeUsd + result.driverNetUsd) * 100)
        const totalCents = Math.round(result.totalUsd * 100)
        expect(sumCents).toBe(totalCents)
        expect(result.platformFeeUsd).toBeGreaterThanOrEqual(0)
        expect(result.driverNetUsd).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('clamps platform_commission_pct between 0 and 50', () => {
    const lowComm: RidePricingRow = { ...getTier('suv'), platform_commission_pct: -10 }
    const lowRes = calculateRideFare(lowComm, 10)
    expect(lowRes.commPct).toBe(0)
    expect(lowRes.platformFeeUsd).toBe(0)
    expect(lowRes.driverNetUsd).toBe(lowRes.totalUsd)

    const highComm: RidePricingRow = { ...getTier('suv'), platform_commission_pct: 80 }
    const highRes = calculateRideFare(highComm, 10)
    expect(highRes.commPct).toBe(50)
    expect(Math.round((highRes.platformFeeUsd + highRes.driverNetUsd) * 100)).toBe(
      Math.round(highRes.totalUsd * 100),
    )
  })
})
