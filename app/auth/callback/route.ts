import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalDestination } from '@/lib/auth/portal'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_PORTALS = new Set(['admin', 'driver', 'hotel'])

/**
 * Single post-authentication destination. DB role decides the portal;
 * the optional `portal` param is only a sign-in fallback for unauthenticated
 * visitors and is never used to grant access.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const requestedPortal = req.nextUrl.searchParams.get('portal')
  const portal = requestedPortal && ALLOWED_PORTALS.has(requestedPortal) ? requestedPortal : null

  if (!userId) {
    return NextResponse.redirect(new URL(portal ? `/sign-in/${portal}` : '/sign-in/admin', req.url))
  }

  try {
    const result = await resolvePortalDestination()
    if ('error' in result) {
      return redirectWithStatus(req, result.error)
    }
    return NextResponse.redirect(new URL(result.destination, req.url))
  } catch (error) {
    console.error('[Auth] Failed to resolve portal destination', error)
    return redirectWithStatus(req, 'session_error')
  }
}

function redirectWithStatus(req: NextRequest, reason: string) {
  const landing = new URL('/', req.url)
  landing.searchParams.set('auth', reason)
  return NextResponse.redirect(landing)
}
