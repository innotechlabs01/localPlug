import { NextResponse } from 'next/server'
import { getPayment, setPayment } from '@/lib/services/payment-service'
import { getTransaction } from '@/lib/paddle/server'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import type { PaymentRecord } from '@/lib/payment-record'

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { bookingReference, transactionId } = body as {
      bookingReference: string
      transactionId: string
    }

    if (!bookingReference || !transactionId) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    const txn = await getTransaction(transactionId)

    if (txn.status !== 'completed' && txn.status !== 'paid' && txn.status !== 'billed') {
      return NextResponse.json(
        { error: 'payment_not_succeeded', message: `Transaction status is ${txn.status}` },
        { status: 400 },
      )
    }

    const existing = await getPayment(bookingReference)
    const now = new Date().toISOString()
    const record: PaymentRecord = {
      booking_reference: bookingReference,
      package_id: existing?.package_id || '',
      package_name: existing?.package_name || '',
      amount: existing?.amount || 0,
      currency: existing?.currency || 'USD',
      status: 'completed',
      paddle_transaction_id: transactionId,
      paddle_webhook_event_id: '',
      customer_email: existing?.customer_email || '',
      customer_name: existing?.customer_name || '',
      customer_phone: existing?.customer_phone || '',
      error_message: null,
      created_at: existing?.created_at || now,
      updated_at: now,
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
