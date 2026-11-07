# RUNTIME_MAP (Real — Digital Twin)

> The real request-time flow through the current monolith. Source of truth for *how the system
> actually runs today*. Built from `DEPENDENCIES/scan-deps.mjs` + `MODULES/*.md`. No code changes.

## Booking flow (real)
```
Browser (Landing / Customer)
  → app/booking/* , app/components/booking/booking-form.tsx
  → POST /api/booking  (app/api/booking/route.ts)
       └─ lib/services/booking-service.ts
            ├─ lib/trm.ts (FX)
            ├─ lib/pricing.ts (price)
            ├─ lib/reservations-types.ts
            ├─ lib/db.ts  (orders_new insert)
            └─ lib/n8n/client.ts  → WhatsApp confirmation to customer   (inline, not event)
  → admin polls /api/admin/realtime + use-polling.ts to see the new order
```

## Dispatch + assignment flow (real)
```
Admin  → app/admin/dispatch/page.tsx
  → POST /api/admin/dispatch  (app/api/admin/dispatch/route.ts)
       └─ lib/dispatch/* (availability, assignment creation)
            ├─ lib/db.ts (assignments insert)
            └─ lib/n8n/client.ts → notify driver via WhatsApp   (inline)
Driver (polls admin view / future app)
  → POST /api/assignments/[id]/accept  (app/api/assignments/[id]/accept/route.ts)
       └─ lib/dispatch/* → updates assignments + orders_new
  → polling refresh shows new state
```

## Chat + AI flow (real)
```
Customer (WhatsApp) → webhooks/evolution → lib/queue (enqueue) → whatsapp-worker → n8n
Admin/Site → POST /api/chat/start → /send → lib/services/chat-service.ts
  → lib/services/agent-service.ts
  → POST /api/chat/ai-response → lib/services/ollama-service.ts (AI reply)
  → escalate → lib/n8n/client.ts (n8n case)   [circular dep risk]
Admin UI polls chat via realtime-context.tsx
```

## Payment flow (real)
```
POST /api/payments/create-intent (lib/paddle.ts + lib/services/payment-service.ts)
  → Paddle checkout
Webhook /api/webhooks/paddle → lib/paddle.ts (dedup) → orders_new / split cols
  → lib/n8n/client.ts → customer confirmation   (inline)
Admin polls /api/admin/payments
```

## Notification / realtime flow (real)
```
Producers write rows to outgoing_messages (and call n8n/Evolution directly)
  ↓
cron/process-queue (or worker) drains outgoing_messages → WhatsApp/Evolution
  ↓
Admin UI refreshes by POLLING (use-polling.ts, realtime-context.tsx) — no sockets
```

## Key reality
- **No push.** Every "live" update is a poll. Socket.IO (ADR-004) is absent.
- **No event bus.** Cross-module communication is *inline function calls* (e.g. a booking
  handler calls the WhatsApp service), which is exactly what creates the `lib/queue ↔ lib/n8n`
  cycle and the `lib/config ↔ lib/db` cycle.
- **DB is the only shared state** and is imported directly everywhere (in-degree 78 on
  `lib/db.ts`, including the browser bundle).
