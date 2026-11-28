import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/assignments/[id]/decline/route'

const { mockExecute, mockBatch, mockSweep } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockBatch: vi.fn(),
  mockSweep: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute, batch: mockBatch })),
}))

vi.mock('@/lib/rides/offer-lifecycle', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/rides/offer-lifecycle')>()
  return {
    ...actual,
    sweepStaleRideOffers: mockSweep,
  }
})

vi.mock('@/lib/webhook-auth', () => ({
  requireWebhookAuth: vi.fn(() => null),
}))

vi.mock('@/lib/driver/auth', () => ({
  getDriverFromSession: vi.fn(),
}))

vi.mock('@/lib/n8n/client', () => ({
  sendOrQueueWhatsApp: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('@/lib/events-outbox', () => ({
  emitEvent: vi.fn(() => Promise.resolve()),
}))

const request = () => new Request('http://localhost:3000/api/assignments/5/decline', { method: 'POST' })
const context = { params: Promise.resolve({ id: '5' }) }

const offer = {
  id: 5,
  order_id: 7,
  driver_id: 3,
  status: 'pending_acceptance',
  order_status: 'on_demand',
  dispatch_status: 'pending',
  assigned_to: null,
  booking_reference: 'RIDE-ACTIVE',
  payment_status: 'paid',
  package_id: 'on_demand_standard',
  observations: 'ON-DEMAND · Recogida: Centro',
  created_at: new Date().toISOString(),
}

describe('POST /api/assignments/[id]/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSweep.mockResolvedValue(undefined)
    mockExecute.mockResolvedValue({ rows: [offer] })
    mockBatch.mockResolvedValue([{ rowsAffected: 1 }, { rowsAffected: 1 }])
  })

  it('does not reset the order when the offer belongs to a cancelled ride', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ ...offer, order_status: 'cancelled', dispatch_status: 'cancelled' }],
    })

    const res = await POST(request(), context)

    expect(res.status).toBe(409)
    expect(mockBatch).not.toHaveBeenCalled()
  })

  it('guards the order reset against a newer driver assignment', async () => {
    const res = await POST(request(), context)

    expect(res.status).toBe(200)
    const orderUpdate = mockBatch.mock.calls[0][0][1]
    expect(orderUpdate.sql).toContain('assigned_to = ?')
    expect(orderUpdate.args).toEqual([expect.any(String), 7, 3])
  })
})
