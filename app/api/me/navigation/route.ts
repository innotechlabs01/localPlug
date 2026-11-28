import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { canViewMyReservas } from '@/lib/auth/navigation'
import { resolveCurrentUser } from '@/lib/auth/resolve'

export const dynamic = 'force-dynamic'

/** Exposes only a landing-navigation decision; role stays authoritative in DB. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ canViewMyReservas: false }, { status: 401 })
  }

  const result = await resolveCurrentUser()
  if ('error' in result) {
    return NextResponse.json({ canViewMyReservas: false }, { status: result.status })
  }

  return NextResponse.json({ canViewMyReservas: canViewMyReservas(result.user.role_name) })
}
