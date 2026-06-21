import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/payments/create-intent/route'
import { NextRequest } from 'next/server'

const {
  mockCreatePaymentIntent,
  mockGetPayment,
  mockHasPayment,
  mockSetPayment,
  mockRateLimitMiddleware,
  mockGetPackageName,
  mockGetPackagePriceCents,
  mockGetPackageTotalCents,
  mockGetDefaultCurrency,
} = vi.hoisted(() => ({
  mockCreatePaymentIntent: vi.fn(),
  mockGetPayment: vi.fn(),
  mockHasPayment: vi.fn(),
  mockSetPayment: vi.fn(),
  mockRateLimitMiddleware: vi.fn(),
  mockGetPackageName: vi.fn(),
  mockGetPackagePriceCents: vi.fn(),
  mockGetPackageTotalCents: vi.fn(),
  mockGetDefaultCurrency: vi.fn(),
}))

vi.mock('@/app/components/booking/lib/stripe-server', () => ({
  createPaymentIntent: mockCreatePaymentIntent,
}))

vi.mock('@/app/components/booking/lib/payment-store', () => ({
  getPayment: mockGetPayment,
  hasPayment: mockHasPayment,
  setPayment: mockSetPayment,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: mockRateLimitMiddleware,
}))

vi.mock('@/lib/config', () => ({
  getDefaultCurrency: mockGetDefaultCurrency,
}))

vi.mock('@/lib/pricing', () => ({
  getConfigPackageName: mockGetPackageName,
  getConfigPackagePriceCents: mockGetPackagePriceCents,
  getConfigPackageTotalCents: mockGetPackageTotalCents,
}))

function createRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  bookingReference: 'BR-001',
  packageId: 'smooth-landing',
  customerEmail: 'customer@test.com',
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  flightNumber: 'AA123',
  airline: 'American Airlines',
  arrivalDate: '2026-06-15',
  arrivalTime: '10:00',
  needReturn: false,
}

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimitMiddleware.mockReturnValue(null)
    mockGetDefaultCurrency.mockReturnValue('usd')
    mockGetPackagePriceCents.mockReturnValue(8900)
    mockGetPackageTotalCents.mockReturnValue(8900)
    mockGetPackageName.mockReturnValue('The VIP Arrival')
    mockHasPayment.mockResolvedValue(false)
    mockGetPayment.mockResolvedValue(null)
    mockSetPayment.mockResolvedValue(undefined)
    mockCreatePaymentIntent.mockResolvedValue({
      clientSecret: 'pi_secret_abc123',
      paymentIntentId: 'pi_abc123',
    })
  })

  it('should create a payment intent for a valid request', async () => {
    const req = createRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('pi_secret_abc123')
    expect(json.paymentIntentId).toBe('pi_abc123')
    expect(json.amount).toBe(8900)

    expect(mockGetPackageTotalCents).toHaveBeenCalledWith('smooth-landing', false)
    expect(mockCreatePaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: 'BR-001',
        packageId: 'smooth-landing',
        amount: 8900,
        customerEmail: 'customer@test.com',
        customerName: 'John Doe',
      }),
    )
    expect(mockSetPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: 'BR-001',
        amount: 8900,
        status: 'pending',
        stripePaymentIntentId: 'pi_abc123',
      }),
    )
  })

  it('should include return transport charge when needReturn is true', async () => {
    mockGetPackageTotalCents.mockReturnValue(8900 + 4800)
    const req = createRequest({ ...validBody, needReturn: true })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(mockGetPackageTotalCents).toHaveBeenCalledWith('smooth-landing', true)
    expect(mockCreatePaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 13700 }),
    )
  })

  it('should return 400 when required fields are missing', async () => {
    const req = createRequest({ bookingReference: 'BR-001' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('invalid_request')
    expect(json.message).toContain('Missing required fields')
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled()
  })

  it('should return 400 when packageId is unknown', async () => {
    mockGetPackagePriceCents.mockReturnValue(0)
    const req = createRequest({ ...validBody, packageId: 'unknown-package' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('invalid_request')
    expect(json.message).toBe('Invalid package ID')
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled()
  })

  it('should return 409 when a payment is already in progress for the booking', async () => {
    mockHasPayment.mockResolvedValue(true)
    mockGetPayment.mockResolvedValue({
      bookingReference: 'BR-001',
      status: 'pending',
      packageId: 'smooth-landing',
      packageName: 'The VIP Arrival',
      amount: 8900,
      currency: 'usd',
      stripePaymentIntentId: 'pi_existing',
      customerEmail: 'customer@test.com',
      customerName: 'John Doe',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    })

    const req = createRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('duplicate_payment')
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled()
  })

  it('should return 200 (allow) when duplicate payment check finds failed/refunded status', async () => {
    mockHasPayment.mockResolvedValue(true)
    mockGetPayment.mockResolvedValue({
      bookingReference: 'BR-001',
      status: 'failed',
      packageId: 'smooth-landing',
      packageName: 'The VIP Arrival',
      amount: 8900,
      currency: 'usd',
      stripePaymentIntentId: 'pi_failed',
      customerEmail: 'customer@test.com',
      customerName: 'John Doe',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    })

    const req = createRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('should return 500 when Stripe API call fails', async () => {
    mockCreatePaymentIntent.mockRejectedValue(new Error('Stripe API error'))
    const req = createRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('server_error')
  })

  it('should apply rate limiting', async () => {
    mockRateLimitMiddleware.mockReturnValue(
      new Response(JSON.stringify({ error: 'too_many_requests' }), { status: 429 }),
    )

    const req = createRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(429)
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled()
  })
})
