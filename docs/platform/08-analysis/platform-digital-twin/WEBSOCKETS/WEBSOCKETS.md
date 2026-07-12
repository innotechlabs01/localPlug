# WEBSOCKETS (Real — Digital Twin)

> Source of truth for **real** realtime behavior today. No code changes. Derived from
> `MODULES/REALTIME.md`, `MODULES/NOTIFICATIONS.md`, and `DEPENDENCIES/scan-deps.mjs`.

## Reality today: polling, not sockets
There is **no Socket.IO server** (ADR-004 is unimplemented). Realtime is achieved by
**client-side polling**:

- **`lib/admin/realtime-context.tsx`** — React context that holds "live" admin data; refreshed
  by polling intervals, not push.
- **`app/admin/**/use-polling.ts`** — polling hook used across admin pages (reservations,
  dispatch, drivers…) to re-fetch on an interval.
- **`app/api/admin/realtime/route.ts`** — server endpoint the polling hits to get current state.
- **`app/api/cron/process-queue/route.ts` + `lib/queue/whatsapp-worker.ts`** — server-side
  "realtime" for notifications: drains `outgoing_messages` on a cron/worker tick and sends via
  WhatsApp/n8n. This is push to the *customer*, but the *admin UI* still polls.

## What "events" exist today (transport = DB table + polling, not WS)
| Event (concept) | Today's transport | Where |
|---|---|---|
| New WhatsApp message | Evolution webhook → `outgoing_messages` + `whatsapp_events`; admin polls | `webhooks/evolution`, `lib/queue` |
| Assignment created / accepted / declined | row insert/update + polling refresh | `admin/dispatch`, `assignments/*` |
| Booking status change | `orders_new` update + polling | `booking`, `bookings/*` |
| Chat message | `conversations`/`messages` insert + polling | `chat/*` |
| Payment confirmed | Paddle webhook → `orders_new`/split cols + polling | `webhooks/paddle` |

## Target (Blueprint) — what this becomes
- **`packages/realtime`** owns a Socket.IO gateway. Clients subscribe; servers emit.
- Polling (`use-polling.ts`, `realtime-context.tsx`) is **replaced** (kept only as fallback
  during cutover per `blueprint/ROLLBACK_STRATEGY.md`).
- `outgoing_messages` becomes an **outbox** that the realtime gateway drains and fans out as
  typed events (`EVENTS.md`), instead of a polling source.

## Coupling to fix
- `lib/queue ↔ lib/n8n` **circular dependency** (confirmed) sits on this path: the worker sends
  through n8n, and n8n client enqueues. Break before introducing the socket gateway.
