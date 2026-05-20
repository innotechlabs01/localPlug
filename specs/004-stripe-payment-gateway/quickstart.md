# Quickstart: Stripe Payment Gateway

## What this feature adds

1. **Stripe Payment Intents integration** — guests can pay for VIP packages using an
   embedded card form (Stripe Elements) within the booking wizard
2. **Webhook-based payment confirmation** — payment is only confirmed after Stripe's
   `payment_intent.succeeded` webhook is received and verified
3. **Duplicate payment prevention** — each booking can only have one completed or
   pending payment
4. **JSON payment records** — payment data (package, status, customer info) stored
   in-memory for tracking and status queries
5. **Payment status endpoint** — `GET /api/payments/status?bookingRef=X` for
   querying payment state

## Key files

| File | Purpose |
|------|---------|
| `app/api/payments/create-intent/route.ts` | Creates Stripe PaymentIntent (POST) |
| `app/api/payments/webhook/route.ts` | Stripe webhook handler (POST) |
| `app/api/payments/status/route.ts` | Payment status query (GET) |
| `app/components/booking/step-payment.tsx` | Payment step in booking wizard |
| `app/components/booking/payment-form.tsx` | Stripe Elements card form |
| `app/components/booking/payment-confirmation.tsx` | Post-payment confirmation UI |
| `app/components/booking/lib/stripe-client.ts` | Stripe.js frontend initialization |
| `app/components/booking/lib/stripe-server.ts` | Stripe server-side helpers |
| `app/components/booking/lib/payment-store.ts` | In-memory payment record store |
| `app/components/booking/lib/types.ts` | Payment-related TypeScript types |

## Environment variables

```bash
# .env.local (required — Stripe test mode keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Get test keys from https://dashboard.stripe.com/test/apikeys

## Testing

```bash
pnpm test                       # Vitest component tests (existing + new)
pnpm test:watch                 # Watch mode
```

New test files:
- `app/components/booking/__tests__/payment-form.test.ts`
- `app/components/booking/__tests__/payment-webhook.test.ts`
- `app/components/booking/__tests__/payment-store.test.ts`

## Development

### Stripe test cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0025 0000 3155` | Requires 3D Secure |

### Simulating failures

```js
// Simulate webhook failure (payment stays pending)
localStorage.setItem('__mock_fail', 'true')

// Simulate Stripe API error on intent creation
localStorage.setItem('__mock_stripe_fail', 'true')
```

### Testing webhooks locally

Use Stripe CLI to forward webhooks to local dev server:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded
```

### Payment store resets

```
Restart the Next.js dev server — the payment store resets on server restart.
```

## Design tokens used (unchanged from 002/003)

- Colors: Slate Navy, Mountain Emerald, Golden Sol, Cool Slate
- Typography: Plus Jakarta Sans (headlines), Inter (body)
- Spacing: 8px base, 16px/24px/32px stacks
- Radii: 8px default, rounded-lg for cards
