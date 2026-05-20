# n8n Webhook Callbacks (n8n → App)

n8n responds to the app's trigger events via callbacks to `https://localplug.vercel.app/api/webhooks/n8n`.

## Common Envelope

```json
{
  "event": "<callback_type>",
  "data": { ... },
  "workflowId": "wf-123",
  "timestamp": "2026-05-17T12:00:05.000Z"
}
```

## payment-confirmed callback

```json
{
  "event": "payment-confirmed",
  "data": {
    "bookingReference": "BK-001",
    "whatsappMessageId": "wamid.ABC123",
    "whatsappStatus": "sent",
    "customerPhone": "+573001234567"
  },
  "workflowId": "wf-456",
  "timestamp": "2026-05-17T12:00:05.000Z"
}
```

## driver-assigned callback

```json
{
  "event": "driver-assigned",
  "data": {
    "bookingReference": "BK-001",
    "whatsappMessageId": "wamid.DEF456",
    "whatsappStatus": "sent",
    "customerPhone": "+573001234567"
  },
  "workflowId": "wf-456",
  "timestamp": "2026-05-17T14:00:05.000Z"
}
```

## delivery-completed callback

```json
{
  "event": "delivery-completed",
  "data": {
    "bookingReference": "BK-001",
    "whatsappMessageId": "wamid.GHI789",
    "whatsappStatus": "sent",
    "customerPhone": "+573001234567"
  },
  "workflowId": "wf-456",
  "timestamp": "2026-05-17T16:00:05.000Z"
}
```
