import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accrueDriverPayout } from '@/lib/payout'

const { mockExecute, mockEmitEvent } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockEmitEvent: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/settings', () => ({
  getHotelCommissionRate: vi.fn(async () => 0.1),
}))

vi.mock('@/lib/events-outbox', () => ({
  emitEvent: mockEmitEvent,
}))

describe('accrueDriverPayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the quoted on-demand driver payout instead of the current category fare', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{
        booking_reference: 'RIDE-QUOTE',
        driver_payout_usd: 9.06,
        trip_fare_usd: 12,
        cat_name: 'Standard (Básico)',
      }],
      rowsAffected: 1,
    })

    await accrueDriverPayout(1, 17)

    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.arrayContaining(['RIDE-QUOTE', 17, 9.06]),
    }))
  })

  it('falls back to the category fare for legacy orders without a quoted payout', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{
        booking_reference: 'RIDE-LEGACY',
        trip_fare_usd: 11.5,
        cat_name: 'SUV / Eléctrico',
      }],
      rowsAffected: 1,
    })

    await accrueDriverPayout(2, 17)

    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.arrayContaining(['RIDE-LEGACY', 17, 11.5]),
    }))
  })
})
