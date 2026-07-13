import { NextResponse } from 'next/server'
import { createTransaction, formatPaddleAmount } from '@/lib/paddle/server'
import { getPayment, hasPayment, setPayment } from '@/lib/services/payment-service'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { getConfigPackageName, getConfigPackagePriceCents, getConfigPackageGrandTotalCents } from '@/lib/pricing'
import { getDefaultCurrency } from '@/lib/config'
import { calculatePlanTotal } from '@/lib/settings'
import type { PaymentRecord } from '@/lib/payment-record'

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { bookingReference, packageId, customerEmail, customerName, customerPhone, flightNumber, airline, arrivalDate, arrivalTime, needReturn, plan_id, tour_ids = [], num_people = 1 } = body as {
      bookingReference: string
      packageId?: string
      customerEmail: string
      customerName: string
      customerPhone?: string
      flightNumber?: string
      airline?: string
      arrivalDate?: string
      arrivalTime?: string
      needReturn?: boolean
      plan_id?: number
      tour_ids?: number[]
      num_people?: number
    }

    if (!bookingReference || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    if (!plan_id && !packageId) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Either plan_id or packageId is required' },
        { status: 400 },
      )
    }

    let totalAmountUsd: number
    let packageName: string
    let usedPackageId: string

    if (plan_id) {
      const { total, plan } = await calculatePlanTotal(plan_id, tour_ids, num_people)
      totalAmountUsd = total
      packageName = plan.name as string
      usedPackageId = `plan-${plan_id}`
    } else {
      const baseAmount = await getConfigPackagePriceCents(packageId!)
      if (baseAmount === 0) {
        return NextResponse.json(
          { error: 'invalid_request', message: 'Invalid package ID' },
          { status: 400 },
        )
      }
      totalAmountUsd = await getConfigPackageGrandTotalCents(packageId!, !!needReturn)
      packageName = await getConfigPackageName(packageId!)
      usedPackageId = packageId!
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

    const currency = await getDefaultCurrency()

    const items = [
      {
        description: packageName,
        name: usedPackageId,
        unitPrice: { amount: formatPaddleAmount(totalAmountUsd), currencyCode: currency },
        quantity: 1,
      },
    ]

    const txn = await createTransaction({
      items,
      customData: {
        booking_reference: bookingReference,
        package_id: usedPackageId,
        need_return: String(!!needReturn),
      },
      customer: { email: customerEmail, name: customerName },
    })

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      booking_reference: bookingReference,
      package_id: usedPackageId,
      package_name: packageName,
      amount: totalAmountUsd,
      currency,
      status: 'pending',
      paddle_transaction_id: txn.id,
      paddle_webhook_event_id: '',
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone || '',
      error_message: null,
      created_at: now,
      updated_at: now,
    }
    await setPayment(record)

    return NextResponse.json({ transactionId: txn.id, amount: totalAmountUsd })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      { error: 'server_error', message },
      { status: 500 },
    )
  }
}
