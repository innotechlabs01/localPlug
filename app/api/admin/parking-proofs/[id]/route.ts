import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requirePermission('payments', 'update')
    if (authError) return authError

    const { id } = await params
    const orderId = Number(id)
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const { userId: clerkId } = await auth()

    let status: string
    let reason: string | null = null
    try {
      const body = await request.json()
      status = body?.status
      reason = body?.reason ?? null
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
    }

    const db = getDb()

    // Resolve admin user id for audit trail
    const adminUser = await db.execute({
      sql: `SELECT id FROM users WHERE clerk_id = ?`,
      args: [clerkId || ''],
    })
    const reviewedBy = adminUser.rows[0]?.id as number | undefined

    const existing = await db.execute({
      sql: `SELECT parking_proof_url FROM orders WHERE id = ?`,
      args: [orderId],
    })
    if (existing.rows.length === 0 || !existing.rows[0]?.parking_proof_url) {
      return NextResponse.json({ error: 'No parking proof for this order' }, { status: 404 })
    }

    await db.execute({
      sql: `UPDATE orders
            SET parking_proof_status = ?, parking_proof_rejected_reason = ?,
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [status, reason, orderId],
    })

    return NextResponse.json({ success: true, status, reviewed_by: reviewedBy ?? null })
  } catch (err) {
    console.error('[admin parking-proof review]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
