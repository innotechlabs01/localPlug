import { NextResponse } from 'next/server'
import { ensureHotelProfile } from '@/lib/hotel/auth'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await ensureHotelProfile(clerkId)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'HOTEL_NOT_FOUND') {
      return NextResponse.json({
        error: 'hotel_not_found',
        message: 'No se encontró tu perfil de hotel. Contacte al administrador para que te registre.',
      }, { status: 404 })
    }
    console.error('[Hotel Ensure]', err)
    return NextResponse.json({ error: 'Failed to ensure hotel profile' }, { status: 500 })
  }
}
