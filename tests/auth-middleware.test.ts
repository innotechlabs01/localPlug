import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth'
import { POST as signInPost } from '@/app/api/auth/sign-in/route'
import { POST as signOutPost } from '@/app/api/auth/sign-out/route'
import { middleware } from '@/middleware'

describe('Admin Authentication & Route Protection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Session Token Helpers (`lib/auth.ts`)', () => {
    it('creates and verifies a valid session token', async () => {
      const token = await createSessionToken('admin@localplug.com')
      const payload = await verifySessionToken(token)

      expect(payload).not.toBeNull()
      expect(payload?.email).toBe('admin@localplug.com')
      expect(payload?.role).toBe('admin')
      expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('rejects tampered tokens', async () => {
      const token = await createSessionToken('admin@localplug.com')
      const tampered = token.slice(0, -4) + 'abcd'
      expect(await verifySessionToken(tampered)).toBeNull()
    })

    it('rejects malformed tokens', async () => {
      expect(await verifySessionToken('')).toBeNull()
      expect(await verifySessionToken('no-period-token')).toBeNull()
    })
  })

  describe('Sign-in & Sign-out API routes', () => {
    it('rejects sign-in with invalid credentials', async () => {
      const req = new Request('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'bad' }),
      })

      const res = await signInPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Invalid email or password')
    })

    it('successfully signs in with valid credentials and sets HttpOnly cookie', async () => {
      const req = new Request('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@localplug.com', password: 'Admin@123' }),
      })

      const res = await signInPost(req)
      expect(res.status).toBe(200)
      const cookieHeader = res.headers.get('set-cookie')
      expect(cookieHeader).toContain(SESSION_COOKIE_NAME)
      expect(cookieHeader?.toLowerCase()).toContain('httponly')
    })

    it('signs out and clears the session cookie', async () => {
      const res = await signOutPost()
      expect(res.status).toBe(200)
      const cookieHeader = res.headers.get('set-cookie')
      expect(cookieHeader).toContain(SESSION_COOKIE_NAME)
      expect(cookieHeader).toContain('Max-Age=0')
    })
  })

  describe('Middleware Route Protection (`middleware.ts`)', () => {
    it('redirects unauthenticated browser requests for /admin to /sign-in', async () => {
      const req = new NextRequest('http://localhost:3000/admin/orders')
      const res = await middleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/sign-in')
    })

    it('returns 401 for unauthenticated API requests to /api/admin/orders', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/orders')
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns 401 for unauthenticated calls to dispatch API', async () => {
      const req = new NextRequest('http://localhost:3000/api/bookings/driver-assigned')
      const res = await middleware(req)

      expect(res.status).toBe(401)
    })

    it('allows access to /admin when valid session cookie is provided', async () => {
      const token = await createSessionToken('admin@localplug.com')
      const req = new NextRequest('http://localhost:3000/admin/orders', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      })

      const res = await middleware(req)
      expect(res.status).toBe(200)
    })

    it('allows access to public landing routes without session', async () => {
      const req = new NextRequest('http://localhost:3000/')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })
  })
})
