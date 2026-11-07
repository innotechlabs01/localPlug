import { describe, it, expect } from 'vitest'
import { computeBookingTotals } from '../lib/booking-totals'

describe('computeBookingTotals', () => {
  it('computes base total when there are no tours', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      returnCharge: 48,
      tours: [],
      serviceFee: 5,
      taxRate: 0.19,
    })
    const subtotal = 159 + 48
    expect(result.toursTotal).toBe(0)
    expect(result.subtotal).toBe(subtotal)
    expect(result.iva).toBeCloseTo((subtotal - 5) * 0.19, 5)
    expect(result.total).toBeCloseTo(subtotal + 5 + (subtotal - 5) * 0.19, 5)
  })

  it('adds tour prices multiplied by number of people', () => {
    const result = computeBookingTotals({
      basePrice: 89,
      returnCharge: 48,
      tours: [{ price: 149, numPeople: 3 }, { price: 89, numPeople: 3 }],
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.toursTotal).toBe((149 + 89) * 3)
    expect(result.subtotal).toBe(89 + 48 + (149 + 89) * 3)
    expect(result.iva).toBeCloseTo((result.subtotal - 5) * 0.19, 5)
    expect(result.total).toBeCloseTo(result.subtotal + 5 + (result.subtotal - 5) * 0.19, 5)
  })

  it('handles empty tours array', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      returnCharge: 0,
      tours: [],
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.toursTotal).toBe(0)
    expect(result.subtotal).toBe(159)
  })

  it('adds service fee flat (not per person)', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      serviceFeeFlat: 30,
      returnCharge: 48,
      tours: [],
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.serviceFeeFlat).toBe(30)
    expect(result.subtotal).toBe(159 + 30 + 48)
    expect(result.total).toBeCloseTo(result.subtotal + 5 + (result.subtotal - 5) * 0.19, 5)
  })

  it('defaults service fee flat to 0 when omitted', () => {
    const result = computeBookingTotals({
      basePrice: 89,
      returnCharge: 0,
      tours: [],
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.serviceFeeFlat).toBe(0)
    expect(result.subtotal).toBe(89)
  })
})
