import { NextResponse } from 'next/server'
import { ensureDriverProfile } from '@/lib/driver/auth'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const driver = await ensureDriverProfile(clerkId)
    return NextResponse.json({ driver })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'DRIVER_NOT_FOUND') {
      return NextResponse.json({
        error: 'driver_not_found',
        message: 'No se encontró tu perfil de conductor. Contacte al administrador para que te registre.',
      }, { status: 404 })
    }
    console.error('[Driver Ensure]', err)
    return NextResponse.json({ error: 'Failed to ensure driver profile' }, { status: 500 })
  }
}
