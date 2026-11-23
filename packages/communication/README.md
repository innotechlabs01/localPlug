# Communication Domain

> LocalPlug's cross-cutting communication layer. Owns ALL outbound and inbound messaging.
> Domains publish events. Communication decides how, when, and to whom to deliver.

---

## Principle

**Domains never send messages. They publish events.**

```
WRONG:                          RIGHT:
Booking                         Booking
  ↓                               ↓
sendWhatsApp()                  BookingConfirmed
  ↓                               ↓
N8N                            Notifications
                                 ↓
                               Route → Select Channels → Deliver
```

Communication is the **only** domain that touches external messaging providers.
No other domain imports WhatsApp, email, SMS, or push libraries.

---

## Package Structure

```
packages/communication/
├── src/
│   ├── providers/              ← Channel adapters (WhatsApp, Email, Push, SMS, WebSocket, InApp)
│   ├── handlers/               ← Event handlers (subscribe to Event Bus)
│   ├── templates/              ← Message templates (multi-language, multi-channel)
│   ├── routing/                ← Channel selection rules
│   ├── preferences/            ← User notification preferences
│   ├── delivery/               ← Delivery state machine + tracking
│   ├── retry/                  ← Retry policies + DLQ
│   ├── metrics/                ← Observability + cost tracking
│   ├── contracts/              ← Interfaces (Provider, Handler, Router, etc.)
│   └── index.ts                ← Barrel exports
├── docs/                       ← Architecture documentation
│   ├── NOTIFICATION_ARCHITECTURE.md
│   ├── NOTIFICATION_PROVIDERS.md
│   ├── NOTIFICATION_ROUTING.md
│   ├── NOTIFICATION_TEMPLATES.md
│   ├── NOTIFICATION_PREFERENCES.md
│   ├── NOTIFICATION_RETRY_POLICY.md
│   ├── NOTIFICATION_DELIVERY.md
│   ├── NOTIFICATION_EVENTS.md
│   └── NOTIFICATION_METRICS.md
├── package.json
└── tsconfig.json
```

---

## Reading Order

1. `NOTIFICATION_ARCHITECTURE.md` — The master contract
2. `NOTIFICATION_EVENTS.md` — What events we handle
3. `NOTIFICATION_PROVIDERS.md` — Channel adapters
4. `NOTIFICATION_ROUTING.md` — How we route
5. `NOTIFICATION_TEMPLATES.md` — Message templates
6. `NOTIFICATION_PREFERENCES.md` — User preferences
7. `NOTIFICATION_DELIVERY.md` — Delivery states
8. `NOTIFICATION_RETRY_POLICY.md` — Retry + DLQ
9. `NOTIFICATION_METRICS.md` — Observability

---

## Status

| Area | Status |
|------|--------|
| Architecture Contract | ✅ Defined (B11A) |
| Runtime Implementation | ⬜ Pending (B11B) |
| Event Handlers | ⬜ Pending (B11B) |
| Provider Adapters | ⬜ Pending (B11B) |
| Template Engine | ⬜ Pending (B11B) |
| n8n Client Decomposition | ⬜ Pending (B11B) |
