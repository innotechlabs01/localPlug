import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayment, setPayment } from '@/app/components/booking/lib/payment-store'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import type { PaymentRecord } from '@/app/components/booking/lib/types'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key)
}

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { bookingReference, paymentIntentId } = body as {
      bookingReference: string
      paymentIntentId: string
    }

    if (!bookingReference || !paymentIntentId) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const stripe = getStripe()
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'payment_not_succeeded', message: `PaymentIntent status is ${intent.status}` },
        { status: 400 },
      )
    }

    const existing = await getPayment(bookingReference)
    const now = new Date().toISOString()
    const record: PaymentRecord = {
      bookingReference,
      packageId: existing?.packageId || '',
      packageName: existing?.packageName || '',
      amount: existing?.amount || 0,
      currency: existing?.currency || 'usd',
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      customerEmail: existing?.customerEmail || '',
      customerName: existing?.customerName || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    await setPayment(record)

    return NextResponse.json({ status: 'completed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      { error: 'server_error', message },
      { status: 500 },
    )
  }
}
