import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET } from '@/app/api/admin/income-summary/route'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

vi.mock('@/lib/admin/permissions', () => ({
  requirePermission: vi.fn(() => Promise.resolve(undefined)),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))

vi.mock('@/lib/settings', () => ({
  getDriverBaseTripCompensation: vi.fn(() => Promise.resolve(25)),
  getDriverParkingReimbursement: vi.fn(() => Promise.resolve(5)),
}))

describe('admin income-summary API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns empty summary when there is no data', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary.totalRevenue).toBe(0)
    expect(json.monthlyRevenue).toEqual([])
    expect(json.payoutBreakdown).toEqual([])
  })

  it('aggregates revenue and payouts', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ total: 1000 }] }) // completed sum
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })     // failed
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })     // pending
      .mockResolvedValueOnce({ rows: [{ count: 10 }] })    // completed count
      .mockResolvedValueOnce({ rows: [{ cnt: 4, parked: 1 }] }) // payout agg
      .mockResolvedValueOnce({ rows: [{ base_services: 700, return_transport: 200, hotel: 100 }] })
      .mockResolvedValueOnce({ rows: [{ month: '2026-01', revenue: 500 }] })
      .mockResolvedValueOnce({ rows: [{ driver_name: 'Carlos', trips: 2, parked: 0 }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Transfer', count: 5, revenue: 700 }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary.totalRevenue).toBe(1000)
    expect(json.summary.driverPayouts).toBe(105) // 4*25 + 1*5 = 105
    expect(json.summary.platformTake).toBe(895)
    expect(json.summary.successRate).toBe('83.3')
    expect(json.monthlyRevenue[0].revenue).toBe(500)
    expect(json.payoutBreakdown[0].payout).toBe(50) // 2*25 + 0 = 50
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requirePermission).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const res = await GET()
    expect(res.status).toBe(401)
  })
})