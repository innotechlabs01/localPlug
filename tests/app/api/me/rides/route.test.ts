import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/me/rides/route'

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

const rideRow = {
  id: 12,
  booking_reference: 'RIDE-TEST1',
  order_status: 'completed',
  dispatch_status: 'completed',
  assignment_status: 'completed',
  destination_address: 'Provenza, Medellín',
  customer_notes: 'Recogida: Aeropuerto JMC · Paradas: Centro · 6 km · ~15 min',
  package_price: 12.5,
  currency: 'USD',
  created_at: '2026-11-27 10:00:00',
  driver_id: 3,
  driver_name: 'Ana Driver',
  driver_vehicle: 'SUV',
  driver_plate: 'ABC123',
  driver_rating: 4.8,
}

describe('GET /api/me/rides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockExecute.mockResolvedValue({ rows: [rideRow] })
  })

  it('requires an authenticated rider', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await GET()

    expect(res.status).toBe(401)
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns only the current rider on-demand receipts', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      rides: [
        {
          id: 12,
          bookingReference: 'RIDE-TEST1',
          status: 'completed',
          pickup: 'Aeropuerto JMC',
          destination: 'Provenza, Medellín',
          price: 12.5,
          currency: 'USD',
          createdAt: '2026-11-27 10:00:00',
          driver: {
            id: 3,
            name: 'Ana Driver',
            vehicle: 'SUV',
            plate: 'ABC123',
            rating: 4.8,
          },
        },
      ],
    })

    const call = mockExecute.mock.calls[0][0]
    expect(call.sql).toContain('o.clerk_user_id = ?')
    expect(call.sql).toContain("o.booking_reference LIKE 'RIDE-%'")
    expect(call.args).toEqual(['user_123'])
  })

  it('shows in-progress rides and tolerates rides without an assigned driver', async () => {
    mockExecute.mockResolvedValue({
      rows: [
        {
          ...rideRow,
          order_status: 'pending',
          assignment_status: 'en_route',
          driver_id: null,
          driver_name: null,
          driver_rating: null,
        },
      ],
    })

    const res = await GET()
    const body = await res.json()

    expect(body.rides[0].status).toBe('in_progress')
    expect(body.rides[0].driver).toBeNull()
  })

  it('fails closed when the database query fails', async () => {
    mockExecute.mockRejectedValue(new Error('db down'))

    const res = await GET()

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'server_error' })
  })
})
