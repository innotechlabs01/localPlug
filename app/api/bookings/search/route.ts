import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const flightNumber = searchParams.get('flightNumber')
  const airline = searchParams.get('airline')

  if (!flightNumber || !airline) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Both flightNumber and airline query parameters are required.' },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const result = await db.execute({
      sql: `SELECT * FROM orders WHERE LOWER(airline) = ? AND LOWER(flight_number) = ?`,
      args: [airline.trim().toLowerCase(), flightNumber.trim().toLowerCase()],
    })

    const orders = result.rows as Record<string, unknown>[]
    return NextResponse.json({ results: orders, count: orders.length })
  } catch (err) {
    console.error('[Bookings Search] Error:', err)
    return NextResponse.json(
      { error: 'SEARCH_ERROR', message: 'Search service unavailable' },
      { status: 500 },
    )
  }
}
