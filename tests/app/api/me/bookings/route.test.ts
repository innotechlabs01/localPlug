import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/me/bookings/route'

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

describe('GET /api/me/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockExecute.mockResolvedValue({ rows: [{ id: 1, booking_reference: 'BK-1' }] })
  })

  it('does not select the optional customer_language column', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ bookings: [{ id: 1, booking_reference: 'BK-1' }] })

    const call = mockExecute.mock.calls[0][0]
    expect(call.sql).not.toContain('customer_language')
    expect(call.args).toEqual(['user_123'])
  })
})
