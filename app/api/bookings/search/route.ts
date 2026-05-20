import { NextRequest, NextResponse } from 'next/server'
import { bookingStore } from '@/app/components/booking/lib/booking-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flightNumber = searchParams.get('flightNumber')
  const airline = searchParams.get('airline')

  if (!flightNumber || !airline) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Both flightNumber and airline query parameters are required.' },
      { status: 400 },
    )
  }

  const results = bookingStore.search(airline, flightNumber)

  return NextResponse.json({ results, count: results.length })
}
