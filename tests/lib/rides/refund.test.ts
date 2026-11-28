import { beforeEach, describe, expect, it, vi } from 'vitest'
import { refundPaidRide } from '@/lib/rides/refund'

const { mockExecute, mockRefundCreate } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockRefundCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@polar-sh/sdk/2026-04', () => ({
  createPolar: vi.fn(() => ({ refunds: { create: mockRefundCreate } })),
}))

const db = { execute: mockExecute } as never

process.env.POLAR_ACCESS_TOKEN = 'test-token'

describe('refundPaidRide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecute.mockResolvedValue({
      rows: [{ amount: 1000, status: 'completed', polar_transaction_id: 'order-1', provider_transaction_id: null }],
      rowsAffected: 1,
    })
    mockRefundCreate.mockResolvedValue({ id: 'refund-1', status: 'pending' })
  })

  it('refunds the captured amount through Polar using the checkout order id', async () => {
    const result = await refundPaidRide(db, { bookingReference: 'RIDE-1' })

    expect(result.ok).toBe(true)
    expect(mockRefundCreate).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 'order-1',
      amount: 1000,
      reason: 'service_disruption',
      metadata: expect.objectContaining({ booking_reference: 'RIDE-1' }),
    }))
  })

  it('treats an already-refunded provider error as success', async () => {
    mockRefundCreate.mockRejectedValueOnce({
      statusCode: 403,
      error: { error: 'RefundedAlready', detail: 'Order is already fully refunded.' },
    })

    await expect(refundPaidRide(db, { bookingReference: 'RIDE-1' })).resolves.toMatchObject({ ok: true })
  })

  it('treats Polar 422 refundable-amount validation as an already-refunded success', async () => {
    mockRefundCreate.mockRejectedValueOnce({
      statusCode: 422,
      error: {
        error: 'PolarRequestValidationError',
        detail: [
          {
            type: 'value_error',
            loc: ['body', 'amount'],
            msg: 'Refund amount exceeds refundable amount',
            input: 1000,
          },
        ],
      },
    })

    await expect(refundPaidRide(db, { bookingReference: 'RIDE-1' })).resolves.toMatchObject({ ok: true })
  })

  it('does not call the provider when no completed payment exists', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [], rowsAffected: 0 })

    await expect(refundPaidRide(db, { bookingReference: 'RIDE-1' })).resolves.toMatchObject({ ok: false })
    expect(mockRefundCreate).not.toHaveBeenCalled()
  })
})
