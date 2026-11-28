import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAuth, mockExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/rides/offer-lifecycle', () => ({
  ensureRideDispatchSchema: vi.fn(() => Promise.resolve()),
  sweepStaleRideOffers: vi.fn(() => Promise.resolve()),
}))

await import('@/app/api/driver/assignments/pending/route')
import { GET } from '@/app/api/driver/assignments/pending/route'

describe('GET /api/driver/assignments/pending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_driver' })
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 23, name: 'Driver' }] })
      .mockResolvedValueOnce({ rows: [] })
  })

  it('returns paid assignments without constructing an invalid URL', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ driverId: 23, total: 0 })
    const assignmentQuery = mockExecute.mock.calls[1][0]
    expect(assignmentQuery.sql).toContain("o.payment_status = 'paid'")
    expect(assignmentQuery.sql).toContain('a.driver_accepted_at')
    expect(assignmentQuery.sql).toContain('o.customer_notes as special_requests')
    expect(assignmentQuery.sql).not.toContain('o.return_trip')
  })
})
