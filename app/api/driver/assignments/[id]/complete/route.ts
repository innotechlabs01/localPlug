import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const driverId = result.driver.id

    const { id } = await params
    const assignmentId = Number(id)
    if (Number.isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 })
    }

    let airportParking = false
    let parkingProofUrl: string | null = null
    try {
      const body = await request.json()
      airportParking = Boolean(body?.airport_parking)
      parkingProofUrl = (body?.parking_proof_url as string | null) ?? null
    } catch {}

    if (airportParking && !parkingProofUrl) {
      return NextResponse.json({ error: 'parking_proof_url is required when airport_parking is true' }, { status: 400 })
    }

    const db = getDb()

    const existing = await db.execute({
      sql: `SELECT a.id, a.status, a.order_id, o.dispatch_status, o.parking_proof_url
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.id = ? AND a.driver_id = ?`,
      args: [assignmentId, driverId],
    })

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found or not yours' }, { status: 404 })
    }

    const row = existing.rows[0]
    const rowStatus = row?.status as string | undefined
    const orderIdRow = row?.order_id as number | undefined
    const existingProof = row?.parking_proof_url as string | null

    if (!row || !rowStatus || !orderIdRow) {
      return NextResponse.json({ error: 'Assignment not found or not yours' }, { status: 404 })
    }

    if (rowStatus === 'completed') {
      return NextResponse.json({ success: true, alreadyCompleted: true, airport_parking: airportParking })
    }
    if (rowStatus !== 'accepted' && rowStatus !== 'confirmed_to_client' && rowStatus !== 'en_route') {
      return NextResponse.json({ error: 'Assignment not in a completable state' }, { status: 409 })
    }

    const orderId = orderIdRow
    const proofUrl = airportParking ? parkingProofUrl : existingProof

    await db.execute({
      sql: `UPDATE assignments
            SET status = 'completed', completed_at = datetime('now'), block_until = NULL, updated_at = datetime('now')
            WHERE id = ? AND driver_id = ? AND status IN ('accepted', 'confirmed_to_client', 'en_route')`,
      args: [assignmentId, driverId],
    })

    await db.execute({
      sql: `UPDATE orders
            SET airport_parking = ?, parking_proof_url = ?, parking_proof_status = ?, dispatch_status = 'completed', updated_at = datetime('now')
            WHERE id = ?`,
      args: [airportParking ? 1 : 0, proofUrl, airportParking ? 'pending' : 'approved', orderId],
    })

    await db.execute({
      sql: `UPDATE drivers SET status = 'available', updated_at = datetime('now') WHERE id = ?`,
      args: [driverId],
    })

    return NextResponse.json({ success: true, completed: true, airport_parking: airportParking })
  } catch (err) {
    console.error('[driver complete-trip]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
