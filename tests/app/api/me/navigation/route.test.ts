import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/me/navigation/route'

const { mockAuth, mockResolveCurrentUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResolveCurrentUser: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/auth/resolve', () => ({
  resolveCurrentUser: mockResolveCurrentUser,
}))

const resolvedUser = (roleName: string) => ({
  user: {
    id: 1,
    clerk_id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
    role_id: 4,
    role_name: roleName,
    hotel_id: null,
    status: 'active',
  },
  clerkId: 'user_123',
})

describe('GET /api/me/navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
  })

  it('returns 401 for anonymous visitors', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await GET()

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ canViewMyReservas: false })
  })

  it('allows customer-facing roles', async () => {
    mockResolveCurrentUser.mockResolvedValue(resolvedUser('customer'))

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ canViewMyReservas: true })
  })

  it('allows viewer role used by newly registered customers', async () => {
    mockResolveCurrentUser.mockResolvedValue(resolvedUser('viewer'))

    const res = await GET()

    await expect(res.json()).resolves.toEqual({ canViewMyReservas: true })
  })

  it('hides the link from operational roles', async () => {
    mockResolveCurrentUser.mockResolvedValue(resolvedUser('super_admin'))

    const res = await GET()

    await expect(res.json()).resolves.toEqual({ canViewMyReservas: false })
  })

  it('fails closed when the DB user cannot be resolved', async () => {
    mockResolveCurrentUser.mockResolvedValue({ error: 'contact_admin', status: 403 })

    const res = await GET()

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ canViewMyReservas: false })
  })
})
