import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET, PUT } from '@/app/api/admin/dispatch/route'
import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user' })),
}))

vi.mock('@/lib/n8n/client', () => ({
  triggerDriverAssigned: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('admin dispatch API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET', () => {
    const mockRequest = (url: string) => new NextRequest(url)

    it('returns orders and drivers sorted by dispatch_status filter', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_name: 'John', dispatch_status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Driver A', status: 'available' }] })
        .mockResolvedValueOnce({ rows: [{ pending: 1, assigned: 0, enroute: 0, pickedup: 0 }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(mockRequest('http://localhost:3000/api/admin/dispatch'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.orders).toHaveLength(1)
      expect(json.drivers).toHaveLength(1)
      expect(json.counts.pending).toBe(1)
    })

    it('filters by search term', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 2, customer_name: 'Jane', flight_number: 'FL123' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ pending: 0, assigned: 0, enroute: 0, pickedup: 0 }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(mockRequest('http://localhost:3000/api/admin/dispatch?search=FL123'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.orders).toHaveLength(1)
    })

    it('returns counts (pending, assigned, enroute)', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 3, dispatch_status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ pending: 5, assigned: 3, enroute: 2, pickedup: 1 }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(mockRequest('http://localhost:3000/api/admin/dispatch'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.counts).toEqual({ pending: 5, assigned: 3, enroute: 2, pickedup: 1 })
    })

    it('returns empty arrays when no data matches', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ pending: 0, assigned: 0, enroute: 0, pickedup: 0 }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(mockRequest('http://localhost:3000/api/admin/dispatch?tab=enroute'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.orders).toHaveLength(0)
      expect(json.drivers).toHaveLength(0)
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)
      const mockExecute = vi.fn()
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET(mockRequest('http://localhost:3000/api/admin/dispatch'))
      expect(res.status).toBe(401)
    })
  })

  describe('PUT assign', () => {
    const mockRequest = (body: any) => new NextRequest('http://localhost:3000/api/admin/dispatch', {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    it('assigns a driver to an order', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Driver A', status: 'available' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_name: 'John', dispatch_status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ booking_reference: 'BK-TEST', customer_name: 'John', customer_phone: '+1234567890' }] })
        .mockResolvedValueOnce({ rows: [{ name: 'Driver A', vehicle: 'Sedan', plate: 'ABC-123' }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'assign', orderId: 1, driverId: 1 }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.action).toBe('assigned')
    })

    it('driver not found -> 404', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'assign', orderId: 1, driverId: 999 }))
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Driver not found')
    })

    it('order not found -> 404', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Driver A' }] })
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'assign', orderId: 999, driverId: 1 }))
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Order not found')
    })

    it('auth fails -> 401', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

      const res = await PUT(mockRequest({ action: 'assign', orderId: 1, driverId: 1 }))
      expect(res.status).toBe(401)
    })
  })

  describe('PUT unassign', () => {
    const mockRequest = (body: any) => new NextRequest('http://localhost:3000/api/admin/dispatch', {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    it('unassigns successfully', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ assigned_to: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'unassign', orderId: 1 }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.action).toBe('unassigned')
    })

    it('order not found -> 404', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'unassign', orderId: 999 }))
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Order not found')
    })
  })

  describe('PUT status', () => {
    const mockRequest = (body: any) => new NextRequest('http://localhost:3000/api/admin/dispatch', {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    it('updates status from pending to enroute', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'status', orderId: 1, status: 'enroute' }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.newStatus).toBe('enroute')
    })

    it('frees driver when status is completed', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ assigned_to: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await PUT(mockRequest({ action: 'status', orderId: 1, status: 'completed' }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.newStatus).toBe('completed')
    })

    it('invalid status -> 400', async () => {
      const res = await PUT(mockRequest({ action: 'status', orderId: 1, status: 'invalid_status' }))
      expect(res.status).toBe(400)
    })
  })

  describe('PUT unknown action', () => {
    it('returns 400 for unknown action', async () => {
      const res = await PUT(new NextRequest('http://localhost:3000/api/admin/dispatch', {
        method: 'PUT',
        body: JSON.stringify({ action: 'unknown' }),
      }))
      expect(res.status).toBe(400)
    })
  })
})
