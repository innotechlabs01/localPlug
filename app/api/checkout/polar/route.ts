import { NextResponse } from 'next/server'
import { createPolar } from '@polar-sh/sdk/2026-04'
import { getConfigPackageGrandTotalCents, getConfigPackageName } from '@/lib/pricing'
import { getDefaultCurrency } from '@/lib/config'
import { hasPayment, setPayment, getPayment } from '@/lib/services/payment-service'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import type { PaymentRecord } from '@/lib/payment-record'

function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN || ''
  if (!accessToken) throw new Error('POLAR_ACCESS_TOKEN is not configured')
  return createPolar({
    accessToken,
    environment: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
  })
}

function getProductId(): string {
  const id = process.env.POLAR_PRODUCT_ID || ''
  if (!id) throw new Error('POLAR_PRODUCT_ID is not configured')
  return id
}

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const {
      bookingReference,
      packageId,
      customerEmail,
      customerName,
      customerPhone,
      needReturn,
      tour_ids = [],
      num_people = 1,
      flightNumber,
      airline,
      arrivalDate,
      arrivalTime,
      destinationAddress,
      returnDate,
      returnTime,
    } = body as {
      bookingReference: string
      packageId: string
      customerEmail: string
      customerName: string
      customerPhone?: string
      needReturn?: boolean
      tour_ids?: Array<number | string>
      num_people?: number
      flightNumber?: string
      airline?: string
      arrivalDate?: string
      arrivalTime?: string
      destinationAddress?: string
      returnDate?: string
      returnTime?: string
    }

    if (!bookingReference || !customerEmail || !customerName || !packageId) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    if (await hasPayment(bookingReference)) {
      const existing = await getPayment(bookingReference)
      if (existing?.status === 'completed' || existing?.status === 'pending') {
        return NextResponse.json(
          { error: 'duplicate_payment', message: 'This booking already has a payment in progress.' },
          { status: 409 },
        )
      }
    }

    const totalAmountCents = await getConfigPackageGrandTotalCents(
      packageId,
      !!needReturn,
      tour_ids.map(String),
      num_people,
    )
    const packageName = await getConfigPackageName(packageId)
    const currency = await getDefaultCurrency()
    const productId = getProductId()

    const polar = getPolarClient()

    const checkout = await polar.checkouts.create({
      products: [productId],
      prices: {
        [productId]: [
          {
            amount_type: 'fixed',
            price_amount: totalAmountCents,
            price_currency: 'usd',
          },
        ],
      },
      customer_email: customerEmail,
      customer_name: customerName,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking/confirmation?ref=${bookingReference}`,
      metadata: {
        booking_reference: bookingReference,
        package_id: packageId,
        package_name: packageName,
        customer_name: customerName,
        customer_email: customerEmail,
        need_return: String(!!needReturn),
        tour_ids: JSON.stringify(tour_ids),
        num_people: String(num_people),
        flight_number: body.flightNumber || '',
        airline: body.airline || '',
        arrival_date: body.arrivalDate || '',
        arrival_time: body.arrivalTime || '',
        destination_address: body.destinationAddress || '',
        return_date: body.returnDate || '',
        return_time: body.returnTime || '',
      },
      embed_origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    })

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      booking_reference: bookingReference,
      package_id: packageId,
      package_name: packageName,
      amount: totalAmountCents,
      currency,
      status: 'pending',
      paddle_transaction_id: checkout.id,
      paddle_webhook_event_id: '',
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone || '',
      error_message: null,
      created_at: now,
      updated_at: now,
    }
    await setPayment(record)

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      amount: totalAmountCents,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[Polar Checkout]', message)
    return NextResponse.json(
      { error: 'server_error', message },
      { status: 500 },
    )
  }
}
