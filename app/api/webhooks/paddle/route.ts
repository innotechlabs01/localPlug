import { NextResponse } from 'next/server'
import { Paddle } from '@paddle/paddle-node-sdk'
import { getDb } from '@/lib/db'
import { getPlatformFeePercent } from '@/lib/config'

function getPaddleClient() {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured')
  return new Paddle(apiKey)
}

function getWebhookSecret(): string {
  return process.env.PADDLE_WEBHOOK_SECRET || process.env.PADDLE_SANDBOX_WEBHOOK_SECRET || ''
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('paddle-signature')
    if (!signature) {
      return NextResponse.json({ error: 'missing_signature' }, { status: 401 })
    }

    const rawBody = await req.text()
    const secretKey = getWebhookSecret()
    if (!secretKey) {
      console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
    }

    const paddle = getPaddleClient()
    let event
    try {
      event = await paddle.webhooks.unmarshal(rawBody, secretKey, signature)
    } catch {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
    }

    if (event.eventType !== 'transaction.completed') {
      return NextResponse.json({ received: true })
    }

    const transaction = event.data as { id: string; custom_data?: Record<string, string> } | undefined
    if (!transaction) {
      return NextResponse.json({ error: 'missing_transaction_data' }, { status: 400 })
    }

    const transactionId = transaction.id
    const customData = transaction.custom_data
    const bookingReference = customData?.booking_reference

    if (!transactionId || !bookingReference) {
      return NextResponse.json({ error: 'missing_data' }, { status: 400 })
    }

    const db = getDb()
    const now = new Date().toISOString()

    // Get platform fee percentage from config (default 10%)
    const feeRate = await getPlatformFeePercent()

    // Calculate split
    let platformFeeCents = 0
    let hotelPayoutCents = 0
    let splitStatus = 'pending'

    // Use Paddle totals from the transaction details
    const totalAmount = (event.data as any)?.details?.totals?.total as number | undefined

    if (totalAmount && totalAmount > 0) {
      platformFeeCents = Math.round(totalAmount * feeRate)
      hotelPayoutCents = totalAmount - platformFeeCents
      splitStatus = 'completed'
    }

    // Update payment with split details
    await db.execute({
      sql: `UPDATE payments SET
        status = 'completed',
        paddle_webhook_event_id = ?,
        platform_fee_cents = ?,
        hotel_payout_cents = ?,
        split_status = ?,
        updated_at = ?
      WHERE booking_reference = ? AND status = 'pending'`,
      args: [
        transactionId,
        platformFeeCents,
        hotelPayoutCents,
        splitStatus,
        now,
        bookingReference
      ],
    })

    // Confirm the order if it already exists
    await db.execute({
      sql: `UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = ? WHERE booking_reference = ?`,
      args: [now, bookingReference],
    })

    console.log('[Paddle Webhook] Payment completed and order confirmed', { bookingReference, transactionId })

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[Paddle Webhook]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
