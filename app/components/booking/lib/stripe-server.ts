import Stripe from 'stripe'
import { getPackageName } from '@/lib/pricing'
import type { PaymentRecord, PaymentStatus } from './types'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key)
  }
  return _stripe
}

export async function createPaymentIntent(params: {
  bookingReference: string
  packageId: string
  amount: number
  currency: string
  customerEmail: string
  customerName: string
  flightNumber?: string
  airline?: string
  arrivalDate?: string
  arrivalTime?: string
  customerPhone?: string
  needReturn?: boolean
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    metadata: {
      bookingReference: params.bookingReference,
      packageId: params.packageId,
      packageName: getPackageName(params.packageId),
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      flightNumber: params.flightNumber || '',
      airline: params.airline || '',
      arrivalDate: params.arrivalDate || '',
      arrivalTime: params.arrivalTime || '',
      customerPhone: params.customerPhone || '',
      needReturn: params.needReturn ? 'true' : 'false',
    },
    automatic_payment_methods: { enabled: true },
  })

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')

  const stripe = getStripe()
  return stripe.webhooks.constructEvent(rawBody, signature, secret)
}

export function mapPaymentIntentStatus(
  intent: Stripe.PaymentIntent,
): PaymentStatus {
  switch (intent.status) {
    case 'succeeded':
      return 'completed'
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'processing':
      return 'pending'
    case 'canceled':
    case 'requires_capture':
    default:
      return 'failed'
  }
}

export function buildPaymentRecordFromWebhook(
  event: Stripe.Event,
  intent: Stripe.PaymentIntent,
): Omit<PaymentRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string } {
  const meta = intent.metadata
  return {
    bookingReference: meta.bookingReference || '',
    packageId: meta.packageId || '',
    packageName: getPackageName(meta.packageId || ''),
    amount: intent.amount,
    currency: intent.currency,
    status: mapPaymentIntentStatus(intent),
    stripePaymentIntentId: intent.id,
    stripeWebhookEventId: event.id,
    customerEmail: meta.customerEmail || '',
    customerName: meta.customerName || '',
    customerPhone: meta.customerPhone || undefined,
    errorMessage: intent.status === 'canceled' ? 'Payment was canceled' : undefined,
  }
}

