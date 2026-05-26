import { NextResponse } from 'next/server'
import { verifyWebhookSignature, buildPaymentRecordFromWebhook } from '@/app/components/booking/lib/stripe-server'
import { getPayment, setPayment } from '@/app/components/booking/lib/payment-store'
import { triggerPaymentConfirmation } from '@/lib/n8n/client'
import { getDb } from '@/lib/db'
import { getPackageName, getPackageTotal } from '@/lib/pricing'
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

  if (event.type === 'payment_intent.succeeded') {
    const customerEmail = intent.receipt_email || intent.metadata?.customerEmail || ''
    const customerName = intent.metadata?.customerName || ''
    const customerPhone = intent.metadata?.customerPhone || ''
    const packageName = intent.metadata?.packageName || ''
    const packageId = intent.metadata?.packageId || ''
    const flightNumber = intent.metadata?.flightNumber || ''
    const airline = intent.metadata?.airline || ''
    const arrivalDate = intent.metadata?.arrivalDate || ''
    const arrivalTime = intent.metadata?.arrivalTime || ''

    const db = getDb()

    let orderExists = false
    try {
      const checkResult = await db.execute({
        sql: 'SELECT id FROM orders WHERE booking_reference = ? LIMIT 1',
        args: [bookingRef],
      })
      orderExists = (checkResult.rows?.length ?? 0) > 0
    } catch (err) {
      console.error('[Stripe Webhook] Check order existence failed:', err)
    }

    if (!orderExists) {
      try {
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
        const needReturn = intent.metadata?.needReturn === 'true'
        const finalPrice = getPackageTotal(packageId, needReturn)

        await db.execute({
          sql: `INSERT INTO orders (
            order_number, booking_reference, customer_name, customer_email, customer_phone,
            package_id, package_name, package_price, currency,
            flight_number, airline, arrival_date, arrival_time,
            status, dispatch_status, payment_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            orderNumber,
            bookingRef,
            customerName || null,
            customerEmail || null,
            customerPhone || null,
            packageId,
            getPackageName(packageId),
            finalPrice,
            'usd',
            flightNumber || null,
            airline || null,
            arrivalDate || null,
            arrivalTime || null,
            'confirmed',
            'pending',
            'paid',
            now,
            now,
          ],
        })
        console.log('[Stripe Webhook] Order created from payment:', orderNumber)
      } catch (dbErr) {
        console.error('[Stripe Webhook] Create order from payment failed:', dbErr)
      }
    } else {
      try {
        await db.execute({
          sql: "UPDATE orders SET payment_status = 'paid', updated_at = datetime('now') WHERE booking_reference = ?",
          args: [bookingRef],
        })
      } catch (dbErr2) {
        console.error('[Stripe Webhook] Update order payment_status failed:', dbErr2)
      }
    }

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
    }).catch(err => console.error('[Stripe Webhook] n8n trigger failed:', err))

    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO conversations (user_identifier, user_name, user_email, status, booking_reference, channel)
              VALUES (?, ?, ?, 'ai_active', ?, 'web')`,
        args: [customerEmail, customerName, customerEmail, bookingRef],
      })
    } catch (dbErr) {
      console.error('[Stripe Webhook] Create conversation failed:', dbErr)
    }
  }

  return NextResponse.json({ received: true })
}
