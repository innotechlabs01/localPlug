import { NextResponse } from 'next/server'
import { createPaymentIntent } from '@/app/components/booking/lib/stripe-server'
import { getPayment, hasPayment, setPayment } from '@/app/components/booking/lib/payment-store'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { getConfigPackageName, getConfigPackagePriceCents, getConfigPackageTotalCents } from '@/lib/pricing'
import { getDefaultCurrency } from '@/lib/config'
import type { PaymentRecord } from '@/app/components/booking/lib/types'

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { bookingReference, packageId, customerEmail, customerName, customerPhone, flightNumber, airline, arrivalDate, arrivalTime, needReturn } = body as {
      bookingReference: string
      packageId: string
      customerEmail: string
      customerName: string
      customerPhone?: string
      flightNumber?: string
      airline?: string
      arrivalDate?: string
      arrivalTime?: string
      needReturn?: boolean
    }

    console.log('[Create Payment Intent] Received needReturn:', needReturn)

    if (!bookingReference || !packageId || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const baseAmount = await getConfigPackagePriceCents(packageId)
    if (baseAmount === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Invalid package ID' },
        { status: 400 },
      )
    }

    const amount = await getConfigPackageTotalCents(packageId, !!needReturn)

    if (await hasPayment(bookingReference)) {
      const existing = await getPayment(bookingReference)
      if (existing?.status === 'completed' || existing?.status === 'pending') {
        return NextResponse.json(
          { error: 'duplicate_payment', message: 'This booking already has a payment in progress.' },
          { status: 409 },
        )
      }
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      bookingReference,
      packageId,
      amount,
      currency: await getDefaultCurrency(),
      customerEmail,
      customerName,
      customerPhone,
      flightNumber,
      airline,
      arrivalDate,
      arrivalTime,
      needReturn,
    })

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      bookingReference,
      packageId,
      packageName: await getConfigPackageName(packageId),
      amount,
      currency: await getDefaultCurrency(),
      status: 'pending',
      stripePaymentIntentId: paymentIntentId,
      customerEmail,
      customerName,
      createdAt: now,
      updatedAt: now,
    }
    await setPayment(record)

    return NextResponse.json({ clientSecret, paymentIntentId, amount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      { error: 'server_error', message },
      { status: 500 },
    )
  }
}


