import { NextResponse } from 'next/server'
import { getPayment } from '@/app/components/booking/lib/payment-store'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const rateLimitResponse = rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(req.url)
  const bookingRef = searchParams.get('bookingRef')

  if (!bookingRef) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'bookingRef is required' },
      { status: 400 },
    )
  }

  const record = await getPayment(bookingRef)
  if (!record) {
    return NextResponse.json({
      bookingReference: bookingRef,
      status: 'no_payment',
    })
  }

  return NextResponse.json({
    bookingReference: record.bookingReference,
    packageId: record.packageId,
    packageName: record.packageName,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    stripePaymentIntentId: record.stripePaymentIntentId,
    customerEmail: record.customerEmail,
    customerName: record.customerName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })
}
