import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'

const {
  mockVerifyWebhookSignature,
  mockBuildPaymentRecordFromWebhook,
  mockGetPayment,
  mockSetPayment,
  mockGetDb,
  mockTriggerPaymentConfirmation,
  mockGetPackageName,
  mockGetPackageTotal,
} = vi.hoisted(() => ({
  mockVerifyWebhookSignature: vi.fn(),
  mockBuildPaymentRecordFromWebhook: vi.fn(),
  mockGetPayment: vi.fn(),
  mockSetPayment: vi.fn(),
  mockGetDb: vi.fn(),
  mockTriggerPaymentConfirmation: vi.fn(),
  mockGetPackageName: vi.fn(),
  mockGetPackageTotal: vi.fn(),
}))

vi.mock('@/app/components/booking/lib/stripe-server', () => ({
  verifyWebhookSignature: mockVerifyWebhookSignature,
  buildPaymentRecordFromWebhook: mockBuildPaymentRecordFromWebhook,
}))

vi.mock('@/app/components/booking/lib/payment-store', () => ({
  getPayment: mockGetPayment,
  setPayment: mockSetPayment,
}))

vi.mock('@/lib/n8n/client', () => ({
  triggerPaymentConfirmation: mockTriggerPaymentConfirmation,
}))

vi.mock('@/lib/db', () => ({
  getDb: mockGetDb,
}))

vi.mock('@/lib/pricing', () => ({
  getPackageName: mockGetPackageName,
  getPackageTotal: mockGetPackageTotal,
}))

function createSucceededEvent(overrides?: Record<string, unknown>) {
  return {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        amount: 8900,
        amount_received: 8900,
        currency: 'usd',
        status: 'succeeded',
        receipt_email: 'customer@test.com',
        metadata: {
          bookingReference: 'BR-001',
          customerEmail: 'customer@test.com',
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          packageName: 'The VIP Arrival',
          packageId: 'smooth-landing',
          flightNumber: 'AA123',
          airline: 'American Airlines',
          arrivalDate: '2026-06-15',
          arrivalTime: '10:00',
          needReturn: 'false',
        },
        ...overrides,
      },
    },
  }
}

function createFailedEvent(overrides?: Record<string, unknown>) {
  return {
    id: 'evt_456',
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        id: 'pi_456',
        amount: 8900,
        amount_received: 0,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          bookingReference: 'BR-002',
          customerEmail: 'fail@test.com',
          customerName: 'Jane Doe',
          packageId: 'smooth-landing',
        },
        ...overrides,
      },
    },
  }
}

function createRequest(body: string, signature?: string) {
  const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body,
  })
  if (signature) {
    req.headers.set('stripe-signature', signature)
  }
  return req
}

