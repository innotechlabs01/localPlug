# Architecture — Event-Driven (Realtime Outbox)

The realtime layer is implemented as a **persistent append-only outbox** in the
database, consumed by the frontends via cursor polling (primary) and a
Server-Sent Events stream (best-effort). This is deliberately **serverless
friendly** (works on Vercel) and requires no Socket.IO / Redis / persistent
process.

```
State mutation → emitEvent(type, payload) → events_outbox (SQLite/Turso)
                                                    │
                        ┌───────────────────────────┴───────────────────┐
                        │                                                │
              GET /api/events?since=<id>                        GET /api/events/stream
              cursor polling (robust)                          SSE (best-effort)
                        └───────────────┬──────────────────────────────┘
                                        ▼
                      useEventStream() in each client page
                        (dispatch event → refetch handler)
```

## How it works

1. **Publish.** Any server route/service that changes domain state calls
   `emitEvent(type, payload, { correlationId })` from `lib/events-outbox.ts`.
   It appends a row to `events_outbox`. It **never throws** and **never blocks**
   the business write that calls it.
2. **Read.** Frontends poll `GET /api/events?since=<lastId>` (returns events
   strictly newer than the cursor) or subscribe to the SSE stream
   `/api/events/stream?since=<lastId>`.
3. **Consume.** The client hook `useEventStream(handlers, { pollMs })` pulls
   events and dispatches each one to a handler by `type`. Most handlers just
   trigger a `refetch()` of that page's polling data — so the UI refreshes
   instantly on the relevant event, and the existing polling remains as a
   resilient fallback if the outbox route is ever down.

## Event catalog (currently emitted)

| Event | Emitted in | Consumer benefit |
|---|---|---|
| `booking.created` | `app/api/booking/route.ts` | admin, hotel see new booking |
| `payment.completed` | `app/api/webhooks/polar/route.ts` | admin cashflow, hotel reservations |
| `payment.refunded` | `app/api/webhooks/polar/route.ts` | admin cashflow, ledger write-off |
| `driver.assignment_offered` | `app/api/assignments/route.ts` (POST) | driver sees new assignment instantly |
| `assignments.accepted` | `app/api/assignments/[id]/accept/route.ts` | dispatch, driver, admin |
| `assignments.declined` | `app/api/assignments/[id]/decline/route.ts` | dispatch re-assigns |
| `driver.en_route` | `app/api/driver/assignments/[id]/status/route.ts` | live trip stage |
| `trip.pickedup` | `app/api/driver/assignments/[id]/status/route.ts` | live trip stage |
| `driver.trip_completed` | `app/api/driver/assignments/[id]/complete/route.ts` | dispatch, payout ledger |
| `driver.availability_changed` | `app/api/driver/status/route.ts` | dispatch board, admin |
| `hotel.check-in` | `app/api/hotel/orders/[id]/action/route.ts` | hotel + admin, payout accrual |
| `hotel.check-out` | `app/api/hotel/orders/[id]/action/route.ts` | hotel + admin, room free |
| `hotel.cancelled` | `app/api/hotel/orders/[id]/action/route.ts` | hotel, admin, room free |
| `message.sent` | `app/api/chat/send/route.ts` | admin ia-chat support |
| `ai.response.generated` | `app/api/chat/send`, `app/api/webhooks/n8n` | admin support, widget |
| `conversation.escalated` | `app/api/chat/escalate`, `app/api/chat/send`, n8n webhook | agent pickup |
| `rating.submitted` | `app/api/ratings/route.ts` (POST) | ratings board |
| `parking_proof.submitted` | `app/api/driver/assignments/[id]/complete/route.ts` | admin parking-proofs review |
| `parking_proof.reviewed` | `app/api/admin/parking-proofs/[id]/route.ts` | driver proof status |
| `payout.requested` | `lib/payout.ts` `createPayoutRequest` | admin settlements board |
| `payout.settled` | `lib/payout.ts` `settlePayoutRequest` | admin settlements board |

## Rules

1. Events are immutable once appended.
2. `emitEvent` must never break the caller — wrap the payload in a try/catch
   (the helper already does internally), and never `await` it where latency
   matters (fire-and-forget with `.catch(() => {})`).
3. Handlers are idempotent — consumers re-read source data; events are a signal
   to refetch, not the source of truth.
4. Include a `correlationId` (usually the booking/order/conversation id) for tracing.
5. The outbox is append-only; there is no per-event acknowledgment. Consumers
   track their own cursor (`since`).

## Consumers today

`useEventStream(...)` is wired in:

| Consumer | Listens to | What it refreshes |
|---|---|---|
| `lib/admin/realtime-context.tsx` (all admin) | most domain events | admin realtime feed (orders, conversations, stats) |
| `app/admin/ia-chat/page.tsx` | `message.sent`, `conversation.escalated`, `ai.response.generated` | conversations list |
| `app/admin/parking-proofs/page.tsx` | `parking_proof.submitted` | proofs list |
| `app/admin/settlements/page.tsx` | `payout.requested`, `payout.settled` | payouts board |
| `app/components/ratings/RatingsProvider.tsx` | `rating.submitted` | ratings + stats |
| `app/driver/page.tsx` & `app/driver/assignments/page.tsx` | assignment/trip events | assignments list |
| `app/hotel/reservations/page.tsx` | booking/payment/hotel events | reservations list |

See `realtime.md` for transport details.