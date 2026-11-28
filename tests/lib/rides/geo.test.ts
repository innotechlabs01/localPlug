import { describe, expect, it } from 'vitest'
import { haversineKm, isFiniteCoordinate, roundKm } from '@/lib/rides/geo'

describe('rides geo helpers', () => {
  it('computes a non-zero straight-line distance between Medellín anchors', () => {
    const km = haversineKm(6.2088, -75.567, 6.2445, -75.605)
    expect(km).toBeGreaterThan(4)
    expect(km).toBeLessThan(8)
    expect(haversineKm(6.2088, -75.567, 6.2088, -75.567)).toBe(0)
  })

  it('rejects NaN and Infinity as coordinates', () => {
    expect(isFiniteCoordinate(6.2088)).toBe(true)
    expect(isFiniteCoordinate(Number.NaN)).toBe(false)
    expect(isFiniteCoordinate(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isFiniteCoordinate('6.2')).toBe(false)
  })

  it('rounds kilometres to one decimal with a positive floor', () => {
    expect(roundKm(5200)).toBe(5.2)
    expect(roundKm(0)).toBe(0.1)
  })
})
