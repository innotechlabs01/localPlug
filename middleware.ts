import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { applyRateLimit, checkIpBanned, extractIp } from '@/lib/rate-limit'

function normalizeOrigin(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return undefined
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).origin
    } catch {
      return undefined
    }
  }
  const scheme = trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1') ? 'http' : 'https'
  try {
    return new URL(`${scheme}://${trimmed}`).origin
  } catch {
    return undefined
  }
}

function getAuthorizedParties(): string[] {
  const extra = (process.env.CLERK_AUTHORIZED_PARTIES || '')
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean) as string[]

  return Array.from(
    new Set(
      [
        normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
        'https://localplug.citocafecito.work',
        'https://local-plug.vercel.app',
        'http://localhost:3000',
        normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
        normalizeOrigin(process.env.VERCEL_BRANCH_URL),
        normalizeOrigin(process.env.VERCEL_URL),
        ...extra,
      ].filter(Boolean) as string[],
    ),
  )
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/booking/confirmation',
  '/mis-reservas',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/feedback',
  '/driver/offline',
  '/api/booking',
  '/api/flights/validate',
  '/api/webhooks/(.*)',
  '/api/checkout/(.*)',
  '/api/admin/lookup',
  '/api/chat/start',
  '/api/chat/send',
  '/api/chat/rating',
  '/api/chat/request-escalate',
  '/api/chat/close',
  '/api/ratings(.*)',
  '/api/hotels(.*)',
  '/api/promotions/validate(.*)',
  '/api/config',
  '/api/events',
  '/api/health(.*)',
  '/api/cron/(.*)',
  '/api/plans',
  '/api/trm',
  '/api/geocode',
  '/api/places/(.*)',
  '/api/rides/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/auth/callback',
])

const isAdminApiRoute = createRouteMatcher([
  '/api/admin/(.*)',
  '/api/chat/messages',
  '/api/chat/conversations',
  '/api/chat/agents',
  '/api/chat/escalate',
])
const isLookupRoute = createRouteMatcher(['/api/admin/lookup'])

const BODY_MAX_SIZE = 1024 * 1024 // 1MB

export default clerkMiddleware(
  async (auth, req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    })
  }

  const { pathname } = new URL(req.url)
  if (pathname.startsWith('/api/')) {
    const isOperationalPortalApi =
      pathname.startsWith('/api/admin/') ||
      pathname.startsWith('/api/driver/') ||
      pathname.startsWith('/api/hotel/') ||
      pathname.startsWith('/api/realtime/')

    if (!isOperationalPortalApi) {
      // Check IP ban first (escalating bans from repeated violations on public APIs)
      const ip = extractIp(req)
      const banResponse = await checkIpBanned(ip)
      if (banResponse) return banResponse

      const rateLimitRes = await applyRateLimit(req)
      if (rateLimitRes) return rateLimitRes
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
      if (contentLength > BODY_MAX_SIZE) {
        return NextResponse.json(
          { error: 'payload_too_large', message: 'Request body too large' },
          { status: 413 },
        )
      }
    }
  }

  if (isLookupRoute(req)) {
    return NextResponse.next()
  }

  // An authenticated visitor must never sit on the landing page or on a
  // sign-in form. The callback resolves the DB role and picks the portal.
  // The `auth` query param is the callback's error landing, so it is exempt
  // to avoid a redirect loop.
  const isLanding = pathname === '/'
  const isSignInPage = pathname.startsWith('/sign-in/')
  if (isLanding || isSignInPage) {
    const hasAuthStatus = new URL(req.url).searchParams.has('auth')
    if (!hasAuthStatus) {
      const authResult = await auth() as { userId: string | null }
      if (authResult.userId) {
        return NextResponse.redirect(new URL('/auth/callback', req.url))
      }
    }
  }

  // Clerk handles authentication ONLY (session verification).
  // Roles and permissions are resolved strictly against the Database in each portal/API.
  const isPortalPage =
    (pathname.startsWith('/admin') || pathname.startsWith('/hotel') || pathname.startsWith('/driver')) &&
    !pathname.startsWith('/api/')

  if (isPortalPage && !isPublicRoute(req)) {
    const authResult = await auth() as { userId: string | null }
    if (!authResult.userId) {
      const signInUrl = pathname.startsWith('/admin')
        ? '/sign-in/admin'
        : pathname.startsWith('/hotel') ? '/sign-in/hotel' : '/sign-in/driver'
      return NextResponse.redirect(new URL(signInUrl, req.url))
    }
    return NextResponse.next()
  } else if (isAdminApiRoute(req)) {
    const authResult = await auth() as { userId: string | null }
    const userId = authResult.userId
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  } else if (!isPublicRoute(req)) {
    await auth.protect()
  }
},
(req) => {
  // Forwarded host behind reverse proxy (Cloudflare Tunnel / Traefik / EasyPanel)
  // is allowed only for *.citocafecito.work or *.vercel.app or explicit allowlist
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const host = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || req.headers.get('host')?.trim() || ''
  const reqOrigin = normalizeOrigin(host ? `${proto}://${host}` : req.url)
  const isTrustedDynamicOrigin =
    reqOrigin &&
    (reqOrigin.endsWith('.citocafecito.work') ||
      reqOrigin.endsWith('.vercel.app') ||
      reqOrigin.endsWith('.innotechlabssas.lat') ||
      reqOrigin.startsWith('http://localhost:'))

  const parties = getAuthorizedParties()
  if (isTrustedDynamicOrigin && !parties.includes(reqOrigin)) {
    parties.push(reqOrigin)
  }
  return { authorizedParties: parties }
})

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = getAuthorizedParties()

  const isAllowed = allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, svix-id, svix-timestamp, svix-signature',
    'Access-Control-Max-Age': '86400',
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
