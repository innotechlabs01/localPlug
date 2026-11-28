import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
  '/api/flights/status',
  '/api/orders/(.*)',
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

export default clerkMiddleware(
  async (auth, req) => {
    const { pathname } = new URL(req.url)

    // Redirect usuarios autenticados fuera de landing / sign-in
    if ((pathname === '/' || pathname.startsWith('/sign-in/')) && !new URL(req.url).searchParams.has('auth')) {
      const { userId } = await auth()
      if (userId) {
        return NextResponse.redirect(new URL('/auth/callback', req.url))
      }
    }

    // Proteger páginas de portal (admin, driver, hotel)
    const isPortalPage =
      (pathname.startsWith('/admin') || pathname.startsWith('/hotel') || pathname.startsWith('/driver')) &&
      !pathname.startsWith('/api/')

    if (isPortalPage && !isPublicRoute(req)) {
      const { userId } = await auth()
      if (!userId) {
        const signInUrl = pathname.startsWith('/admin')
          ? '/sign-in/admin'
          : pathname.startsWith('/hotel') ? '/sign-in/hotel' : '/sign-in/driver'
        return NextResponse.redirect(new URL(signInUrl, req.url))
      }
      return NextResponse.next()
    }

    // Proteger rutas de API admin
    if (isAdminApiRoute(req)) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.next()
    }

    // Todo lo que no es público, proteger con auth
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
