# n8n Workflow Quick Reference

## Workflow 1: Payment → WhatsApp Welcome

### Nodes in order:
```
1. Webhook (POST /webhook/payment-confirmed)
   └→ Header Auth: Bearer YOUR_N8N_API_KEY

2. Code: Format Welcome Message
   └→ Reads: data.booking.customerPhone, customerName, etc.
   └→ Returns: { phone, message, instance }

3. Evolution API: Send Text
   └→ Instance: localplug-main
   └→ Phone: {{ $json.phone }}
   └→ Text: {{ $json.message }}

4. HTTP Request: Callback to App
   └→ POST https://localplug.vercel.app/api/webhooks/n8n
   └→ event: "whatsapp-sent"
```

---

## Workflow 2: WhatsApp → AI Agent

### Nodes in order:
```
1. Webhook (POST /webhook/evolution-events)
   └→ Header Auth: Bearer YOUR_N8N_API_KEY

2. IF: Is Incoming Message?
   └→ {{ $json.event }} Equal "messages.upsert"

3. IF: Not From Me? (True branch)
   └→ {{ $json.data.key.fromMe }} Equal "false"

4. Code: Extract Message Data
   └→ Returns: { phone, message, instance, pushName, messageId }

5. OpenAI: Generate Response
   └→ Model: gpt-4o
   └→ System: Medellín Premium assistant prompt
   └→ User: {{ $json.message }}

6. IF: Needs Escalation?
   └→ {{ $json.choices[0].message.content }} Contains "agente se pondrá"

   TRUE BRANCH:
   └→ HTTP Request: Notify App - Escalation
   └→ Evolution API: Send "Un agente te contactará..."

   FALSE BRANCH:
   └→ Code: Format AI Response
   └→ Evolution API: Send AI response
   └→ HTTP Request: Save to App DB
```

---

## Workflow 3: Status Tracking

### Nodes in order:
```
1. Webhook (POST /webhook/evolution-events)

2. Switch: Route by Event Type
   ├→ "message-receipt.update" → Log delivery status
   ├→ "instance.status" → Log instance health
   └→ "connection.update" → Alert if disconnected
```

---

## Test Payloads

### Payment Confirmed (Workflow 1)
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

### Incoming WhatsApp Message (Workflow 2)
```json
{
  "event": "messages.upsert",
  "instance": "localplug-main",
  "data": {
    "key": {
      "remoteJid": "573001234567@s.whatsapp.net",
      "fromMe": false,
      "id": "ABCDEF123456"
    },
    "message": {
      "conversation": "Hola, tengo una pregunta sobre mi reserva"
    },
    "pushName": "Juan Pérez",
    "messageTimestamp": 1716120000
  }
}
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| WhatsApp not connecting | Re-scan QR code in Evolution API Manager |
| Messages not sending | Check phone number format: `573001234567` (no spaces, with country code) |
| AI not responding | Verify OpenAI API key in n8n credentials |
| Webhook 401 error | Check API key matches in Evolution API and n8n |
| Duplicate messages | Check conversation status in DB, ensure not "human_active" |
