import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getHotelReservations, getHotelReservationStats } from '@/lib/hotel/reservations'

export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const reservations = await getHotelReservations(result.hotel.id)
    const stats = await getHotelReservationStats(result.hotel.id)

    return NextResponse.json({ reservations, stats, total: reservations.length })
  } catch (error) {
    console.error('[Hotel Reservations API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}
