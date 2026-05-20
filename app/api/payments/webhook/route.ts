import { NextResponse } from 'next/server'
import { verifyWebhookSignature, buildPaymentRecordFromWebhook } from '@/app/components/booking/lib/stripe-server'
import { getPayment, setPayment } from '@/app/components/booking/lib/payment-store'
import { triggerPaymentConfirmation } from '@/lib/n8n/client'
import { getDb } from '@/lib/db'
import type { PaymentRecord } from '@/app/components/booking/lib/types'

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event
  try {
    event = verifyWebhookSignature(rawBody, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  if (event.type !== 'payment_intent.succeeded' && event.type !== 'payment_intent.payment_failed') {
    return NextResponse.json({ received: true })
  }

  const intent = event.data.object
  const bookingRef = intent.metadata?.bookingReference
  if (!bookingRef) {
    return NextResponse.json({ received: true })
  }

  const existing = await getPayment(bookingRef)
  if (existing?.stripeWebhookEventId === event.id) {
    return NextResponse.json({ received: true })
  }

  const data = buildPaymentRecordFromWebhook(event, intent)
  const now = new Date().toISOString()

  const record: PaymentRecord = {
    ...data,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  await setPayment(record)

  // On successful payment, trigger n8n payment confirmation workflow
  // and create chat conversation for the booking
  if (event.type === 'payment_intent.succeeded') {
    const customerEmail = intent.receipt_email || intent.metadata?.customerEmail || ''
    const customerName = intent.metadata?.customerName || ''
    const customerPhone = intent.metadata?.customerPhone || ''
    const packageName = intent.metadata?.packageName || ''
    const flightNumber = intent.metadata?.flightNumber || ''
    const airline = intent.metadata?.airline || ''
    const arrivalDate = intent.metadata?.arrivalDate || ''
    const arrivalTime = intent.metadata?.arrivalTime || ''

    // Trigger n8n payment confirmation
    triggerPaymentConfirmation({
      bookingReference: bookingRef,
      customerName,
      customerEmail,
      customerPhone,
      packageName,
      amount: intent.amount_received ? intent.amount_received / 100 : 0,
      flightNumber,
      airline,
      arrivalDate,
      arrivalTime,
    }).catch(err => console.error('[Payment Webhook] n8n trigger failed:', err))

    // Create chat conversation for the paying customer
    try {
      const db = getDb()
      await db.execute({
        sql: `INSERT OR IGNORE INTO conversations (user_identifier, user_name, user_email, status, booking_reference, channel)
              VALUES (?, ?, ?, 'ai_active', ?, 'web')`,
        args: [customerEmail, customerName, customerEmail, bookingRef],
      })
    } catch (dbErr) {
      console.error('[Payment Webhook] Create conversation failed:', dbErr)
    }
  }

  return NextResponse.json({ received: true })
}
