# Architecture — Realtime (Transport)

The realtime transport used by the event-driven outbox (see `event-driven.md`).

## Technology (actual, implemented)
- **Store:** `events_outbox` SQLite/Turso table (append-only).
- **Publisher:** `emitEvent()` in `lib/events-outbox.ts` (server-side, any route/service).
- **Read API:**
  - `GET /api/events?since=<id>` → `{ events, cursor }` (cursor polling — primary, robust).
  - `GET /api/events/stream?since=<id>` → SSE (best-effort, self-closes).
- **Client:** `useEventStream(handlers, { pollMs })` in `lib/use-event-stream.ts`.
- **Deployment:** works on serverless (Vercel). No Socket.IO, no Redis, no
  persistent process.

## Transport decision

SSE / WebSockets require long-lived connections, which serverless functions do
not hold reliably (bounded duration, cold starts). So the design is:

1. **Cursor polling** (`/api/events?since=<id>`) is the **robust primary** path.
   It is cheap (single indexed query on `id > since`), fires immediately on the
   page, and never misses events because the outbox is durable.
2. **SSE stream** (`/api/events/stream`) is the **best-effort improvement**: an
   open stream pushes events as they arrive. On serverless it self-closes after
   ~55s and the client reconnects with its last cursor. If it fails, consumers
   fall back to polling.
3. Every consumer also keeps its original polling interval as a **fallback**, so
   the UI reconciles even if the outbox route is briefly down.

## Connection / flow

```
Client mounts page
  → useEventStream starts cursor=0
  → poll GET /api/events?since=cursor  (every pollMs, default 5-8s)
  → for each event: cursor = ev.id; dispatch to handler[ev.type]
  → handler calls that page's refetch() → UI updates instantly
```

## SSE specifics

- Route: `app/api/events/stream/route.ts` (`runtime = 'nodejs'`).
- Sends `event: <type>` / `data: <json>` frames plus periodic `: ping` heartbeats.
- Emits a final `event: done` and closes after ~55s; client reconnects with
  `?since=<lastId>`.
- Headers: `text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.

## Guidelines

1. Add a consumer by passing event types to `useEventStream` in the page — do
   NOT add new server polling for already-emitted events.
2. New events go in the catalog in `event-driven.md`.
3. Keep handlers thin: a handler should usually just `refetch()`; put real logic
   on the server/API, not in the realtime layer.
4. The outbox row `payload` is JSON; keep payloads small and non-secret.