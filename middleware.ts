import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/api/booking',
  '/api/payments/(.*)',
  '/api/webhooks/(.*)',
  '/api/admin/lookup',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isAdminApiRoute = createRouteMatcher(['/api/admin/(.*)'])
const isLookupRoute = createRouteMatcher(['/api/admin/lookup'])

export default clerkMiddleware(async (auth, req) => {
  if (isLookupRoute(req)) {
    return NextResponse.next()
  }
  if (isAdminApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
