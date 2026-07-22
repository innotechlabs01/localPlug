import { NextResponse } from 'next/server'
import { createTransaction } from '@/lib/paddle/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { planSlug, customerEmail, customerName, bookingReference } = body as {
      planSlug: string
      customerEmail: string
      customerName: string
      bookingReference: string
    }

    if (!planSlug || !customerEmail || !bookingReference) {
      return NextResponse.json(
        { error: 'Missing required fields: planSlug, customerEmail, bookingReference' },
        { status: 400 },
      )
    }

    const db = getDb()
    const planResult = await db.execute({
      sql: 'SELECT id, name, slug, price_usd FROM plans WHERE slug = ? AND is_active = 1',
      args: [planSlug],
    })

    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const plan = planResult.rows[0] as { id: number; name: string; slug: string; price_usd: number }
    const amountCents = Math.round(plan.price_usd * 100)

    const transaction = await createTransaction({
      items: [
        {
          description: plan.name,
          name: plan.name,
          unitPrice: { amount: String(amountCents), currencyCode: 'USD' },
          quantity: 1,
        },
      ],
      customData: { booking_reference: bookingReference, plan_slug: planSlug },
      customer: customerEmail ? { email: customerEmail, name: customerName || '' } : undefined,
    })

    return NextResponse.json({
      transactionId: transaction.id,
      amount: amountCents,
      planName: plan.name,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout'
    console.error('[Payments Checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
