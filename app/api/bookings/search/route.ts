import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    const canViewAll = (await requirePermission('reservations', 'view')) === null
    const sql = canViewAll
      ? `SELECT id, order_number, booking_reference, package_id, package_name, status, payment_status, dispatch_status, flight_number, airline, arrival_date, arrival_time, created_at
         FROM orders WHERE LOWER(airline) = ? AND LOWER(flight_number) = ? LIMIT 50`
      : `SELECT id, order_number, booking_reference, package_id, package_name, status, payment_status, dispatch_status, flight_number, airline, arrival_date, arrival_time, created_at
         FROM orders WHERE LOWER(airline) = ? AND LOWER(flight_number) = ? AND clerk_user_id = ? LIMIT 50`
    const args = canViewAll
      ? [airline.trim().toLowerCase(), flightNumber.trim().toLowerCase()]
      : [airline.trim().toLowerCase(), flightNumber.trim().toLowerCase(), userId]

    const result = await db.execute({ sql, args })

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
