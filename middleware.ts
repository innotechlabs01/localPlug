import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if target is a protected admin or operational route
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isDispatchApi =
    pathname === '/api/bookings/driver-assigned' || pathname === '/api/bookings/delivery-completed'

  if (!isAdminPage && !isAdminApi && !isDispatchApi) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null

  // Allow service-to-service calls to dispatch APIs if authenticated via Bearer token
  if (isDispatchApi && !session) {
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.N8N_API_KEY || process.env.ADMIN_SESSION_SECRET
    if (expectedKey && authHeader === `Bearer ${expectedKey}`) {
      return NextResponse.next()
    }
  }

  if (!session) {
    if (isAdminPage) {
      const signInUrl = new URL('/sign-in', request.url)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/bookings/driver-assigned',
    '/api/bookings/delivery-completed',
  ],
}
