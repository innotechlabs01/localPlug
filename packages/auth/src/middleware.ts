// Middleware helpers for Clerk — used by Next.js middleware.
// Part of @lp/auth (B5A). No DB deps.

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ─── Type helpers ───
export type AuthResult = {
  userId: string | null
  sessionId: string | null
  orgId: string | null
}

// ─── Protect route (requires auth) ───
export async function protectRoute(): Promise<AuthResult> {
  const { userId, sessionId, orgId } = await auth()
  return { userId, sessionId: sessionId ?? null, orgId: orgId ?? null }
}

// ─── Require auth in middleware (redirects to sign-in) ───
export async function requireAuthMiddleware(
  req: NextRequest,
  signInUrl = '/sign-in',
): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) {
    const url = new URL(signInUrl, req.url)
    url.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(url)
  }
  return null
}

// ─── Optional auth (returns userId or null) ───
export async function optionalAuth(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

// ─── Check if route is public ───
export const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/webhooks/clerk',
  '/api/webhooks/n8n',
  '/api/webhooks/evolution',
  '/api/webhooks/paddle',
  '/api/health',
  '/api/config',
  '/api/flights/validate',
  '/api/geocode',
  '/opengraph-image',
  '/robots.txt',
  '/sitemap.xml',
] as const

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) =>
    route === pathname || pathname.startsWith(route.replace('/*', '/')),
  )
}

// ─── Admin API route check ───
export function isAdminApiRoute(req: NextRequest): boolean {
  return req.nextUrl.pathname.startsWith('/api/admin/')
}

// ─── Lookup route check (geocode, etc.) ───
export function isLookupRoute(req: NextRequest): boolean {
  const path = req.nextUrl.pathname
  return path.startsWith('/api/geocode') || path.startsWith('/api/flights/validate')
}