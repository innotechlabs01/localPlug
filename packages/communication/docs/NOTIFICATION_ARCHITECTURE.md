# NOTIFICATION_ARCHITECTURE (Master Contract)

> Communication is a cross-cutting domain. It does NOT belong to Booking, Dispatch,
> Driver, or any other business domain. ALL domains produce events. Communication
> consumes them and decides how to notify.

---

## Core Principle

**Domains publish events. Communication decides everything else.**

The Booking domain has zero knowledge of WhatsApp, email, push, or any delivery
channel. It publishes `booking.confirmed` and walks away. Communication picks
up the event, resolves recipients, selects channels, renders templates, and delivers.

This is not optional. This is the law.

---

## Why Communication Is Cross-Cutting

```
Booking ──────┐
Dispatch ─────┤
Driver ────────┤
Payment ───────┤──→ Communication ──→ WhatsApp / Email / Push / SMS / WebSocket / InApp
Trip ──────────┤
Hotel ─────────┤
Partner ───────┘
```

Every business domain produces events that need external notification.
Communication owns the entire pipeline from event to delivery.

If a domain directly calls `sendWhatsApp()` or `sendEmail()`, that's a
violation of the Constitution (§14: move behavior, never change it).

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    EVENT BUS (B10)                       │
│  Domains publish events here. Communication subscribes. │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    EVENT HANDLERS                        │
│  Map domain events to notification intents.              │
│  BookingConfirmedHandler, TripCompletedHandler, etc.     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      ROUTING                             │
│  For each recipient: resolve preferences, select         │
│  channels, apply business rules.                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    TEMPLATES                             │
│  Render message content for each channel + language.     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    DELIVERY                              │
│  Send via providers. Track state. Handle failures.       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 RETRY + DLQ                              │
│  Exponential backoff. Dead letter queue. Never lose.     │
└─────────────────────────────────────────────────────────┘
```

---

## Contract: What Communication Owns

| Concern | Owner | Notes |
|---------|-------|-------|
| WhatsApp sending | Communication | Via Evolution API adapter |
| Email sending | Communication | Via any email provider |
| Push notifications | Communication | Via Firebase/APNs |
| SMS sending | Communication | Via any SMS provider |
| WebSocket messages | Communication | Via Socket.IO |
| In-app notifications | Communication | Via database + real-time |
| Template rendering | Communication | Multi-language, multi-channel |
| Channel selection | Communication | Based on preferences + rules |
| Retry logic | Communication | Exponential backoff, DLQ |
| Delivery tracking | Communication | State machine, metrics |
| Rate limiting | Communication | Per-provider, per-user |
| Cost tracking | Communication | Per-provider, per-message |

---

## Contract: What Domains Must NOT Do

| Violation | Example | Fix |
|-----------|---------|-----|
| Direct WhatsApp call | `sendWhatsApp(phone, msg)` | Publish event instead |
| Direct email call | `sendEmail(to, subject, body)` | Publish event instead |
| Direct push call | `sendPush(userId, title, body)` | Publish event instead |
| Template in domain code | Message strings in booking service | Move to communication templates |
| Channel logic in domain | `if (user.preferWhatsApp)` | Move to routing |
| Retry in domain | `retry(() => sendN8n(...))` | Move to delivery |

---

## Integration with B10 Event Bus

Communication subscribes to the B10 event bus as a **consumer**.

It does NOT produce business events. It produces **integration events**:

```
Domain Event              →  Communication Consumer  →  Integration Event
─────────────────────────────────────────────────────────────────────────
booking.confirmed         →  BookingConfirmedHandler  →  whatsapp.message.sent
assignment.accepted       →  AssignmentHandler        →  notification.delivered
trip.completed            →  TripCompletedHandler     →  email.sent
payment.failed            →  PaymentFailedHandler     →  push.sent
driver.approved           →  DriverApprovedHandler    →  sms.sent
```

Integration events (`whatsapp.message.sent`, `email.sent`, etc.) are
Communication's output. They go back to the event bus for other consumers
(analytics, audit, monitoring).

---

## Implementation Plan (B11B)

### Phase 1: Contracts + Types
- `NotificationProvider` interface
- `NotificationHandler` interface
- `NotificationRouter` interface
- `DeliveryState` enum
- `NotificationMessage` type

### Phase 2: Core Engine
- `NotificationEngine` — orchestrates the pipeline
- `InMemoryRouter` — channel selection
- `TemplateRenderer` — template resolution + rendering

### Phase 3: Provider Adapters
- WhatsApp (Evolution API)
- Email (configurable)
- Push (Firebase)
- SMS (configurable)
- WebSocket (Socket.IO)
- InApp (database)

### Phase 4: Event Handlers
- One handler per business event type
- Maps event → notification intent
- Delegates to engine

### Phase 5: n8n Client Decomposition
- Extract WhatsApp logic → `providers/whatsapp`
- Extract webhook logic → `providers/webhook`
- Extract template logic → `templates/`
- `lib/n8n/client.ts` becomes a thin re-export

### Phase 6: Observability
- Metrics collection
- Cost tracking
- Alerting rules

---

## Anti-Patterns to Prevent

1. **God Module**: Communication must NOT become another `lib/n8n/client.ts`.
   Split by concern from day one.

2. **Cross-Domain Coupling**: Booking must never import from Communication.
   Only the Event Bus connects them.

3. **Template Sprawl**: No message strings outside `templates/`.
   If you see `Hola ${name}` in a domain service, that's a violation.

4. **Provider Leaking**: No WhatsApp/email/push imports outside `providers/`.
   If you see `import { sendWhatsApp }` in booking code, that's a violation.

5. **Silent Failures**: Every delivery attempt must be tracked.
   Lost messages = lost trust.
