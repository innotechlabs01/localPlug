import { NextResponse } from 'next/server'
import { bookingStore } from '@/app/components/booking/lib/booking-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('[Booking]', JSON.stringify(body, null, 2))

    bookingStore.add(body)

    return NextResponse.json(
      { status: 'success', message: 'Booking confirmed. We will contact you via WhatsApp within 2 hours.' },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
