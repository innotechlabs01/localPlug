import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET } from '@/app/api/admin/orders/route'
import { NextRequest, NextResponse } from 'next/server'
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

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user' })),
}))

describe('admin orders API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockRequest = (url: string) => new NextRequest(url)

  it('returns orders with payment_status join', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [
        { id: 1, order_number: 'ORD-001', customer_name: 'John', status: 'confirmed', payment_status: 'completed' },
        { id: 2, order_number: 'ORD-002', customer_name: 'Jane', status: 'pending', payment_status: 'pending' },
      ]})
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].order_number).toBe('ORD-001')
  })

  it('filters by status', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'confirmed' }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders?status=confirmed'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })

  it('filters by priority', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, priority: 'urgent' }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders?priority=urgent'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })

  it('filters by search term', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, customer_name: 'John', order_number: 'ORD-001' }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders?search=John'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })

  it('returns empty array when no orders match', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders?status=cancelled'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(0)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requirePermission).mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))

    const res = await GET(mockRequest('http://localhost:3000/api/admin/orders'))
    expect(res.status).toBe(401)
  })
})
