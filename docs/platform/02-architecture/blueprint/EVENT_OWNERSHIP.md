# EVENT_OWNERSHIP

Cross-domain communication is **event-driven only** (ADR-004 / `../event-driven.md`).
Events are typed, carry a `correlationId`, and are published by exactly one owning domain.

## Event catalog (proposed)

| Event | Publisher (owner) | Consumers |
|---|---|---|
| `booking.created` | booking | payments, dispatch, notifications, analytics |
| `booking.confirmed` | booking | payments, notifications, analytics |
| `booking.cancelled` | booking | payments, notifications, analytics |
| `assignment.created` | dispatch | drivers(app), notifications, trips, analytics |
| `assignment.accepted` | dispatch | trips, booking, notifications, analytics |
| `assignment.declined` | dispatch | booking, analytics |
| `driver.available` / `driver.busy` | drivers / dispatch | dispatch, analytics |
| `driver.onboarded` / `approved` / `suspended` | drivers | auth, notifications, analytics |
| `trip.started` / `picked_up` / `completed` | trips | payments, notifications, analytics, customers(app) |
| `vehicle.assigned` / `unassigned` | vehicles | drivers, analytics |
| `payment.completed` / `refunded` | payments | booking, notifications, analytics, trips |
| `payout.created` | payments | drivers(app), analytics |
| `notification.sent` | notifications | analytics |
| `message.received` (WhatsApp in) | notifications | chat, ai |
| `conversation.started` / `escalated` / `closed` | chat | notifications, ai, analytics |
| `ai.responded` / `ai.escalated` | ai | chat, notifications |
| `customer.created` | customers | booking, analytics |
| `settings.changed` | settings | all (re-read config) |
| `case.opened` / `resolved` | cases | drivers, analytics |
| `promotion.applied` | hotels | booking, analytics |
| `rating.submitted` | ratings | analytics, hotels |

## Rules
- One publisher per event (single source of truth).
- `packages/realtime` is the transport (Socket.IO rooms: `driver:{id}`, `dispatch`, `admin`,
  `all-drivers`); it owns **no** business logic.
- The legacy `app/api/webhooks/n8n/route.ts` `switch(event)` is **replaced** by this typed
  dispatcher during Epic 2C.
- New events require an ADR entry in `05-decisions/` only if they change a boundary.

See `EVENT_OWNERSHIP` ↔ `DOMAIN_MAP.md` (events column) and `BOUNDED_CONTEXTS.md`.
