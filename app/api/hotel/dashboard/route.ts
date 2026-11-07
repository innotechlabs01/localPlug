import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getHotelDashboardMetrics } from '@/lib/hotel/dashboard'

export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const metrics = await getHotelDashboardMetrics(result.hotel.id)

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('[Hotel Dashboard API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 })
  }
}
