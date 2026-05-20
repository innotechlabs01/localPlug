# Workflow: Payment → WhatsApp Welcome

**Purpose**: Send WhatsApp confirmation message when user completes payment

## Webhook Trigger

- **Path**: `/webhook/payment-confirmed`
- **Method**: POST
- **Auth**: Header Auth (Bearer token)

## Workflow Nodes

```
1. Webhook (payment-confirmed)
   ↓
2. Code: Format Welcome Message
   ↓
3. Evolution API: Send Text
   ↓
4. HTTP Request: Callback to App
```

## Node 1: Webhook

```json
{
  "httpMethod": "POST",
  "path": "payment-confirmed",
  "authentication": "headerAuth",
  "responseMode": "onReceived"
}
```

## Node 2: Format Welcome Message (Code)

```javascript
const booking = $input.first().json.data.booking;
const phone = booking.customerPhone;
const name = booking.customerName;
const ref = booking.bookingReference;
const pkg = booking.packageName;
const arrival = booking.arrivalDate;
const flight = booking.flightNumber;

// Auto-detect language
const isSpanish = /[áéíóúñ¿¡]/.test(name) || 
                  name.toLowerCase().includes('maría') ||
                  name.toLowerCase().includes('josé');

const message = isSpanish 
  ? `¡Hola ${name}! 🎉\n\nTu reserva *#${ref.slice(0, 8).toUpperCase()}* está confirmada.\n\n📦 Paquete: ${pkg}\n✈️ Vuelo: ${flight}\n📅 Llegada: ${arrival}\n\n¿Tienes alguna pregunta? Responde a este mensaje y te ayudamos.`
  : `Hello ${name}! 🎉\n\nYour booking *#${ref.slice(0, 8).toUpperCase()}* is confirmed.\n\n📦 Package: ${pkg}\n✈️ Flight: ${flight}\n📅 Arrival: ${arrival}\n\nDo you have any questions? Reply to this message and we'll help you.`;

return [{
  json: {
    phone: phone,
    message: message,
    instance: 'localplug-main'
  }
}];
```

## Node 3: Evolution API Send Text

```json
{
  "resource": "evolutionApi",
  "operation": "sendText",
  "instance": "localplug-main",
  "number": "={{ $json.phone }}",
  "text": "={{ $json.message }}"
}
```

## Node 4: Callback to App (HTTP Request)

```json
{
  "method": "POST",
  "url": "https://localplug.vercel.app/api/webhooks/n8n",
  "sendBody": true,
  "bodyParameters": {
    "event": "whatsapp-sent",
    "data": {
      "bookingReference": "={{ $('Format Welcome Message').item.json.phone }}",
      "whatsappMessageId": "={{ $json.key?.id }}",
      "status": "sent"
    },
    "timestamp": "={{ $now.toISO() }}"
  }
}
```

## Test Payload

```json
{
  "event": "payment-confirmed",
  "data": {
    "booking": {
      "bookingReference": "test-123-abc",
      "customerName": "Juan Pérez",
      "customerEmail": "juan@test.com",
      "customerPhone": "573001234567",
      "packageName": "The VIP Arrival",
      "amount": 89,
      "flightNumber": "AV123",
      "airline": "Avianca",
      "arrivalDate": "2026-06-15",
      "arrivalTime": "14:30"
    }
  },
  "timestamp": "2026-05-19T10:00:00.000Z"
}
```
