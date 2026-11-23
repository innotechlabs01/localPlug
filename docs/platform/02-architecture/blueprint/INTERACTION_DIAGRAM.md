# INTERACTION_DIAGRAM

How modules interact at runtime for a representative write flow (booking creation). Read
flows and other domains follow the same shape: **app → api (orchestrate) → domain → db /
realtime / notifications**.

```mermaid
sequenceDiagram
  participant U as User (app)
  participant API as packages/api route
  participant B as domains/booking
  participant P as domains/payments
  participant N as domains/notifications
  participant RT as packages/realtime
  participant DB as packages/db

  U->>API: POST /api/booking (auth + zod)
  API->>B: booking.create(payload)
  B->>DB: insert orders
  B->>P: (event) booking.created
  P-->>DB: create payment intent
  B->>RT: emit booking.created
  RT->>N: notify customer (WhatsApp)
  RT->>U: push confirmation (room: customer/app)
  API-->>U: { success, data }
```

## Key interactions
- **App → API:** thin orchestration (auth, validation, envelope).
- **API → Domain:** the only place an app touches a domain.
- **Domain → DB:** direct, owned tables only.
- **Domain → Realtime:** publish event (no logic in realtime).
- **Realtime → Notifications / Apps:** broadcast; notifications may trigger WhatsApp via n8n.
- **Domain → Domain:** never direct; always via event (dashed path above).

See `SEQUENCE_DIAGRAMS.md` for full workflows and `EVENT_OWNERSHIP.md` for the catalog.
