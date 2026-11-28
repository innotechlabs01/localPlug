import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  handlers,
  mockExecute,
  mockDispatchPaidRide,
  mockRefundPaidRide,
} = vi.hoisted(() => ({
  handlers: {} as Record<string, unknown>,
  mockExecute: vi.fn(),
  mockDispatchPaidRide: vi.fn(),
  mockRefundPaidRide: vi.fn(),
}))

vi.mock('@polar-sh/nextjs', () => ({
  Webhooks: (config: Record<string, unknown>) => {
    Object.assign(handlers, config)
    return { handler: vi.fn() }
  },
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/rides/dispatch', () => ({
  dispatchPaidRide: mockDispatchPaidRide,
}))

vi.mock('@/lib/rides/refund', () => ({
  refundPaidRide: mockRefundPaidRide,
}))

vi.mock('@/lib/payout', () => ({
  processBookingRefund: vi.fn(() => Promise.resolve({ resolution: 'pre_milestone', duplicate: false })),
}))

vi.mock('@/lib/events-outbox', () => ({
  emitEvent: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

await import('@/app/api/webhooks/polar/route')

const paidPayload = () => ({
  type: 'order.paid',
  data: {
    id: 'evt-1',
    amount: 1000,
    metadata: {
      booking_reference: 'RIDE-1',
      ride_id: '7',
      pickup_lat: '6.2',
      pickup_lng: '-75.5',
    },
  },
})

describe('Polar order.paid webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDispatchPaidRide.mockResolvedValue({ offeredDriverId: 21, queueAttempt: 1 })
    mockRefundPaidRide.mockResolvedValue({ ok: true, refundId: 'refund-1' })
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ amount: 1000, customer_phone: '' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
  })

  it('dispatches a paid on-demand ride to the nearest driver', async () => {
    const onOrderPaid = handlers.onOrderPaid as (payload: unknown) => Promise<void>
    await onOrderPaid(paidPayload())

    expect(mockDispatchPaidRide).toHaveBeenCalledWith(expect.anything(), 7, 6.2, -75.5)
    const paymentUpdate = mockExecute.mock.calls.find(([call]) => call.sql.includes('provider_transaction_id = ?'))
    expect(paymentUpdate?.[0].args).toEqual(['evt-1', 'evt-1', expect.any(String), 'RIDE-1'])
  })

  it('refunds a ride paid after auto-cancellation instead of dispatching it', async () => {
    mockExecute.mockReset()
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ amount: 1000, customer_phone: '' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'cancelled', payment_status: 'failed' }] })
      .mockResolvedValueOnce({ rowsAffected: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'cancelled', dispatch_status: 'cancelled' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    const onOrderPaid = handlers.onOrderPaid as (payload: unknown) => Promise<void>
    await onOrderPaid(paidPayload())

    expect(mockRefundPaidRide).toHaveBeenCalledWith(expect.anything(), { bookingReference: 'RIDE-1' })
    expect(mockDispatchPaidRide).not.toHaveBeenCalled()
    const refundPayment = mockExecute.mock.calls.find(([call]) => call.sql.includes("status = 'refunded'"))
    expect(refundPayment?.[0].args).toEqual([expect.any(String), 'RIDE-1'])
  })
})
