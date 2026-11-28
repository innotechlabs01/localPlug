import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RideRow {
  id: number | string
  booking_reference: string | null
  order_status: string | null
  dispatch_status: string | null
  assignment_status: string | null
  destination_address: string | null
  customer_notes: string | null
  package_price: number | string | null
  currency: string | null
  created_at: string | null
  driver_id: number | string | null
  driver_name: string | null
  driver_vehicle: string | null
  driver_plate: string | null
  driver_rating: number | string | null
}

type RideStatus = 'requested' | 'in_progress' | 'completed' | 'cancelled'

function pickupFromNotes(notes: unknown): string | null {
  const match = String(notes || '').match(/^Recogida:\s*(.*?)(?:\s·\s|$)/)
  return match?.[1]?.trim() || null
}

function rideStatus(row: RideRow): RideStatus {
  const orderStatus = String(row.order_status || '')
  const assignmentStatus = String(row.assignment_status || '')

  if (orderStatus === 'cancelled' || assignmentStatus === 'cancelled') return 'cancelled'
  if (orderStatus === 'completed' || assignmentStatus === 'completed') return 'completed'
  if (['accepted', 'confirmed', 'en_route', 'in_progress', 'pickedup'].includes(assignmentStatus)) {
    return 'in_progress'
  }
  return 'requested'
}

/** Rider-facing receipt history. Reads DB-owned roles/ownership, never Clerk metadata. */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `
        SELECT
          o.id,
          o.booking_reference,
          o.status AS order_status,
          o.dispatch_status,
          o.destination_address,
          o.customer_notes,
          o.package_price,
          o.currency,
          o.created_at,
          d.id AS driver_id,
          d.name AS driver_name,
          d.vehicle AS driver_vehicle,
          d.plate AS driver_plate,
          d.rating AS driver_rating
        FROM orders o
        LEFT JOIN assignments a ON a.id = (
          SELECT a2.id
          FROM assignments a2
          WHERE a2.order_id = o.id
          ORDER BY CASE
            WHEN a2.status IN ('completed', 'in_progress', 'en_route', 'accepted', 'confirmed') THEN 0
            ELSE 1
          END, a2.id DESC
          LIMIT 1
        )
        LEFT JOIN drivers d ON d.id = a.driver_id
        WHERE o.clerk_user_id = ?
          AND (
            o.booking_reference LIKE 'RIDE-%'
            OR o.traveler_profile = 'on_demand'
            OR o.package_id LIKE 'on_demand_%'
          )
        ORDER BY datetime(o.created_at) DESC
        LIMIT 12
      `,
      args: [userId],
    })

    const rides = (result.rows as unknown as RideRow[]).map((row) => ({
      id: Number(row.id),
      bookingReference: row.booking_reference,
      status: rideStatus(row),
      pickup: pickupFromNotes(row.customer_notes),
      destination: row.destination_address,
      price: row.package_price == null ? null : Number(row.package_price),
      currency: row.currency || 'USD',
      createdAt: row.created_at,
      driver: row.driver_id
        ? {
            id: Number(row.driver_id),
            name: row.driver_name,
            vehicle: row.driver_vehicle,
            plate: row.driver_plate,
            rating: row.driver_rating == null ? null : Number(row.driver_rating),
          }
        : null,
    }))

    return NextResponse.json({ rides })
  } catch (err) {
    console.error('[GET /api/me/rides]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
