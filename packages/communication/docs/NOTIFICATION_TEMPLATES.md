# NOTIFICATION_TEMPLATES (Message Templates)

> Never write messages in code. All messages live in templates.
> Templates are language-aware, channel-aware, and versioned.

---

## Principle

```typescript
// WRONG: Hardcoded message in domain code
const message = `Hola ${name}, tu reserva #${ref} está confirmada.`

// RIGHT: Template rendered by Communication
const rendered = templateEngine.render('booking-confirmed', {
  recipient: { name, language: 'es' },
  channel: 'whatsapp',
  data: { bookingReference: ref }
})
```

---

## Template Structure

```
templates/
├── booking-confirmed/
│   ├── en/
│   │   ├── whatsapp.md
│   │   ├── email.html
│   │   ├── push.json
│   │   └── sms.txt
│   └── es/
│       ├── whatsapp.md
│       ├── email.html
│       ├── push.json
│       └── sms.txt
├── driver-assigned/
│   ├── en/
│   └── es/
├── trip-completed/
│   ├── en/
│   └── es/
├── payment-succeeded/
│   ├── en/
│   └── es/
├── payment-failed/
│   ├── en/
│   └── es/
├── driver-approved/
│   ├── en/
│   └── es/
├── assignment-created/
│   ├── en/
│   └── es/
├── booking-cancelled/
│   ├── en/
│   └── es/
├── trip-started/
│   ├── en/
│   └── es/
└── invoice/
    ├── en/
    └── es/
```

---

## Template Format

### WhatsApp (Markdown)

```markdown
🎉 Hello {{name}}!

Your booking *#{{bookingReference}}* is confirmed.
Driver: {{driverName}}
Vehicle: {{vehicle}}
Pickup: {{pickupLocation}}

Track your trip: {{trackingUrl}}
```

### Email (HTML)

```html
<h2>Booking Confirmed</h2>
<p>Hello {{name}},</p>
<p>Your booking <strong>#{{bookingReference}}</strong> is confirmed.</p>
<table>
  <tr><td>Driver</td><td>{{driverName}}</td></tr>
  <tr><td>Vehicle</td><td>{{vehicle}}</td></tr>
  <tr><td>Pickup</td><td>{{pickupLocation}}</td></tr>
</table>
<a href="{{trackingUrl}}">Track your trip</a>
```

### Push (JSON)

```json
{
  "title": "Booking Confirmed",
  "body": "Your booking #{{bookingReference}} is confirmed",
  "data": {
    "bookingReference": "{{bookingReference}}",
    "trackingUrl": "{{trackingUrl}}"
  }
}
```

### SMS (Plain Text)

```
Booking #{{bookingReference}} confirmed. Driver: {{driverName}}. Track: {{trackingUrl}}
```

---

## Template Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `{{name}}` | Recipient | Full name |
| `{{firstName}}` | Recipient | First name only |
| `{{bookingReference}}` | Event payload | Booking ID (truncated) |
| `{{driverName}}` | Event payload | Assigned driver name |
| `{{vehicle}}` | Event payload | Vehicle description |
| `{{licensePlate}}` | Event payload | License plate |
| `{{pickupLocation}}` | Event payload | Pickup address |
| `{{dropoffLocation}}` | Event payload | Dropoff address |
| `{{amount}}` | Event payload | Payment amount |
| `{{currency}}` | Event payload | Currency code |
| `{{trackingUrl}}` | Generated | Trip tracking link |
| `{{supportUrl}}` | Config | Support page link |
| `{{companyName}}` | Config | "LocalPlug" |

---

## Template Rules

1. **No hardcoded strings in code**: All messages in template files
2. **Versioned**: Templates are versioned (v1, v2, etc.)
3. **Channel-specific**: Same event, different format per channel
4. **Language-specific**: Same event, different text per language
5. **Testable**: Templates can be unit tested independently
6. **Previewable**: Templates can be rendered in isolation for review

---

## Migration from Current Code

The following hardcoded messages in `lib/n8n/client.ts` become templates:

| Current Location | Template ID |
|------------------|-------------|
| `triggerPaymentConfirmation()` line 139-141 | `booking-confirmed/es/whatsapp.md` |
| `triggerDriverAssigned()` line 174-176 | `driver-assigned/es/whatsapp.md` |
| `triggerDeliveryCompleted()` | `trip-completed/es/whatsapp.md` |
| `triggerAiChatMessage()` | Custom (chat domain) |

The Spanish detection heuristic (`isSpanish`) becomes language preference on the recipient.
