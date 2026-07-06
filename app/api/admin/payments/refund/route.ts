import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { createPaddleRefund } from '@/lib/paddle/server'

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

    // Get the payment record
    const paymentResult = await db.execute({
      sql: 'SELECT * FROM payments WHERE booking_reference = ? AND status = ?',
      args: [booking_reference, 'completed']
    })

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or not eligible for refund' }, { status: 404 })
    }

    const payment = paymentResult.rows[0]
    const paddleTransactionId = payment.paddle_transaction_id as string | null
    const refundReason = reason || 'Admin refund'

    // If we have a Paddle transaction, process refund via Paddle
    if (paddleTransactionId) {
      try {
        const refund = await createPaddleRefund({
          transactionId: paddleTransactionId,
          reason: refundReason,
        })

        // Atomic update: all three tables in a single transaction
        // First UPDATE includes status check to prevent concurrent double refunds
        const results = await db.batch([
          {
            sql: `UPDATE payments SET status = 'refunded', refund_id = ?, refund_reason = ?, updated_at = datetime('now') WHERE booking_reference = ? AND status = 'completed'`,
            args: [refund.id, refundReason, booking_reference]
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
          refundId: refund.id,
          amount: payment.amount,
        })
      } catch (paddleError: unknown) {
        console.error('[Refund API] Paddle error:', paddleError)
        return NextResponse.json({
          error: 'Refund processing failed'
        }, { status: 500 })
      }
    }

    // Fallback: manual refund without Paddle
    const manualRefundId = `manual-${Date.now()}`
    const results = await db.batch([
      {
        sql: `UPDATE payments SET status = 'refunded', refund_id = ?, refund_reason = ?, updated_at = datetime('now') WHERE booking_reference = ? AND status = 'completed'`,
        args: [manualRefundId, reason || 'Admin manual refund', booking_reference]
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
      refundId: manualRefundId,
      amount: payment.amount,
      note: 'Manual refund processed (no Paddle transaction)',
    })
  } catch (error) {
    console.error('[Refund API] error:', error)
    return NextResponse.json({ error: 'Refund processing failed' }, { status: 500 })
  }
}
