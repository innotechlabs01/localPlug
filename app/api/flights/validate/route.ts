import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const airline = searchParams.get('airline')
  const flightNumber = searchParams.get('flightNumber')

  if (!airline || !flightNumber) {
    return NextResponse.json(
      { valid: false, error: 'Missing required fields' },
      { status: 400 },
    )
  }

  const trimmedAirline = airline.trim().toLowerCase()
  const trimmedFlight = flightNumber.trim().toUpperCase()

  try {
    const db = getDb()
    const result = await db.execute({
      sql: `SELECT DISTINCT airline, flight_number FROM orders WHERE LOWER(airline) = ? AND LOWER(flight_number) = ? LIMIT 1`,
      args: [trimmedAirline, trimmedFlight],
    })

    if (result.rows.length > 0) {
      const row = result.rows[0]
      return NextResponse.json({
        valid: true,
        airlineName: row.airline as string,
        flightNumber: row.flight_number as string,
      })
    }

    return NextResponse.json({ valid: false })
  } catch (err) {
    console.error('[Flight Validate] Error:', err)
    return NextResponse.json(
      { valid: false, error: 'Validation service unavailable' },
      { status: 500 },
    )
  }
}
