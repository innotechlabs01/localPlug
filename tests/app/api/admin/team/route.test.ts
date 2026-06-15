import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET, POST } from '@/app/api/admin/team/route'
import { NextRequest } from 'next/server'
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

describe('admin team API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET', () => {
    it('returns employee list when authenticated', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [
          { id: 1, name: 'Alice', email: 'alice@test.com', status: 'active', roles: 'Admin', orders_assigned: 5 },
          { id: 2, name: 'Bob', email: 'bob@test.com', status: 'active', roles: 'Operator', orders_assigned: 3 },
        ]})
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveLength(2)
      expect(json[0].name).toBe('Alice')
      expect(json[0].roles).toBe('Admin')
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(requirePermission).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))

      const res = await GET()
      expect(res.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('creates employee with validation', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ lastInsertRowid: 42 })
        .mockResolvedValueOnce({ rows: [] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await POST(new NextRequest('http://localhost:3000/api/admin/team', {
        method: 'POST',
        body: JSON.stringify({ name: 'Charlie', email: 'charlie@test.com', role_id: 2 }),
      }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.id).toBe(42)
    })

    it('returns 400 when fields are missing', async () => {
      const res = await POST(new NextRequest('http://localhost:3000/api/admin/team', {
        method: 'POST',
        body: JSON.stringify({ name: 'Charlie' }),
      }))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Name, email, and role are required')
    })

    it('returns 409 when email already exists', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

      const res = await POST(new NextRequest('http://localhost:3000/api/admin/team', {
        method: 'POST',
        body: JSON.stringify({ name: 'Charlie', email: 'existing@test.com', role_id: 2 }),
      }))
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toBe('User with this email already exists')
    })

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(requirePermission).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))

      const res = await POST(new NextRequest('http://localhost:3000/api/admin/team', {
        method: 'POST',
        body: JSON.stringify({ name: 'Charlie', email: 'c@test.com', role_id: 2 }),
      }))
      expect(res.status).toBe(401)
    })
  })
})
