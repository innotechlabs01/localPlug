# Research: Stripe Payment Gateway

## 1. Frontend Integration: Stripe Elements vs Stripe Checkout

**Decision**: Stripe Elements (embedded card form)

**Rationale**: The existing booking wizard is a multi-step form with a custom UI.
Stripe Checkout would redirect the user away from this flow to Stripe's hosted page,
breaking the UX continuity. Stripe Elements embeds directly into the booking form,
allowing the guest to complete payment without leaving the site. Elements also gives
full control over styling to match the design system (Slate Navy, Mountain Emerald, etc.).

**Alternatives considered**:
- **Stripe Checkout**: Simpler integration (hosted page), but redirect disrupts booking flow
- **Stripe Payment Element**: Good balance of embedded + smart defaults, chosen as the specific
  Elements component to use (handles cards, wallets, and local payment methods)

## 2. Payment Flow: Payment Intents API

**Decision**: Use the Payment Intents API with the following flow:

1. **Client → Server**: User clicks "Pay". Client sends booking reference + package ID to
   `/api/payments/create-intent`
2. **Server**: Validates booking exists, checks no duplicate payment, validates amount
   matches package price, calls `stripe.paymentIntents.create()` with idempotency key
   (`payment_booking_${bookingRef}`), returns `clientSecret` to frontend
3. **Client**: Uses `clientSecret` to confirm the payment via `stripe.confirmPayment()`
   with the Elements form
4. **Webhook**: Stripe sends `payment_intent.succeeded` or `payment_intent.payment_failed`
   to `/api/payments/webhook`. Server verifies webhook signature, processes idempotently
   (keyed on Stripe event ID), creates/updates JSON payment record
5. **Frontend**: Polls or the user is shown a "Processing..." state. When webhook arrives,
   the payment status endpoint returns the updated record

**Timeout strategy**: Frontend shows spinner for up to 60 seconds. If no webhook within
60 seconds, show "Payment received — we're confirming it now. Check back shortly."
using the payment status endpoint. Stripe's automatic webhook retries handle delivery
within 3 days.

**Race condition handling**: The webhook is the source of truth. If the frontend reports
success but webhook never arrives, no order is created. If webhook arrives after the
frontend timed out, the payment record is still created and the status endpoint will
reflect it.

## 3. Webhook Raw Body Handling in Next.js App Router

**Decision**: Use `export const config = { api: { bodyParser: false } }` in the webhook
route, read the raw body via `req.text()`, and verify the Stripe signature using
`stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`.

**Rationale**: Stripe requires the raw request body (not parsed JSON) for signature
verification. Next.js API routes parse JSON by default, so the body parser must be
disabled for the webhook endpoint. This is documented Stripe + Next.js best practice.

## 4. Idempotency Strategy

**Decision**: Two layers of idempotency:

1. **PaymentIntent creation**: Use Stripe's idempotency key (`payment_booking_${bookingRef}`)
   when creating the PaymentIntent. If the user retries (e.g., network issue), Stripe
   returns the same PaymentIntent instead of creating a new one.
2. **Webhook processing**: Key the payment record update on Stripe event ID
   (`stripeWebhookEventId`). If the same event arrives twice (Stripe retry), the system
   checks if `stripeWebhookEventId` is already recorded and skips processing.

## 5. Error Handling Patterns

| Scenario | Frontend Behavior | Backend Behavior |
|----------|------------------|-----------------|
| Card declined | Show Stripe error message, allow retry | No payment record created |
| Network error | Show "Connection error" with retry button | — |
| Duplicate payment | Show "This booking has already been paid" | Return 409 on create-intent |
| Amount mismatch | Show "Price has changed. Please review." | Return 400 on create-intent |
| Webhook timeout | Show "We're confirming your payment..." + status endpoint link | Webhook creates record when it arrives |
| Invalid webhook signature | — | Return 401, log security warning |
| `__mock_fail` set | Show simulated error | Return simulated failure |

## 6. Amount Validation

**Decision**: Server-side validation before creating PaymentIntent. The server:
1. Receives booking reference and package ID from the client
2. Looks up the selected package price from a server-side map of package IDs to prices
3. If no match or amount is invalid, returns 400 error
4. If match, creates PaymentIntent with the validated amount

**Package prices** (hardcoded server-side for MVP):
- `smooth-landing`: $49 USD
- `first-24`: $99 USD
- `full-insider`: $199 USD

## 7. Payment Record Store

**Decision**: Follow the exact same pattern as `booking-store.ts` — in-memory `Map<string, PaymentRecord>`
keyed by booking reference. Exposed via `GET /api/payments/status?bookingRef=X`.
Resets on server restart. No database dependency for MVP.

## 8. Testing Approach

| Layer | Tool | Tests |
|-------|------|-------|
| Unit | Vitest | Payment store CRUD, duplicate detection, amount validation |
| Integration | Vitest | Webhook handler with mocked Stripe events, create-intent endpoint |
| Component | Vitest + RTL | Payment form rendering, error display, success flow |
| Mock toggle | localStorage | `__mock_fail` simulates webhook failure, `__mock_stripe_fail` simulates card decline |
