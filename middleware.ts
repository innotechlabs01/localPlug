import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { applyRateLimit } from '@/lib/rate-limit'
import { getDb } from '@/lib/db'

const AUTHORIZED_PARTIES = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://localplug.vercel.app',
  'http://localhost:3000',
].filter(Boolean) as string[]

const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/booking/confirmation',
  '/api/booking',
  '/api/payments/status',
  '/api/payments/create-intent',
  '/api/payments/confirm',
  '/api/flights/validate',
  '/api/bookings/search',
  '/api/webhooks/(.*)',
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
  '/api/health(.*)',
  '/api/cron/(.*)',
  '/api/plans',
  '/api/trm',
  '/api/geocode',
  '/sign-in(.*)',
  '/sign-up(.*)',
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

export default clerkMiddleware(async (auth, req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    })
  }

  const { pathname } = new URL(req.url)
  if (pathname.startsWith('/api/')) {
    const rateLimitRes = await applyRateLimit(req)
    if (rateLimitRes) return rateLimitRes

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

  // Strict role-based portal separation (page routes only, not /api/)
  const isPortalPage =
    (pathname.startsWith('/admin') || pathname.startsWith('/hotel') || pathname.startsWith('/driver')) &&
    !pathname.startsWith('/api/')

  if (isPortalPage && !isPublicRoute(req)) {
    const { userId } = await auth({ authorizedParties: AUTHORIZED_PARTIES })
    if (!userId) {
      const signInUrl = pathname.startsWith('/admin')
        ? '/sign-in/admin'
        : pathname.startsWith('/hotel') ? '/sign-in/hotel' : '/sign-in/driver'
      return NextResponse.redirect(new URL(signInUrl, req.url))
    }

    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const role = clerkUser.publicMetadata?.role as string | undefined

      const portalForRole: Record<string, string> = {
        admin: '/admin',
        hotel_manager: '/hotel',
        driver: '/driver',
      }

      if (role && portalForRole[role]) {
        const expectedPortal = portalForRole[role]
        if (!pathname.startsWith(expectedPortal)) {
          return NextResponse.redirect(new URL(expectedPortal, req.url))
        }
      } else {
        // No role in Clerk metadata — try to auto-detect from DB
        try {
          const db = getDb()
          let detectedRole: string | null = null

          if (pathname.startsWith('/driver')) {
            const result = await db.execute({
              sql: `SELECT id FROM drivers WHERE clerk_user_id = ? AND status = 'active'`,
              args: [userId],
            })
            if (result.rows.length > 0) detectedRole = 'driver'
          } else if (pathname.startsWith('/hotel')) {
            const result = await db.execute({
              sql: `SELECT id FROM hotel_managers WHERE clerk_user_id = ? AND status = 'active'`,
              args: [userId],
            })
            if (result.rows.length > 0) detectedRole = 'hotel_manager'
          }

          if (detectedRole) {
            // Fix Clerk metadata for future requests
            client.users.updateUser(userId, {
              publicMetadata: { ...clerkUser.publicMetadata, role: detectedRole },
            }).catch(() => {})
          }
        } catch {
          // DB check failed — let through
        }
      }
    } catch {
      // Clerk fetch failed — let through; API handlers will reject
    }
  }

  if (isAdminApiRoute(req)) {
    const { userId } = await auth({ authorizedParties: AUTHORIZED_PARTIES })
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }
  if (!isPublicRoute(req)) {
    await auth.protect({ authorizedParties: AUTHORIZED_PARTIES })
  }
})

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://localplug.vercel.app',
    'http://localhost:3000',
  ].filter(Boolean) as string[]

  const isAllowed = allowedOrigins.some(o => origin.startsWith(o))
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
