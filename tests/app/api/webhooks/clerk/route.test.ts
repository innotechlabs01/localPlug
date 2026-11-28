import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockVerifyWebhook, mockGetDb, mockExecute } = vi.hoisted(() => ({
  mockVerifyWebhook: vi.fn(),
  mockGetDb: vi.fn(),
  mockExecute: vi.fn(),
}))

vi.mock('@clerk/nextjs/webhooks', () => ({
  verifyWebhook: mockVerifyWebhook,
}))

vi.mock('@/lib/db', () => ({
  getDb: mockGetDb,
}))

type PostHandler = (req: NextRequest) => Promise<Response>
type UserRow = { id: number; clerk_id: string; email: string; status: string; role_id: number }

describe('Clerk webhook user sync', () => {
  let POST: PostHandler
  let users: UserRow[]
  let roleGrants: Array<{ user_id: number; role_id: number }>

  beforeAll(async () => {
    vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_test')
    const route = await import('@/app/api/webhooks/clerk/route')
    POST = route.POST as PostHandler
  })

  beforeEach(() => {
    vi.clearAllMocks()
    users = []
    roleGrants = []
    mockExecute.mockImplementation(({ sql, args }: { sql: string; args: (string | number)[] }) => {
      if (sql.includes("SELECT id FROM roles WHERE name = 'viewer'")) {
        return Promise.resolve({ rows: [{ id: 4 }] })
      }
      if (sql.includes('FROM users u WHERE') || sql.includes('SELECT id, status FROM users')) {
        const clerkId = String(args[0])
        const email = String(args[1] ?? '').trim().toLowerCase()
        const row = users.find((u) => u.clerk_id === clerkId)
          || users.find((u) => u.email === email)
        return Promise.resolve({ rows: row ? [{ id: row.id, status: row.status }] : [] })
      }
      if (sql.includes('INSERT OR IGNORE INTO users')) {
        const id = users.length + 23
        users.push({
          id,
          clerk_id: String(args[0]),
          email: String(args[2]).trim().toLowerCase(),
          status: 'active',
          role_id: Number(args[3]),
        })
        return Promise.resolve({ rows: [], lastInsertRowid: id })
      }
      if (sql.includes('UPDATE users')) {
        if (sql.includes("status = 'inactive'")) {
          const row = users.find((u) => u.clerk_id === String(args[0]))
          if (row) row.status = 'inactive'
          return Promise.resolve({ rows: [] })
        }
        const id = Number(args[args.length - 1])
        const row = users.find((u) => u.id === id)
        if (row) {
          row.clerk_id = String(args[0])
          row.email = String(args[4]).trim().toLowerCase() || row.email
          row.status = String(args[5])
        }
        return Promise.resolve({ rows: [] })
      }
      if (sql.includes('SELECT id, role_id FROM users')) {
        const row = users.find((u) => u.clerk_id === String(args[0]))
        return Promise.resolve({ rows: row ? [{ id: row.id, role_id: row.role_id }] : [] })
      }
      if (sql.includes('DELETE FROM user_roles')) {
        roleGrants = roleGrants.filter((g) => !(g.user_id === Number(args[0]) && g.role_id === Number(args[1])))
        return Promise.resolve({ rows: [] })
      }
      if (sql.includes('INSERT OR IGNORE INTO user_roles')) {
        const grant = { user_id: Number(args[0]), role_id: Number(args[1]) }
        if (!roleGrants.some((g) => g.user_id === grant.user_id && g.role_id === grant.role_id)) {
          roleGrants.push(grant)
        }
        return Promise.resolve({ rows: [] })
      }
      return Promise.resolve({ rows: [] })
    })
    mockGetDb.mockReturnValue({ execute: mockExecute })
    mockVerifyWebhook.mockResolvedValue({
      type: 'user.created',
      data: {
        id: 'user_recreated',
        email_addresses: [{ email_address: 'karen@example.com' }],
        first_name: 'Karen',
        last_name: 'Jimenez',
      },
    })
  })

  const request = () => new NextRequest('http://localhost:3000/api/webhooks/clerk', {
    method: 'POST',
    body: '{}',
  })

  it('rejects requests with an invalid signature', async () => {
    mockVerifyWebhook.mockRejectedValueOnce(new Error('bad signature'))

    const res = await POST(request())

    expect(res.status).toBe(401)
    expect(mockGetDb).not.toHaveBeenCalled()
  })

  it('relinks a deleted/recreated Clerk user by email, reactivates the row and syncs user_roles', async () => {
    users.push({ id: 23, clerk_id: 'user_deleted', email: 'karen@example.com', status: 'inactive', role_id: 6 })
    roleGrants.push({ user_id: 23, role_id: 4 })

    const res = await POST(request())

    expect(res.status).toBe(200)
    const update = mockExecute.mock.calls.find(([stmt]) => String(stmt.sql).includes('UPDATE users'))
    expect(update?.[0].args).toEqual(['user_recreated', 'Karen Jimenez', 'Karen Jimenez', 'karen@example.com', 'karen@example.com', 'active', 23])
    expect(mockExecute.mock.calls.some(([stmt]) => String(stmt.sql).includes('INSERT OR IGNORE INTO users'))).toBe(false)
    expect(users[0]).toMatchObject({ clerk_id: 'user_recreated', status: 'active', role_id: 6 })
    expect(roleGrants).toEqual([{ user_id: 23, role_id: 6 }])
  })

  it('keeps an existing blocked user blocked and mirrors its DB role', async () => {
    mockVerifyWebhook.mockResolvedValueOnce({
      type: 'user.updated',
      data: {
        id: 'user_existing',
        email_addresses: [{ email_address: 'karen@example.com' }],
        first_name: 'Karen',
        last_name: 'Jimenez',
      },
    })
    users.push({ id: 23, clerk_id: 'user_existing', email: 'karen@example.com', status: 'blocked', role_id: 4 })

    await POST(request())

    const update = mockExecute.mock.calls.find(([stmt]) => String(stmt.sql).includes('UPDATE users'))
    expect(update?.[0].args).toContain('blocked')
    expect(users[0].status).toBe('blocked')
    expect(roleGrants).toEqual([{ user_id: 23, role_id: 4 }])
  })

  it('creates a new user as viewer and grants only the viewer role', async () => {
    const res = await POST(request())

    expect(res.status).toBe(200)
    const insert = mockExecute.mock.calls.find(([stmt]) => String(stmt.sql).includes('INSERT OR IGNORE INTO users'))
    expect(insert?.[0].args).toEqual(['user_recreated', 'Karen Jimenez', 'karen@example.com', 4])
    expect(users[0]).toMatchObject({ role_id: 4, status: 'active' })
    expect(roleGrants).toEqual([{ user_id: 23, role_id: 4 }])
    expect(mockExecute.mock.calls.some(([stmt]) => String(stmt.sql).includes('DELETE FROM user_roles'))).toBe(false)
  })

  it('preserves explicit extra grants when promoting away from viewer', async () => {
    users.push({ id: 23, clerk_id: 'user_existing', email: 'karen@example.com', status: 'active', role_id: 6 })
    roleGrants.push({ user_id: 23, role_id: 4 }, { user_id: 23, role_id: 7 })

    await POST(request())

    expect(roleGrants).toEqual([{ user_id: 23, role_id: 7 }, { user_id: 23, role_id: 6 }])
  })

  it('marks the DB row inactive on user.deleted', async () => {
    mockVerifyWebhook.mockResolvedValueOnce({
      type: 'user.deleted',
      data: { id: 'user_existing' },
    })
    users.push({ id: 23, clerk_id: 'user_existing', email: 'karen@example.com', status: 'active', role_id: 6 })

    const res = await POST(request())

    expect(res.status).toBe(200)
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining("status = 'inactive'"),
      args: ['user_existing'],
    }))
    expect(users[0].status).toBe('inactive')
    expect(users[0].role_id).toBe(6)
  })
})
