import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/rides/request/route'

const quote = {
  totalUsd: 14.18,
  totalCents: 1418,
  subtotalUsd: 10.1,
  platformFeeUsd: 1.82,
  driverPayoutUsd: 10.1,
  taxRate: 0.19,
  taxUsd: 2.26,
  commPct: 18,
  estimatedMinutes: 21,
  speedKmh: 28,
}

const {
  mockAuth,
  mockExecute,
  mockCheckoutCreate,
  mockSetPayment,
  mockGetTaxRate,
  mockCalculateRideQuote,
  mockValidateRideTaxRate,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
  mockCheckoutCreate: vi.fn(),
  mockSetPayment: vi.fn(),
  mockGetTaxRate: vi.fn(),
  mockCalculateRideQuote: vi.fn(),
  mockValidateRideTaxRate: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  clerkClient: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/ride-pricing', () => ({
  ensureRidePricingTable: vi.fn(() => Promise.resolve([
    {
      category: 'standard',
      label: 'Standard',
      base_usd: 1,
      per_km_usd: 1,
      per_min_usd: 0.1,
      min_fare_usd: 3,
      avg_speed_kmh: 30,
      platform_commission_pct: 18,
    },
  ])),
}))

vi.mock('@/lib/settings', () => ({
  getTaxRate: mockGetTaxRate,
}))

vi.mock('@/lib/rides/fare', () => ({
  calculateRideQuote: mockCalculateRideQuote,
  validateRideTaxRate: mockValidateRideTaxRate,
}))

vi.mock('@/lib/ride-token', () => ({
  signRideToken: vi.fn(() => 'ride-token'),
}))

vi.mock('@/lib/rides/offer-lifecycle', () => ({
  ensureRideDispatchSchema: vi.fn(() => Promise.resolve()),
  sweepStaleRideOffers: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/services/payment-service', () => ({
  setPayment: mockSetPayment,
}))

vi.mock('@polar-sh/sdk/2026-04', () => ({
  createPolar: vi.fn(() => ({
    checkouts: { create: mockCheckoutCreate },
  })),
}))

process.env.POLAR_ACCESS_TOKEN = 'test-token'
process.env.POLAR_PRODUCT_ID = 'product-1'

const request = () => new Request('http://localhost:3000/api/rides/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destinationAddress: 'Provenza',
    destinationLat: 6.2088,
    destinationLng: -75.567,
    guestEmail: 'rider@gmail.com',
    category: 'standard',
    distanceKm: 5,
    pickupLat: 6.2088,
    pickupLng: -75.567,
  }),
})

describe('POST /api/rides/request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
    mockExecute.mockResolvedValue({ rows: [], rowsAffected: 0, lastInsertRowid: 7 })
    mockCheckoutCreate.mockResolvedValue({ id: 'checkout-1', url: 'https://polar.test/checkout-1' })
    mockGetTaxRate.mockResolvedValue('0.19')
    mockValidateRideTaxRate.mockImplementation((value: unknown) => {
      const rate = Number(value)
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('invalid tax')
      return rate
    })
    mockCalculateRideQuote.mockReturnValue(quote)
  })

  it('requires payment before dispatching any driver', async () => {
    const res = await POST(request())

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      rideId: 7,
      checkoutUrl: 'https://polar.test/checkout-1',
      totalUsd: 14.18,
    })

    const orderInsert = mockExecute.mock.calls.find(([call]) => call.sql.includes('INSERT INTO orders'))
    expect(orderInsert?.[0].sql).toContain("'awaiting_payment', 'awaiting_payment', 'pending'")
    expect(orderInsert?.[0].sql).not.toContain('card_authorized')

    expect(mockExecute.mock.calls.some(([call]) => call.sql.includes('INSERT INTO assignments'))).toBe(false)
  })

  it('charges the commission and IVA-inclusive total and records the breakdown', async () => {
    await POST(request())

    expect(mockCalculateRideQuote).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'standard' }),
      5,
      0.19,
    )
    expect(mockCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      prices: expect.objectContaining({
        'product-1': [expect.objectContaining({ price_amount: 1418 })],
      }),
      metadata: expect.objectContaining({
        booking_reference: expect.stringMatching(/^RIDE-/),
        ride_id: '7',
        commission_pct: '18',
        platform_fee_usd: '1.82',
        tax_rate: '0.19',
        tax_usd: '2.26',
        destination_lat: '6.2088',
        destination_lng: '-75.567',
      }),
    }))
    expect(mockSetPayment).toHaveBeenCalledWith(expect.objectContaining({
      amount: 1418,
      status: 'pending',
      polar_transaction_id: 'checkout-1',
    }))

    const orderInsert = mockExecute.mock.calls.find(([call]) => call.sql.includes('INSERT INTO orders'))
    expect(orderInsert?.[0].sql).toContain('tax_amount_usd')
    expect(orderInsert?.[0].sql).toContain('grand_total_usd')
    expect(orderInsert?.[0].args).toContain(2.26)
    expect(orderInsert?.[0].args).toContain(14.18)
  })

  it('does not add fake kilometres when the routed distance already includes stops', async () => {
    const routedRequest = new Request('http://localhost:3000/api/rides/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationAddress: 'Laureles',
        destinationLat: 6.2445,
        destinationLng: -75.605,
        guestEmail: 'rider@gmail.com',
        category: 'standard',
        distanceKm: 8.4,
        distanceIncludesStops: true,
        stops: ['Provenza'],
      }),
    })

    await POST(routedRequest)

    expect(mockCalculateRideQuote).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'standard' }),
      8.4,
      0.19,
    )
  })

  it('fails closed before creating an order when the tax rate is invalid', async () => {
    mockValidateRideTaxRate.mockImplementation(() => {
      throw new Error('invalid tax')
    })

    const res = await POST(request())
    expect(res.status).toBe(500)
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('rejects malformed email before creating an order', async () => {
    const invalidRequest = new Request('http://localhost:3000/api/rides/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationAddress: 'Provenza',
        guestEmail: 'not-an-email',
        category: 'standard',
        distanceKm: 5,
      }),
    })

    const res = await POST(invalidRequest)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Ingresa un email válido para el recibo' })
    expect(mockExecute).not.toHaveBeenCalled()
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it('cancels the pending order when Polar rejects the checkout', async () => {
    mockCheckoutCreate.mockRejectedValue(new Error('Polar rejected customer_email'))

    const res = await POST(request())
    expect(res.status).toBe(500)

    const cancel = mockExecute.mock.calls.find(([call]) => call.sql.includes('UPDATE orders'))
    expect(cancel?.[0].sql).toContain("status = 'cancelled'")
    expect(cancel?.[0].sql).toContain("payment_status = 'failed'")
    expect(cancel?.[0].args).toEqual([7])
    expect(mockSetPayment).not.toHaveBeenCalled()
  })

  it('omits empty metadata and returns to the requesting origin', async () => {
    const localRequest = new Request('http://localhost:3001/api/rides/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationAddress: 'Provenza',
        guestEmail: 'rider@gmail.com',
        guestPhone: '',
        category: 'standard',
        distanceKm: 5,
      }),
    })

    await POST(localRequest)

    const checkoutArgs = mockCheckoutCreate.mock.calls[0][0]
    expect(checkoutArgs.metadata).not.toHaveProperty('customer_phone')
    expect(checkoutArgs.metadata).not.toHaveProperty('clerk_user_id')
    expect(checkoutArgs.success_url).toContain('http://localhost:3001/ride?')
    expect(checkoutArgs.embed_origin).toBe('http://localhost:3001')
  })
})
