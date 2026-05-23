import { NextResponse } from 'next/server'
import { createPaymentIntent } from '@/app/components/booking/lib/stripe-server'
import { getPayment, hasPayment, setPayment } from '@/app/components/booking/lib/payment-store'
import type { PaymentRecord } from '@/app/components/booking/lib/types'

const PACKAGE_PRICES: Record<string, number> = {
  'smooth-landing': 8900,
  'first-24': 14900,
  'full-insider': 24900,
}

const RETURN_TRIP_CHARGE_CENTS = 4800

export async function POST(req: Request) {
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

    if (!bookingReference || !packageId || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const baseAmount = PACKAGE_PRICES[packageId]
    if (baseAmount === undefined) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Invalid package ID' },
        { status: 400 },
      )
    }

    const amount = baseAmount + (needReturn ? RETURN_TRIP_CHARGE_CENTS : 0)

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
      currency: 'usd',
      customerEmail,
      customerName,
      customerPhone,
      flightNumber,
      airline,
      arrivalDate,
      arrivalTime,
    })

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      bookingReference,
      packageId,
      packageName: getPackageName(packageId),
      amount,
      currency: 'usd',
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

function getPackageName(id: string): string {
  const names: Record<string, string> = {
    'smooth-landing': 'The VIP Arrival',
    'first-24': 'The 24h Insider',
    'full-insider': 'The Peace of Mind',
  }
  return names[id] || id
}
