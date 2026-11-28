import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/admin/hotels/route'

const { mockCreateUser, mockExecute, mockRequirePermission } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockExecute: vi.fn(),
  mockRequirePermission: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(() => Promise.resolve({ users: { createUser: mockCreateUser } })),
}))

vi.mock('@/lib/admin/permissions', () => ({
  requirePermission: mockRequirePermission,
}))

vi.mock('@/lib/admin/hotel-auth', () => ({
  resolveHotelContext: vi.fn(() => Promise.resolve({ hotelId: null, isAdmin: true, roleName: 'admin' })),
}))

vi.mock('@/lib/n8n/client', () => ({
  triggerManagerCreated: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
  buildSafeUpdate: vi.fn(() => ({ setClauses: [], args: [] })),
}))

describe('admin hotel creation', () => {
  const request = () => new Request('http://localhost:3000/api/admin/hotels', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Hotel Prueba',
      manager_name: 'Ana Garcia',
      manager_email: 'ana@example.com',
      manager_password: 'temp-pass',
    }),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue(undefined)
    mockCreateUser.mockResolvedValue({ id: 'user_hotel_new' })
    mockExecute.mockResolvedValue({ rows: [], lastInsertRowid: 0 })
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [], lastInsertRowid: 9 })
      .mockResolvedValueOnce({ rows: [
        { id: 4, name: 'viewer' },
        { id: 5, name: 'hotel_manager' },
      ] })
  })

  it('upserts the viewer row created by the webhook and assigns hotel_manager', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ id: 23 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await POST(request())

    expect(res.status).toBe(200)
    const updateUser = mockExecute.mock.calls.find(([stmt]) => String(stmt.sql).includes('UPDATE users'))
    expect(updateUser?.[0].args).toEqual(['user_hotel_new', 'Ana Garcia', 'ana@example.com', 5, 9, 23])
    expect(mockExecute.mock.calls).toEqual(expect.arrayContaining([
      [expect.objectContaining({
        sql: expect.stringContaining('DELETE FROM user_roles'),
        args: [23, 4],
      })],
      [expect.objectContaining({
        sql: expect.stringContaining('INSERT OR IGNORE INTO user_roles'),
        args: [23, 5],
      })],
    ]))
    expect(mockExecute.mock.calls.some(([stmt]) => String(stmt.sql).includes('INSERT INTO users'))).toBe(false)
  })

  it('creates the manager row when neither webhook nor admin created it', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [], lastInsertRowid: 24 })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await POST(request())

    expect(res.status).toBe(200)
    const insertUser = mockExecute.mock.calls.find(([stmt]) => String(stmt.sql).includes('INSERT INTO users'))
    expect(insertUser?.[0].args).toEqual(['user_hotel_new', 'Ana Garcia', 'ana@example.com', 5, 9])
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('INSERT OR IGNORE INTO user_roles'),
      args: [24, 5],
    }))
  })
})
