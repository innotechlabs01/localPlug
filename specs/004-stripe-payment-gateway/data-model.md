# Data Model: Stripe Payment Gateway

## Entities

### PaymentRecord

A JSON-serialized object representing a single payment transaction for a booking.
Stored in-memory in a `Map<string, PaymentRecord>` keyed by booking reference.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `bookingReference` | string | yes | UUID v4 | Links to the booking (generated client-side) |
| `packageId` | string | yes | One of: smooth-landing, first-24, full-insider | Selected VIP package ID |
| `packageName` | string | yes | Min 2 chars | Human-readable package name |
| `amount` | number | yes | > 0, matches package price | Amount in cents (Stripe convention) |
| `currency` | string | yes | ISO 4217 | Default: "usd" |
| `status` | string | yes | One of: pending, completed, failed, refunded | Transaction lifecycle state |
| `stripePaymentIntentId` | string | yes | Starts with "pi_" | Stripe PaymentIntent identifier |
| `stripeWebhookEventId` | string | no | Starts with "evt_" | Last processed Stripe webhook event ID |
| `customerEmail` | string | yes | Valid email format | From booking form profile data |
| `customerName` | string | yes | Min 2 chars | From booking form profile data |
| `errorMessage` | string | no | — | Human-readable error if failed |
| `createdAt` | string | yes | ISO 8601 timestamp | When payment record was created |
| `updatedAt` | string | yes | ISO 8601 timestamp | When payment record was last updated |

**Uniqueness constraint**: At most one `PaymentRecord` per `bookingReference` where
`status` is `completed` or `pending`.

**State transitions**:
```
pending → completed  (on payment_intent.succeeded webhook)
pending → failed     (on payment_intent.payment_failed webhook)
completed → refunded (via Stripe dashboard, future)
failed → pending     (if user retries payment for the same booking)
```

### PackagePricing

A server-side lookup table mapping package IDs to prices. Not a dynamic entity —
hardcoded values for MVP.

| Package ID | Name | Amount (USD) | Amount (cents) |
|-----------|------|-------------|----------------|
| `smooth-landing` | Smooth Landing | $49.00 | 4900 |
| `first-24` | First 24 Hours | $99.00 | 9900 |
| `full-insider` | Full Insider Access | $199.00 | 19900 |

## Server-Side Payment Store

An in-memory `Map<string, PaymentRecord>` keyed by booking reference.
Follows the same pattern as `booking-store.ts` from spec 003.

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Create PaymentIntent | POST | `/api/payments/create-intent` | Validates amount, checks duplicates |
| Handle webhook | POST | `/api/payments/webhook` | Verifies signature, creates/updates record |
| Query status | GET | `/api/payments/status?bookingRef=X` | Returns payment record or "no payment found" |

## Validation Rules

1. **Duplicate prevention**: Before creating a PaymentIntent, check if a PaymentRecord
   with `status: completed` or `status: pending` exists for the booking reference.
   Return 409 if duplicate.
2. **Amount validation**: Server-side lookup of package price. If the requested package
   price does not match the hardcoded value, return 400.
3. **Webhook idempotency**: Check if `stripeWebhookEventId` is already set on the
   PaymentRecord. If the event ID matches, skip processing (return 200 immediately).
4. **Signature verification**: Every webhook request must pass Stripe signature
   verification. Invalid signatures return 401 and are logged.
5. **Currency**: All amounts are in USD cents. No multi-currency support for MVP.
