import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET, POST, PUT, DELETE } from '@/app/api/admin/reservations/route'
import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  return {
    ...actual,
    getDb: vi.fn(() => ({
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    })),
  }
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user' })),
}))

describe('admin reservations API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET', () => {
    it('returns all reservations with correct joins', async () => {
      const mockRow = {
        id: 1,
        order_number: 'ORD-001',
        booking_reference: 'BK-TEST',
        customer_name: 'John Doe',
        customer_email: 'john@test.com',
        customer_phone: '+1234567890',
        customer_country: 'US',
        customer_notes: 'Window seat',
        package_id: 'pkg1',
        package_name: 'Premium',
        package_price: 150,
        currency: 'usd',
        flight_number: 'AA100',
        airline: 'American Airlines',
        arrival_date: '2026-06-15',
        arrival_time: '14:30',
        return_date: '2026-06-20',
        return_time: '10:00',
        destination_address: '123 Main St',
        destination_has_place: 1,
        additional_trips: null,
        traveler_profile: null,
        status: 'confirmed',
        dispatch_status: 'pending',
        payment_status: 'completed',
        payment_id: 42,
        priority: 'normal',
        internal_notes: '',
        assigned_to: null,
        assigned_at: null,
        created_at: '2026-06-10T12:00:00Z',
        updated_at: '2026-06-10T12:00:00Z',
        driver_name: null,
        driver_phone: null,
        driver_status: null,
      }
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [mockRow] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(new NextRequest('http://localhost:3000/api/admin/reservations'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.reservations).toHaveLength(1)
      expect(json.total).toBe(1)
      expect(json.reservations[0].guest.firstName).toBe('John')
      expect(json.reservations[0].guest.lastName).toBe('Doe')
      expect(json.reservations[0].service.name).toBe('Premium')
      expect(json.reservations[0].flightInfo).toContain('AA100')
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

      const res = await GET(new NextRequest('http://localhost:3000/api/admin/reservations'))
      expect(res.status).toBe(401)
    })
  })

  describe('POST', () => {
    const validBody = {
      customer_name: 'Jane Doe',
      customer_email: 'jane@test.com',
      customer_phone: '+0987654321',
      package_id: 'pkg2',
      package_name: 'Standard',
      package_price: 100,
      arrival_date: '2026-07-01',
      arrival_time: '09:00',
      destination_address: '456 Oak Ave',
    }

    it('creates a reservation with validation', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ lastInsertRowid: 1 })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await POST(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'POST',
        body: JSON.stringify(validBody),
      }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.id).toBe(1)
      expect(json.orderNumber).toContain('ORD-')
      expect(json.bookingReference).toContain('BK-')
    })

    it('missing required fields -> 400', async () => {
      const res = await POST(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'POST',
        body: JSON.stringify({ customer_name: 'No Package' }),
      }))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

      const res = await POST(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'POST',
        body: JSON.stringify(validBody),
      }))
      expect(res.status).toBe(401)
    })
  })

  describe('PUT', () => {
    it('updates reservation fields', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, customer_name: 'Updated Name', status: 'confirmed' }),
      }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 400 when id is missing', async () => {
      const res = await PUT(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'PUT',
        body: JSON.stringify({ customer_name: 'No ID' }),
      }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when no fields to update', async () => {
      const res = await PUT(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'PUT',
        body: JSON.stringify({ id: 1 }),
      }))
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

      const res = await PUT(new NextRequest('http://localhost:3000/api/admin/reservations', {
        method: 'PUT',
        body: JSON.stringify({ id: 1, customer_name: 'Test' }),
      }))
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE', () => {
    it('cancels reservation', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await DELETE(new NextRequest('http://localhost:3000/api/admin/reservations?id=1'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 400 when id is missing', async () => {
      const res = await DELETE(new NextRequest('http://localhost:3000/api/admin/reservations'))
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

      const res = await DELETE(new NextRequest('http://localhost:3000/api/admin/reservations?id=1'))
      expect(res.status).toBe(401)
    })
  })
})
