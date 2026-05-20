# Stripe Webhook Contract

## Overview

Stripe sends webhook events to the application after payment events (success, failure).
The webhook endpoint verifies the Stripe signature, processes the event idempotently,
and updates the payment record accordingly.

## POST /api/payments/webhook

### Request

- **Method**: POST
- **Content-Type**: `application/json` (raw body required for signature verification)
- **Headers**:
  - `stripe-signature`: Stripe webhook signature for verification
- **Body**: Raw JSON payload from Stripe (not pre-parsed by Next.js)

### Webhook Events Handled

| Event Type | Action |
|-----------|--------|
| `payment_intent.succeeded` | Create/update PaymentRecord with status `completed` |
| `payment_intent.payment_failed` | Create/update PaymentRecord with status `failed` |

### Success Response (200)

```typescript
interface WebhookResponse {
  received: true
}
```

### Error Response

| Status | Condition |
|--------|-----------|
| 401 | Stripe signature verification failed |
| 400 | Unknown event type or malformed payload |

### Configuration

The webhook endpoint uses `export const config = { api: { bodyParser: false } }` to
disable Next.js body parsing (required for raw body signature verification).

Stripe webhook signing secret is configured via environment variable:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Idempotency Processing

1. Extract `type` and `id` from the Stripe event
2. Check if a PaymentRecord already exists with `stripeWebhookEventId` matching the
   event's `id`
3. If already processed, return 200 immediately (no duplicate processing)
4. If not processed, look up the PaymentRecord by `bookingReference` (stored in
   `payment_intent.metadata.bookingReference`)
5. Update the PaymentRecord:
   - `payment_intent.succeeded`: Set status to `completed`, store event ID
   - `payment_intent.payment_failed`: Set status to `failed`, store event ID and error message
6. Return 200

### Stripe Metadata Convention

When creating the PaymentIntent, the server embeds the booking reference in metadata:

```json
{
  "metadata": {
    "bookingReference": "uuid-v4-here",
    "packageId": "smooth-landing"
  }
}
```

This allows the webhook handler to link Stripe events back to application records
without maintaining a separate mapping table.
