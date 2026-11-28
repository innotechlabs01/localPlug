import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchPaidRide } from '@/lib/rides/dispatch'

const { mockExecute } = vi.hoisted(() => ({ mockExecute: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

const db = { execute: mockExecute } as never

describe('dispatchPaidRide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not offer an unpaid ride to a driver', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'awaiting_payment', payment_status: 'pending', assigned_to: null }] })

    const result = await dispatchPaidRide(db, 7, 6.2, -75.5)

    expect(result.offeredDriverId).toBeNull()
    expect(mockExecute.mock.calls.some(([call]) => call.sql.includes('INSERT INTO assignments'))).toBe(false)
  })

  it('offers a paid ride to the closest available driver', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 7, status: 'awaiting_payment', payment_status: 'paid', assigned_to: null }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 21, lat: 6.21, lng: -75.51, rating: 4.9 }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    const result = await dispatchPaidRide(db, 7, 6.2, -75.5)

    expect(result.offeredDriverId).toBe(21)
    const assignment = mockExecute.mock.calls.find(([call]) => call.sql.includes('INSERT INTO assignments'))
    expect(assignment?.[0].args).toEqual([7, 21, expect.stringContaining('ON-DEMAND')])
  })
})
