import { loadStripe, type Stripe } from '@stripe/stripe-js'

let _stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!_stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    _stripePromise = loadStripe(key || '')
  }
  return _stripePromise
}
