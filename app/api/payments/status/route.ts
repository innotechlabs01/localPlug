import { NextResponse } from 'next/server'
import { getPayment } from '@/lib/services/payment-service'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
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
    bookingReference: record.booking_reference,
    packageId: record.package_id,
    packageName: record.package_name,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    paddleTransactionId: record.paddle_transaction_id,
    customerEmail: record.customer_email,
    customerName: record.customer_name,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  })
}
