import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/driver/assignments/[id]/status/route'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve({ driver: { id: 1 } }),
  ),
}))

vi.mock('@/lib/driver/auth', () => ({
  getDriverFromSession: mockAuth,
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))

vi.mock('@lp/events', () => ({
  recordMetric: vi.fn(),
}))

describe('driver trip status API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockRequest = (id: string, body: any) =>
    new NextRequest(`http://localhost:3000/api/driver/assignments/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

  const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('moves accepted assignment to en_route', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'accepted', order_id: 10 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await POST(mockRequest('1', { status: 'en_route' }), ctx('1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.status).toBe('en_route')
    expect(json.previousStatus).toBe('accepted')
  })

  it('moves en_route assignment to pickedup (in_progress)', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'en_route', order_id: 10 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await POST(mockRequest('1', { status: 'pickedup' }), ctx('1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('in_progress')
  })

  it('rejects en_route from an invalid status', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'completed', order_id: 10 }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await POST(mockRequest('1', { status: 'en_route' }), ctx('1'))
    expect(res.status).toBe(409)
  })

  it('rejects pickedup from an invalid status', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'accepted', order_id: 10 }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await POST(mockRequest('1', { status: 'pickedup' }), ctx('1'))
    expect(res.status).toBe(409)
  })

  it('returns 404 when assignment is not found', async () => {
    const mockExecute = vi.fn().mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await POST(mockRequest('999', { status: 'en_route' }), ctx('999'))
    expect(res.status).toBe(404)
  })

  it('rejects an unknown status value', async () => {
    const res = await POST(mockRequest('1', { status: 'wrong' }), ctx('1'))
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce({ error: 'Unauthorized', status: 401 })
    const res = await POST(mockRequest('1', { status: 'en_route' }), ctx('1'))
    expect(res.status).toBe(401)
  })
})