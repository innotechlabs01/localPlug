import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authError = await requirePermission('payments', 'update')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const db = getDb()

    const result = await db.execute({
      sql: `SELECT
              o.id, o.order_number, o.booking_reference, o.customer_name,
              o.package_name, o.package_price, o.currency,
              o.arrival_date, o.arrival_time, o.destination_address,
              o.airport_parking, o.parking_proof_url, o.parking_proof_status,
              o.parking_proof_rejected_reason, o.created_at, o.updated_at,
              d.name as driver_name, d.plate as driver_plate,
              pay.status as payment_status
            FROM orders o
            LEFT JOIN drivers d ON o.assigned_to = d.id
            LEFT JOIN payments pay ON o.booking_reference = pay.booking_reference
            WHERE o.parking_proof_url IS NOT NULL
              AND o.parking_proof_status = ?
            ORDER BY o.created_at DESC
            LIMIT 100`,
      args: [status],
    })

    return NextResponse.json({ proofs: result.rows })
  } catch (err) {
    console.error('[admin parking-proofs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
