# NOTIFICATION_ROUTING (Channel Selection)

> Routing is the brain of Communication. It decides WHICH channels to use
> for each recipient, for each event type.

---

## Routing Pipeline

```
Event Received
    ↓
1. Resolve Recipients     → Who needs to know?
    ↓
2. Load Preferences       → What do they want to receive?
    ↓
3. Apply Business Rules   → What channels are appropriate?
    ↓
4. Check Provider Health  → Which providers are available?
    ↓
5. Select Channels        → Final channel list per recipient
    ↓
6. Enqueue for Delivery   → Send via selected channels
```

---

## Contract

```typescript
interface NotificationRouter {
  route(intent: NotificationIntent): Promise<RoutedNotification[]
}

interface NotificationIntent {
  eventType: string
  recipients: Recipient[]
  templateId: string
  payload: Record<string, unknown>
}

interface Recipient {
  id: string
  type: 'customer' | 'driver' | 'hotel' | 'partner' | 'admin'
  name: string
  email?: string
  phone?: string
  deviceTokens?: string[]
  connectedSocketIds?: string[]
}

interface RoutedNotification {
  recipient: Recipient
  channels: NotificationChannel[]
  templateId: string
  language: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  payload: Record<string, unknown>
}
```

---

## Routing Rules

### By Event Type

| Event | Recipients | Channels | Priority |
|-------|-----------|----------|----------|
| `booking.created` | Customer | WhatsApp, InApp | normal |
| `booking.confirmed` | Customer | WhatsApp, Email, Push, InApp | normal |
| `booking.cancelled` | Customer, Admin | WhatsApp, Email, InApp | high |
| `assignment.created` | Driver | Push, InApp | high |
| `assignment.accepted` | Customer | WhatsApp, Push, InApp | normal |
| `assignment.rejected` | Admin | InApp | normal |
| `trip.started` | Customer | Push, InApp | normal |
| `trip.completed` | Customer, Admin | WhatsApp, Email, Push, InApp | normal |
| `payment.succeeded` | Customer | WhatsApp, Email, InApp | normal |
| `payment.failed` | Customer, Admin | WhatsApp, Email, InApp | high |
| `payment.refunded` | Customer | Email, InApp | normal |
| `driver.approved` | Driver | WhatsApp, Push, InApp | normal |
| `driver.suspended` | Driver | WhatsApp, Email, InApp | high |

### By Recipient Type

| Recipient | Default Channels | Notes |
|-----------|-----------------|-------|
| Customer | WhatsApp, Email, Push, InApp | WhatsApp preferred (phone required) |
| Driver | WhatsApp, Push, InApp | Push preferred (app installed) |
| Hotel | Email, InApp | Email preferred (business context) |
| Partner | Email, InApp | Email preferred |
| Admin | InApp, Email | InApp for dashboard |

### Business Rules

1. **WhatsApp requires phone number**: Skip if no phone on file
2. **Push requires device token**: Skip if no tokens registered
3. **Email requires email address**: Skip if no email on file
4. **Urgent messages bypass preferences**: Override user opt-outs
5. **Rate limit per recipient**: Max 5 messages/hour per channel
6. **Cool-down period**: No duplicate messages within 5 minutes

---

## Fallback Chains

```
Primary Channel Fail → Fallback Chain:
WhatsApp Fail → SMS → Email → InApp
Push Fail → InApp
Email Fail → InApp
WebSocket Fail → Push → InApp
```

Fallback is automatic. The retry system handles it.

---

## Language Detection

```
1. User preference → use preferred language
2. Heuristic from name → Spanish name patterns → 'es'
3. Default → 'en'
```

No hardcoded language strings in business logic. All rendering in templates.
