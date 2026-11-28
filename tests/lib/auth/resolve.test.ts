import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requirePortalRole } from '@/lib/auth/resolve'

const { mockAuth, mockClerkClient, mockExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockClerkClient: vi.fn(),
  mockExecute: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}))

function dbUser(roleName: string) {
  return {
    id: 8,
    clerk_id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
    role_id: 7,
    role_name: roleName,
    hotel_id: null,
    status: 'active',
  }
}

describe('requirePortalRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockClerkClient.mockResolvedValue({ users: { getUser: vi.fn() } })
  })

  it('accepts a DB super_admin in the admin portal', async () => {
    mockExecute.mockResolvedValue({ rows: [dbUser('super_admin')] })

    const result = await requirePortalRole('admin')

    expect(result).toMatchObject({ clerkId: 'user_123', user: { role_name: 'super_admin' } })
  })

  it('rejects a DB driver from the admin portal', async () => {
    mockExecute.mockResolvedValue({ rows: [dbUser('driver')] })

    const result = await requirePortalRole('admin')

    expect(result).toEqual({ error: 'wrong_portal', status: 403 })
  })
})