describe('Stripe webhook handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDb.mockReturnValue({ execute: vi.fn().mockResolvedValue({ rows: [] }) })
    mockBuildPaymentRecordFromWebhook.mockImplementation(
      (event: any, intent: any) => ({
        bookingReference: intent.metadata?.bookingReference || '',
        packageId: intent.metadata?.packageId || '',
        packageName: intent.metadata?.packageName || '',
        amount: intent.amount,
        currency: intent.currency,
        status: event.type === 'payment_intent.succeeded' ? 'completed' : 'failed',
        stripePaymentIntentId: intent.id,
        stripeWebhookEventId: event.id,
        customerEmail: intent.metadata?.customerEmail || '',
        customerName: intent.metadata?.customerName || '',
        customerPhone: intent.metadata?.customerPhone || undefined,
      }),
    )
    mockGetPackageName.mockReturnValue('The VIP Arrival')
    mockGetPackageTotal.mockReturnValue(89)
    mockTriggerPaymentConfirmation.mockResolvedValue(undefined)
    mockSetPayment.mockResolvedValue(undefined)
    mockGetPayment.mockResolvedValue(null)
  })

  it('should return 400 when stripe-signature header is missing', async () => {
    const req = createRequest(JSON.stringify({}))
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing stripe-signature header')
  })

  it('should return 401 when signature verification fails', async () => {
    mockVerifyWebhookSignature.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const req = createRequest(JSON.stringify({}), 'bad-sig')
    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('should return 200 for unhandled event types (no-op)', async () => {
    const event = { id: 'evt_999', type: 'charge.updated', data: { object: { metadata: {} } } }
    mockVerifyWebhookSignature.mockReturnValue(event)
    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(mockSetPayment).not.toHaveBeenCalled()
  })

  it('should return 200 for succeeded event with missing bookingRef', async () => {
    const event = createSucceededEvent({
      metadata: { bookingReference: '' },
    })
    mockVerifyWebhookSignature.mockReturnValue(event)
    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(mockSetPayment).not.toHaveBeenCalled()
  })

  it('should process payment_intent.succeeded and create order, update payment, trigger n8n', async () => {
    const event = createSucceededEvent()
    mockVerifyWebhookSignature.mockReturnValue(event)
    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)

    expect(mockSetPayment).toHaveBeenCalledTimes(1)
    const savedRecord = mockSetPayment.mock.calls[0][0]
    expect(savedRecord.bookingReference).toBe('BR-001')
    expect(savedRecord.status).toBe('completed')

    expect(mockGetDb).toHaveBeenCalled()
    const db = mockGetDb.mock.results[0].value
    expect(db.execute).toHaveBeenCalled()
    const insertCall = db.execute.mock.calls.find(
      (c: any) => c[0]?.sql?.startsWith('INSERT INTO orders'),
    )
    expect(insertCall).toBeDefined()
    expect(insertCall[0].args[1]).toBe('BR-001')

    expect(mockTriggerPaymentConfirmation).toHaveBeenCalledTimes(1)
    expect(mockTriggerPaymentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ bookingReference: 'BR-001' }),
    )
  })

  it('should update existing order when order already exists for succeeded event', async () => {
    const event = createSucceededEvent()
    mockVerifyWebhookSignature.mockReturnValue(event)
    const mockDb = { execute: vi.fn() }
    mockDb.execute.mockResolvedValueOnce({ rows: [{ id: 1 }] })
    mockDb.execute.mockResolvedValueOnce({ rows: [] })
    mockGetDb.mockReturnValue(mockDb)

    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const updateCall = mockDb.execute.mock.calls.find(
      (c: any) => c[0]?.sql?.includes('UPDATE orders SET payment_status'),
    )
    expect(updateCall).toBeDefined()
  })

  it('should handle idempotency (duplicate event ID) and return 200', async () => {
    const event = createSucceededEvent()
    mockVerifyWebhookSignature.mockReturnValue(event)
    mockGetPayment.mockResolvedValue({
      bookingReference: 'BR-001',
      stripeWebhookEventId: 'evt_123',
      status: 'completed',
      packageId: 'smooth-landing',
      packageName: 'The VIP Arrival',
      amount: 8900,
      currency: 'usd',
      stripePaymentIntentId: 'pi_123',
      customerEmail: 'customer@test.com',
      customerName: 'John Doe',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    })

    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockSetPayment).not.toHaveBeenCalled()
  })

  it('should process payment_intent.payment_failed and update payment record', async () => {
    const event = createFailedEvent()
    mockVerifyWebhookSignature.mockReturnValue(event)
    mockGetPayment.mockResolvedValue(null)

    const req = createRequest(JSON.stringify({}), 'valid-sig')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)

    expect(mockSetPayment).toHaveBeenCalledTimes(1)
    const savedRecord = mockSetPayment.mock.calls[0][0]
    expect(savedRecord.bookingReference).toBe('BR-002')
    expect(savedRecord.status).toBe('failed')
  })

  it('should propagate database error from setPayment', async () => {
    const event = createSucceededEvent()
    mockVerifyWebhookSignature.mockReturnValue(event)
    mockSetPayment.mockRejectedValueOnce(new Error('Database connection failed'))

    const req = createRequest(JSON.stringify({}), 'valid-sig')
    await expect(POST(req)).rejects.toThrow('Database connection failed')
  })
})
