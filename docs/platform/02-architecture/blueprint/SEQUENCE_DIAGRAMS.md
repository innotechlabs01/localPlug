# SEQUENCE_DIAGRAMS

Sequence diagrams for the major workflows, in the target architecture. They show the
**approved** interaction shape (app → api → domain → db/realtime). Compare with the current
embedded-logic routes in `../../99-analysis/PLATFORM_DISCOVERY.md`.

## 1. Booking creation (customer/app)
```mermaid
sequenceDiagram
  participant C as Customer app
  participant API as api/booking route
  participant B as domains/booking
  participant P as domains/payments
  participant RT as realtime
  participant N as domains/notifications
  C->>API: POST /api/booking (Clerk+OTP, zod)
  API->>B: booking.create(order)
  B->>B: validate flight, pricing, FX
  B-->>API: order id
  API->>P: (event) booking.created -> create intent
  B->>RT: emit booking.created
  RT->>N: notify customer (WhatsApp)
  API-->>C: { success, data: order }
```

## 2. Driver assignment accept (dispatch)
```mermaid
sequenceDiagram
  participant Disp as domains/dispatch
  participant RT as realtime
  participant Dr as Driver app
  participant T as domains/trips
  participant N as domains/notifications
  Disp->>RT: emit assignment.created (room driver:{id})
  RT->>Dr: push assignment
  Dr->>Disp: accept (45s timer)
  Disp->>Disp: checkDriverAvailability, mark accepted
  Disp->>T: (event) assignment.accepted -> trip.started(pending)
  Disp->>RT: emit assignment.accepted
  RT->>N: notify admin + customer
```

## 3. Payment confirmation (Paddle webhook)
```mermaid
sequenceDiagram
  participant PAD as Paddle
  participant WH as api/webhooks/paddle
  participant P as domains/payments
  participant B as domains/booking
  participant RT as realtime
  PAD->>WH: webhook (signed)
  WH->>P: payment.confirm(payload)
  P->>P: verify, compute split (platform/hotel)
  P->>B: (event) payment.completed -> booking.confirmed
  P->>RT: emit payment.completed
  RT->>N: notify customer
```
> Note: today the split calc + order confirm is duplicated in `app/api/booking/route.ts` and
> `app/api/webhooks/paddle/route.ts` (TECH_DEBT H-3). Target: single owner = payments.

## 4. WhatsApp inbound → AI → escalation (chat/ai/notifications)
```mermaid
sequenceDiagram
  participant EVO as Evolution/WhatsApp
  participant WH as api/webhooks/evolution
  participant N as domains/notifications
  participant CH as domains/chat
  participant AI as domains/ai
  EVO->>WH: inbound message
  WH->>N: message.received
  N->>CH: find-or-create conversation
  CH->>AI: ai.respond(message)
  alt low confidence
    AI->>CH: (event) ai.escalated
    CH->>N: notify human agent
  else responded
    AI->>CH: (event) ai.responded
    CH->>N: send WhatsApp reply
  end
```
> Note: the god-route `app/api/webhooks/n8n/route.ts` is **replaced** by this dispatcher
> (TECH_DEBT H-4).

## 5. Admin dispatch (current → target)
Current: `app/api/admin/dispatch/route.ts` (289 lines) does SQL + state machine + n8n inline.
Target:
```mermaid
sequenceDiagram
  participant Adm as Admin app
  participant API as api/admin/dispatch
  participant D as domains/dispatch
  participant RT as realtime
  Adm->>API: assign(orderId, driverId)
  API->>D: dispatch.assign(...)
  D->>D: availability check + assignment insert
  D->>RT: emit assignment.created
  API-->>Adm: { success }
```
