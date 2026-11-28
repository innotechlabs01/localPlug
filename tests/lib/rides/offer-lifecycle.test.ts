import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureRideDispatchSchema,
  sweepStaleRideOffers,
} from '@/lib/rides/offer-lifecycle'

const { mockExecute, mockRefundPaidRide } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockRefundPaidRide: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/rides/refund', () => ({
  refundPaidRide: mockRefundPaidRide,
}))

const db = { execute: mockExecute } as never

describe('ride offer lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecute.mockResolvedValue({ rows: [], rowsAffected: 0 })
    mockRefundPaidRide.mockResolvedValue({ ok: true, refundId: 'refund-1' })
  })

  it('creates the driver_locations table on cold databases', async () => {
    await ensureRideDispatchSchema(db)

    expect(mockExecute.mock.calls[0][0].sql).toContain('CREATE TABLE IF NOT EXISTS driver_locations')
  })

  it('cancels an unpaid ride without contacting the payment provider', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    await sweepStaleRideOffers(db)

    expect(mockRefundPaidRide).not.toHaveBeenCalled()
    expect(mockExecute.mock.calls[1][0].sql).toContain("status = 'cancelled'")
    expect(mockExecute.mock.calls[1][0].args).toEqual([3])
  })

  it('refunds and cancels a paid ride nobody accepted, then expires its offers', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 7, booking_reference: 'RIDE-PAID' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 11 }, { id: 12 }] })
      .mockResolvedValueOnce({ rowsAffected: 2 })

    await sweepStaleRideOffers(db)

    expect(mockRefundPaidRide).toHaveBeenCalledWith(db, expect.objectContaining({
      bookingReference: 'RIDE-PAID',
    }))
    const statements = mockExecute.mock.calls.map(c => c[0])
    const cancelPaid = statements.find(s => s.sql.includes("THEN 'refunded'"))
    expect(cancelPaid?.args).toEqual([7, 7])
    const markPaymentRefunded = statements.find(s => s.sql.includes('UPDATE payments') && s.sql.includes("status = 'refunded'"))
    expect(markPaymentRefunded?.args).toEqual(['RIDE-PAID'])
    expect(statements.some(s => s.sql.includes('UPDATE assignments') && s.sql.includes("status = 'expired'"))).toBe(true)
  })

  it('keeps the ride paid when the refund provider call fails so the next sweep retries', async () => {
    mockRefundPaidRide.mockResolvedValueOnce({ ok: false, refundId: null })
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 7, booking_reference: 'RIDE-PAID' }] })

    await sweepStaleRideOffers(db)

    const statements = mockExecute.mock.calls.map(c => c[0])
    expect(statements.some(s => s.sql.includes("THEN 'refunded'"))).toBe(false)
  })

  it('binds exactly one argument per SQL placeholder', async () => {
    mockExecute.mockResolvedValue({ rows: [] })

    await sweepStaleRideOffers(db)

    for (const [{ sql, args = [] }] of mockExecute.mock.calls) {
      expect(args).toHaveLength((sql.match(/\?/g) || []).length)
    }
  })

  it('does not cancel a ride that already has an accepted driver', async () => {
    mockExecute.mockResolvedValue({ rows: [] })

    await sweepStaleRideOffers(db)

    const statements = mockExecute.mock.calls.map(c => c[0])
    expect(statements.some(s => s.sql.includes("UPDATE orders SET status = 'cancelled'"))).toBe(false)
    expect(statements.some(s => s.sql.includes("UPDATE assignments SET status = 'expired'"))).toBe(false)
  })
})
