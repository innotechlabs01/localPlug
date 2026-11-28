import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/auth/callback/route'

const { mockAuth, mockResolvePortal } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResolvePortal: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/auth/portal', () => ({
  resolvePortalDestination: mockResolvePortal,
}))

const request = (query = '') => new NextRequest(`http://localhost:3000/auth/callback${query}`)

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
  })

  it('sends an authenticated admin to the admin portal regardless of the requested portal', async () => {
    mockResolvePortal.mockResolvedValue({ destination: '/admin', roleName: 'admin', hotelId: null })

    const res = await GET(request('?portal=driver'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/admin')
  })

  it('sends an authenticated driver to the driver portal', async () => {
    mockResolvePortal.mockResolvedValue({ destination: '/driver', roleName: 'driver', hotelId: null })

    const res = await GET(request('?portal=admin'))

    expect(res.headers.get('location')).toBe('http://localhost:3000/driver')
  })

  it('sends an authenticated hotel manager to the hotel portal', async () => {
    mockResolvePortal.mockResolvedValue({ destination: '/hotel', roleName: 'hotel_manager', hotelId: 9 })

    const res = await GET(request())

    expect(res.headers.get('location')).toBe('http://localhost:3000/hotel')
  })

  it('sends an authenticated customer to their reservations instead of a no-portal error', async () => {
    mockResolvePortal.mockResolvedValue({ destination: '/mis-reservas', roleName: 'customer', hotelId: null })

    const res = await GET(request())

    expect(res.headers.get('location')).toBe('http://localhost:3000/mis-reservas')
  })

  it('uses the requested sign-in page only when there is no session', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await GET(request('?portal=hotel'))

    expect(res.headers.get('location')).toBe('http://localhost:3000/sign-in/hotel')
    expect(mockResolvePortal).not.toHaveBeenCalled()
  })

  it('lands on the public site with a reason instead of looping when no portal role resolves', async () => {
    mockResolvePortal.mockResolvedValue({ error: 'no_portal_role', status: 403 })

    const res = await GET(request('?portal=admin'))

    expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=no_portal_role')
  })

  it('lands on the public site with a reason when role resolution fails', async () => {
    mockResolvePortal.mockRejectedValue(new Error('db down'))

    const res = await GET(request())

    expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=session_error')
  })
})
