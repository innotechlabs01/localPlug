import { describe, it, expect } from 'vitest'
import { computeBookingTotals } from '../lib/booking-totals'

describe('computeBookingTotals', () => {
  it('computes base total matching legacy formula when there are no tours', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      returnCharge: 48,
      tourPrices: [],
      numPeople: 1,
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
      tourPrices: [149, 89],
      numPeople: 3,
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.toursTotal).toBe((149 + 89) * 3)
    expect(result.subtotal).toBe(89 + 48 + (149 + 89) * 3)
    expect(result.iva).toBeCloseTo((result.subtotal - 5) * 0.19, 5)
    expect(result.total).toBeCloseTo(result.subtotal + 5 + (result.subtotal - 5) * 0.19, 5)
  })

  it('clamps invalid or zero number of people to 1', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      returnCharge: 0,
      tourPrices: [100],
      numPeople: 0,
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.toursTotal).toBe(100)
  })

  it('adds service price multiplied by number of people', () => {
    const result = computeBookingTotals({
      basePrice: 159,
      servicePrice: 30,
      returnCharge: 48,
      tourPrices: [],
      numPeople: 3,
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.serviceTotal).toBe(90)
    expect(result.subtotal).toBe(159 + 90 + 48)
    expect(result.total).toBeCloseTo(result.subtotal + 5 + (result.subtotal - 5) * 0.19, 5)
  })

  it('defaults service total to 0 when servicePrice is omitted or zero', () => {
    const result = computeBookingTotals({
      basePrice: 89,
      returnCharge: 0,
      tourPrices: [],
      numPeople: 2,
      serviceFee: 5,
      taxRate: 0.19,
    })
    expect(result.serviceTotal).toBe(0)
    expect(result.subtotal).toBe(89)
  })
})
