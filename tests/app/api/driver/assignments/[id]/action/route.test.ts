import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/driver/assignments/[id]/action/route'

const { mockExecute, mockSweep, mockEnsureSchema } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockSweep: vi.fn(),
  mockEnsureSchema: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

vi.mock('@/lib/rides/offer-lifecycle', () => ({
  isStaleOffer: (offer: any) => offer.order_status === 'cancelled',
  sweepStaleRideOffers: mockSweep,
  ensureRideDispatchSchema: mockEnsureSchema,
}))

vi.mock('@/lib/driver/auth', () => ({
  getDriverFromSession: vi.fn(() => Promise.resolve({
    driver: { id: 17, name: 'Diego', phone: '123' },
    clerkId: 'user_driver',
  })),
}))

vi.mock('@/lib/driver/audit', () => ({ recordAudit: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/events-outbox', () => ({ emitEvent: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/payout', () => ({ accrueDriverPayout: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/notifications/booking', () => ({ sendBookingNotification: vi.fn(() => Promise.resolve()) }))

const request = (action: string) =>
  new Request(`http://localhost:3000/api/driver/assignments/6/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
const context = { params: Promise.resolve({ id: '6' }) }

const offer = {
  id: 6,
  status: 'pending_acceptance',
  order_id: 9,
  dispatch_status: 'pending',
  order_status: 'pending',
  booking_reference: 'RIDE-TEST',
  created_at: new Date().toISOString(),
}

describe('POST /api/driver/assignments/[id]/action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnsureSchema.mockResolvedValue(undefined)
    mockSweep.mockResolvedValue(undefined)
    mockExecute.mockResolvedValue({ rows: [offer] })
  })

  it('rejects an accept after the ride was cancelled', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ ...offer, order_status: 'cancelled' }] })
    const res = await POST(request('accept'), context)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'Offer expired', status: 'expired' })
    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(mockExecute.mock.calls[1][0].sql).toContain("status = 'expired'")
  })

  it('rejects a decline after the ride was cancelled', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ ...offer, order_status: 'cancelled' }] })
    const res = await POST(request('decline'), context)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: 'Offer expired', status: 'expired' })
    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(mockExecute.mock.calls[1][0].sql).toContain("status = 'expired'")
  })
})
