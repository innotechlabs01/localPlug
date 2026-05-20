# Stripe Checkout Session Metadata Schema

The app must include these metadata fields when creating a Stripe Checkout Session for booking payment.

## Required Metadata

```json
{
  "bookingReference": "BK-001",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "packageName": "Premium Airport Transfer",
  "flightNumber": "AV123",
  "airline": "Avianca",
  "arrivalDate": "2026-05-20",
  "arrivalTime": "14:30"
}
```

## Optional Metadata

```json
{
  "customerPhone": "+573001234567"
}
```

## Implementation Notes

1. The `customerPhone` field is OPTIONAL — if absent, n8n skips WhatsApp notifications (FR-017)
2. The phone number should use E.164 format (`+<country><number>`)
3. These metadata fields are set in the Stripe Checkout Session via `line_items` or `metadata` parameter in `createPaymentIntent()` or `stripe.checkout.sessions.create()`
4. The app backend reads these metadata fields from `intent.metadata` in the Stripe webhook handler and forwards them to n8n

## Where to Add customerPhone

In the booking flow where Stripe Checkout Session is created (likely `app/api/payments/create-intent/route.ts` or the booking form component), add:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... existing params
  metadata: {
    bookingReference,
    customerName,
    customerEmail,
    customerPhone,  // ← NEW: collected from booking form
    packageName,
    flightNumber,
    airline,
    arrivalDate,
    arrivalTime,
  },
})
```
