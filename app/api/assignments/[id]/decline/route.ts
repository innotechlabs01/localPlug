import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireWebhookAuth } from '@/lib/webhook-auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authError = requireWebhookAuth(req)
    if (authError) return authError

    const { id } = await params
    const assignmentId = Number(id)
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 })
    }

    const db = getDb()

    const assignmentResult = await db.execute({
      sql: 'SELECT * FROM assignments WHERE id = ?',
      args: [assignmentId],
    })

    if (!assignmentResult.rows.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const assignment = assignmentResult.rows[0]

    if (assignment.status !== 'pending_acceptance') {
      return NextResponse.json({
        error: `Assignment cannot be declined. Current status: ${assignment.status}`,
        status: assignment.status,
      }, { status: 409 })
    }

    let declineReason = ''
    try {
      const body = await req.json()
      declineReason = body.reason || body.declineReason || ''
    } catch {
      // no body is fine
    }

    const now = new Date().toISOString()

    await db.execute({
      sql: `UPDATE assignments
            SET status = 'declined', driver_declined_at = ?, decline_reason = ?, block_until = NULL, updated_at = ?
            WHERE id = ?`,
      args: [now, declineReason, now, assignmentId],
    })

    await db.execute({
      sql: "UPDATE orders SET dispatch_status = 'pending', assigned_to = NULL, assigned_at = NULL, updated_at = ? WHERE id = ?",
      args: [now, assignment.order_id],
    })

    return NextResponse.json({
      success: true,
      assignmentId,
      status: 'declined',
      declinedAt: now,
    })
  } catch (err) {
    console.error('[assignments decline POST]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
