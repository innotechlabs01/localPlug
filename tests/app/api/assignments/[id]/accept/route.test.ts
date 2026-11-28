import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/assignments/[id]/accept/route'

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
    ensureRideDispatchSchema: vi.fn(),
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
  triggerClientDriverConfirmed: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/dispatch/availability', () => ({
  getEstimatedDurationMinutes: vi.fn(() => 60),
}))

vi.mock('@/lib/events-outbox', () => ({
  emitEvent: vi.fn(() => Promise.resolve()),
}))

const request = () => new Request('http://localhost:3000/api/assignments/5/accept', { method: 'POST' })
const context = { params: Promise.resolve({ id: '5' }) }

const activeOffer = {
  id: 5,
  order_id: 7,
  driver_id: 3,
  status: 'pending_acceptance',
  order_status: 'on_demand',
  dispatch_status: 'pending_acceptance',
  assigned_to: null,
  booking_reference: 'RIDE-ACTIVE',
  payment_status: 'paid',
  package_id: 'on_demand_standard',
  package_name: 'Viaje On-Demand (Standard)',
  service_type: 'pickup',
  created_at: new Date().toISOString(),
  pickup_date: '2026-11-28',
  pickup_time: '12:00',
  customer_name: 'Rider',
  driver_name: 'Driver',
  driver_phone: '123',
  phone: '123',
  plate: 'ABC123',
  vehicle: 'SUV',
  observations: 'ON-DEMAND · Recogida: Centro',
}

describe('POST /api/assignments/[id]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSweep.mockResolvedValue(undefined)
    mockExecute.mockResolvedValue({ rows: [activeOffer] })
    mockBatch.mockResolvedValue([{ rowsAffected: 1 }, { rowsAffected: 1 }, { rowsAffected: 1 }])
  })

  it('rejects an offer whose order was cancelled and never marks the driver busy', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ ...activeOffer, order_status: 'cancelled', dispatch_status: 'cancelled' }],
    })

    const res = await POST(request(), context)

    expect(res.status).toBe(409)
    expect(mockBatch).not.toHaveBeenCalled()
  })

  it('rejects an on-demand offer older than the offer TTL', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ ...activeOffer, created_at: '2020-01-01 00:00:00' }],
    })

    const res = await POST(request(), context)

    expect(res.status).toBe(409)
    expect(mockBatch).not.toHaveBeenCalled()
  })

  it('guards the order update so a concurrent cancellation cannot be overwritten', async () => {
    const res = await POST(request(), context)

    expect(res.status).toBe(200)
    const orderUpdate = mockBatch.mock.calls[0][0][1]
    expect(orderUpdate.sql).toContain("status NOT IN ('cancelled', 'completed')")
    expect(orderUpdate.sql).toContain("dispatch_status NOT IN ('cancelled', 'completed')")
  })
})
