# n8n Trigger Events (App → n8n)

All events POST to `https://agent-ia.innotechlabssas.lat/webhook/{event}` with `Authorization: Bearer ${N8N_API_KEY}` header.

## Common Envelope

```json
{
  "event": "<event_type>",
  "data": { ... },
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

## payment-confirmed

**Trigger**: App Stripe webhook handler on `payment_intent.succeeded`

```json
{
  "event": "payment-confirmed",
  "data": {
    "type": "payment_confirmation",
    "booking": {
      "bookingReference": "BK-001",
      "customerName": "Juan Pérez",
      "customerEmail": "juan@example.com",
      "customerPhone": "+573001234567",
      "packageName": "Premium Airport Transfer",
      "amount": 45000,
      "currency": "COP",
      "flightNumber": "AV123",
      "airline": "Avianca",
      "arrivalDate": "2026-05-20",
      "arrivalTime": "14:30"
    }
  },
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

## driver-assigned

**Trigger**: App API route when admin/staff assigns a driver to a booking

```json
{
  "event": "driver-assigned",
  "data": {
    "type": "driver_assignment",
    "booking": {
      "bookingReference": "BK-001",
      "customerName": "Juan Pérez",
      "customerPhone": "+573001234567"
    },
    "driver": {
      "name": "Carlos López",
      "vehicle": "Toyota Corolla 2023 - White - ABC-123",
      "eta": "25 minutes"
    }
  },
  "timestamp": "2026-05-17T14:00:00.000Z"
}
```

## delivery-completed

**Trigger**: App API route when delivery is marked complete

```json
{
  "event": "delivery-completed",
  "data": {
    "type": "delivery_completion",
    "booking": {
      "bookingReference": "BK-001",
      "customerName": "Juan Pérez",
      "customerPhone": "+573001234567"
    }
  },
  "timestamp": "2026-05-17T16:00:00.000Z"
}
```
