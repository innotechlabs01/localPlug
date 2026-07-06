import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { applyRateLimit } from '@/lib/rate-limit'

const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
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
  '/api/assignments/(.*)',
  '/booking/confirmation',
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
  if (isAdminApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
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
