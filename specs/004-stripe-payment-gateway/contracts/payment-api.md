# Payment API Contract

## Overview

Two server-side endpoints handle payment flow: PaymentIntent creation and payment
status querying. The webhook endpoint is documented separately in `webhook-contract.md`.

## POST /api/payments/create-intent

Creates a Stripe PaymentIntent for the selected VIP package. Performs duplicate
check and amount validation server-side before creating the intent.

### Request

```typescript
interface CreatePaymentIntentRequest {
  bookingReference: string   // UUID v4, generated client-side
  packageId: string          // One of: smooth-landing, first-24, full-insider
  customerEmail: string      // Email from booking form
  customerName: string       // Name from booking form
}
```

### Success Response (200)

```typescript
interface CreatePaymentIntentResponse {
  clientSecret: string       // Stripe clientSecret for frontend confirmation
  paymentIntentId: string    // Stripe PaymentIntent ID (pi_...)
  amount: number             // Amount in cents (confirmed server-side)
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid or missing parameters, or amount validation failed | `{ error: "invalid_request", message: "..." }` |
| 409 | Booking already has a completed or pending payment | `{ error: "duplicate_payment", message: "This booking already has a payment in progress." }` |
| 500 | Stripe API error or internal error | `{ error: "server_error", message: "..." }` |

### Idempotency

The endpoint should use Stripe's idempotency key when creating the PaymentIntent.
The key is `payment_intent_${bookingReference}`. If the same request is retried,
Stripe returns the same PaymentIntent rather than creating a new one.

## GET /api/payments/status

Returns the payment record for a given booking reference, or a "no payment found" response.

### Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `bookingRef` | yes | string | Booking reference UUID |

### Success Response (200)

```typescript
interface PaymentStatusResponse {
  bookingReference: string
  packageId: string
  packageName: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripePaymentIntentId: string
  customerEmail: string
  customerName: string
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}
```

### No Payment Found (200)

```typescript
interface NoPaymentResponse {
  bookingReference: string
  status: 'no_payment'
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `bookingRef` parameter | `{ error: "invalid_request", message: "bookingRef is required" }` |
