import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/payments/status/route'
import { NextRequest } from 'next/server'

const {
  mockGetPayment,
  mockRateLimitMiddleware,
} = vi.hoisted(() => ({
  mockGetPayment: vi.fn(),
  mockRateLimitMiddleware: vi.fn(),
}))

vi.mock('@/app/components/booking/lib/payment-store', () => ({
  getPayment: mockGetPayment,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: mockRateLimitMiddleware,
}))

function createRequest(bookingRef?: string) {
  const url = bookingRef
    ? `http://localhost:3000/api/payments/status?bookingRef=${encodeURIComponent(bookingRef)}`
    : 'http://localhost:3000/api/payments/status'
  return new NextRequest(url, { method: 'GET' })
}

const mockRecord = {
  bookingReference: 'BR-001',
  packageId: 'smooth-landing',
  packageName: 'The VIP Arrival',
  amount: 8900,
  currency: 'usd',
  status: 'completed',
  stripePaymentIntentId: 'pi_abc123',
  customerEmail: 'customer@test.com',
  customerName: 'John Doe',
  createdAt: '2026-06-12T00:00:00.000Z',
  updatedAt: '2026-06-12T00:00:00.000Z',
}

describe('GET /api/payments/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimitMiddleware.mockReturnValue(null)
  })

  it('should return payment status for a valid booking reference', async () => {
    mockGetPayment.mockResolvedValue(mockRecord)

    const req = createRequest('BR-001')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.bookingReference).toBe('BR-001')
    expect(json.status).toBe('completed')
    expect(json.amount).toBe(8900)
    expect(json.packageName).toBe('The VIP Arrival')
  })

  it('should return no_payment status when no payment record exists', async () => {
    mockGetPayment.mockResolvedValue(null)

    const req = createRequest('BR-NONEXISTENT')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.bookingReference).toBe('BR-NONEXISTENT')
    expect(json.status).toBe('no_payment')
  })

  it('should return 400 when bookingRef query param is missing', async () => {
    const req = createRequest()
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('invalid_request')
    expect(json.message).toBe('bookingRef is required')
  })

  it('should handle rate limiting', async () => {
    mockRateLimitMiddleware.mockReturnValue(
      new Response(JSON.stringify({ error: 'too_many_requests' }), { status: 429 }),
    )

    const req = createRequest('BR-001')
    const res = await GET(req)
    expect(res.status).toBe(429)
    expect(mockGetPayment).not.toHaveBeenCalled()
  })

  it('should return correct status for pending payments', async () => {
    mockGetPayment.mockResolvedValue({ ...mockRecord, status: 'pending' })

    const req = createRequest('BR-001')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('pending')
  })

  it('should return correct status for failed payments', async () => {
    mockGetPayment.mockResolvedValue({ ...mockRecord, status: 'failed' })

    const req = createRequest('BR-001')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('failed')
  })
})
