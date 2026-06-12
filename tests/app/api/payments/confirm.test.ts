import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { POST } from '@/app/api/payments/confirm/route'
import { NextRequest } from 'next/server'

const {
  mockGetPayment,
  mockSetPayment,
  mockRateLimitMiddleware,
  mockRetrieve,
  mockStripeCtor,
} = vi.hoisted(() => {
  const mockRetrieve = vi.fn()
  return {
    mockGetPayment: vi.fn(),
    mockSetPayment: vi.fn(),
    mockRateLimitMiddleware: vi.fn(),
    mockRetrieve,
    mockStripeCtor: function () {
      return { paymentIntents: { retrieve: mockRetrieve } }
    },
  }
})

vi.mock('@/app/components/booking/lib/payment-store', () => ({
  getPayment: mockGetPayment,
  setPayment: mockSetPayment,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: mockRateLimitMiddleware,
}))

vi.mock('stripe', () => ({
  default: mockStripeCtor,
}))

function createRequest(bookingReference: string, paymentIntentId: string) {
  return new NextRequest('http://localhost:3000/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingReference, paymentIntentId }),
  })
}

describe('POST /api/payments/confirm', () => {
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimitMiddleware.mockReturnValue(null)
    mockGetPayment.mockResolvedValue({
      bookingReference: 'BR-001',
      packageId: 'smooth-landing',
      packageName: 'The VIP Arrival',
      amount: 8900,
      currency: 'usd',
      status: 'pending',
      stripePaymentIntentId: 'pi_abc123',
      customerEmail: 'customer@test.com',
      customerName: 'John Doe',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    })
    mockSetPayment.mockResolvedValue(undefined)
  })

  it('should confirm a completed payment successfully', async () => {
    mockRetrieve.mockResolvedValue({ status: 'succeeded' })

    const req = createRequest('BR-001', 'pi_abc123')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('completed')

    expect(mockRetrieve).toHaveBeenCalledWith('pi_abc123')
    expect(mockSetPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: 'BR-001',
        status: 'completed',
        stripePaymentIntentId: 'pi_abc123',
      }),
    )
  })

  it('should return 400 when payment intent has not succeeded', async () => {
    mockRetrieve.mockResolvedValue({ status: 'processing' })

    const req = createRequest('BR-001', 'pi_abc123')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('payment_not_succeeded')
    expect(json.message).toContain('processing')
    expect(mockSetPayment).not.toHaveBeenCalled()
  })

  it('should return 400 when required fields are missing', async () => {
    const req = createRequest('', '')
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('invalid_request')
    expect(mockRetrieve).not.toHaveBeenCalled()
  })

  it('should return 400 when bookingReference is present but paymentIntentId is missing', async () => {
    const req = createRequest('BR-001', '')
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockRetrieve).not.toHaveBeenCalled()
  })

  it('should handle rate limiting', async () => {
    mockRateLimitMiddleware.mockReturnValue(
      new Response(JSON.stringify({ error: 'too_many_requests' }), { status: 429 }),
    )

    const req = createRequest('BR-001', 'pi_abc123')
    const res = await POST(req)
    expect(res.status).toBe(429)
    expect(mockRetrieve).not.toHaveBeenCalled()
  })

  it('should return 500 when Stripe retrieve fails', async () => {
    mockRetrieve.mockRejectedValue(new Error('Stripe API error'))

    const req = createRequest('BR-001', 'pi_abc123')
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('server_error')
  })

  it('should handle missing existing payment gracefully', async () => {
    mockRetrieve.mockResolvedValue({ status: 'succeeded' })
    mockGetPayment.mockResolvedValue(null)

    const req = createRequest('BR-001', 'pi_abc123')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockSetPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: 'BR-001',
        packageId: '',
        status: 'completed',
      }),
    )
  })
})
