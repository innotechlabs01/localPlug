import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'
import { recordMetric } from '@lp/events'

export const dynamic = 'force-dynamic'

/**
 * Advance a driver trip through its lifecycle.
 * Allowed transitions:
 *   accepted/confirmed_to_client -> en_route
 *   en_route                      -> pickedup (in_progress)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now()
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

    let nextStatus: string
    try {
      const body = await request.json()
      nextStatus = String(body?.status || '')
    } catch {
      return NextResponse.json({ error: 'status is required in the request body' }, { status: 400 })
    }

    if (nextStatus !== 'en_route' && nextStatus !== 'pickedup') {
      return NextResponse.json(
        { error: "status must be 'en_route' or 'pickedup'" },
        { status: 400 },
      )
    }

    const db = getDb()

    const existing = await db.execute({
      sql: `SELECT a.id, a.status, a.order_id, o.dispatch_status
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.id = ? AND a.driver_id = ?`,
      args: [assignmentId, driverId],
    })

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found or not yours' }, { status: 404 })
    }

    const row = existing.rows[0]
    const currentStatus = row?.status as string | undefined
    const orderId = row?.order_id as number | undefined
    if (!currentStatus || !orderId) {
      return NextResponse.json({ error: 'Assignment not found or not yours' }, { status: 404 })
    }

    // Validate transition
    if (nextStatus === 'en_route') {
      if (currentStatus !== 'accepted' && currentStatus !== 'confirmed_to_client') {
        return NextResponse.json(
          { error: `Cannot go en_route from status: ${currentStatus}` },
          { status: 409 },
        )
      }
    } else if (nextStatus === 'pickedup') {
      if (currentStatus !== 'en_route') {
        return NextResponse.json(
          { error: `Cannot mark picked up from status: ${currentStatus}` },
          { status: 409 },
        )
      }
    }

    // The pickedup state is stored as in_progress (column in_progress_at exists).
    const storedStatus = nextStatus === 'pickedup' ? 'in_progress' : 'en_route'
    const timestampCol = nextStatus === 'pickedup' ? 'in_progress_at' : 'en_route_at'
    const orderDispatchStatus = nextStatus === 'pickedup' ? 'in_progress' : 'en_route'

    await db.execute({
      sql: `UPDATE assignments
            SET status = ?, ${timestampCol} = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND driver_id = ?`,
      args: [storedStatus, assignmentId, driverId],
    })

    await db.execute({
      sql: `UPDATE orders SET dispatch_status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [orderDispatchStatus, orderId],
    })

    recordMetric('driver_trip_status_change', 1, {
      from: currentStatus,
      to: nextStatus,
    })

    return NextResponse.json({
      success: true,
      assignmentId,
      status: storedStatus,
      previousStatus: currentStatus,
    })
  } catch (err) {
    console.error('[driver trip status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    recordMetric('driver_trip_status_latency_ms', Date.now() - started)
  }
}