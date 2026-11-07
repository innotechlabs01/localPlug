import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('payments', 'update')
    if (authError) return authError

    const body = await req.json()
    const { booking_reference, reason } = body

    if (!booking_reference) {
      return NextResponse.json({ error: 'booking_reference required' }, { status: 400 })
    }

    const db = getDb()

    const paymentResult = await db.execute({
      sql: 'SELECT * FROM payments WHERE booking_reference = ? AND status = ?',
      args: [booking_reference, 'completed']
    })

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or not eligible for refund' }, { status: 404 })
    }

    const payment = paymentResult.rows[0]
    const refundId = `refund-${Date.now()}`
    const refundReason = reason || 'Admin refund'

    const results = await db.batch([
      {
        sql: `UPDATE payments SET status = 'refunded', refund_id = ?, refund_reason = ?, updated_at = datetime('now') WHERE booking_reference = ? AND status = 'completed'`,
        args: [refundId, refundReason, booking_reference]
      },
      {
        sql: `UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
        args: [booking_reference]
      },
      {
        sql: `UPDATE payments SET split_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
        args: [booking_reference]
      },
    ])

    if (results[0].rowsAffected === 0) {
      return NextResponse.json({ error: 'Payment already refunded or not eligible' }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      refundId,
      amount: payment.amount,
    })
  } catch (error) {
    console.error('[Refund API] error:', error)
    return NextResponse.json({ error: 'Refund processing failed' }, { status: 500 })
  }
}
