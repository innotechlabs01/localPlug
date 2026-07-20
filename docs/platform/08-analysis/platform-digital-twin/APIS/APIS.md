# APIS (Real — Digital Twin)

> Source of truth for the **real** API surface today (Next.js route handlers under `app/api/*`).
> No code changes. Route inventory derived from `DEPENDENCIES/scan-deps.mjs` module map +
> `MODULES/*.md`. Responsibilities are brief and real.

## Surfaces
1. **Admin** (`/api/admin/*`) — internal admin portal (RBAC-gated via `lib/admin/permissions`).
2. **Public / Customer** (`/api/booking`, `/api/bookings/*`, `/api/hotels`, `/api/promotions/validate`, `/api/flights/validate`, `/api/ratings`, `/api/geocode`, `/api/config`) — used by the landing/customer flows.
3. **Webhooks** (`/api/webhooks/*`) — external systems: Evolution (WhatsApp), n8n, Paddle, Clerk.
4. **Internal / Cron** (`/api/cron/process-queue`, `/api/health`, `/api/admin/queue`, `/api/admin/realtime`).

## Admin routes (real)
| Route | Real responsibility | Domain (Blueprint) |
|---|---|---|
| `admin/analytics` | analytics dashboards | analytics |
| `admin/cases/*` (parent, events, documents, tasks) | case management | cases |
| `admin/customers` | customer CRUD | customers |
| `admin/dispatch` | dispatch + assignment creation | dispatch |
| `admin/drivers/*` (parent, [id]/documents, history, performance, photo, ranking) | driver mgmt | drivers |
| `admin/employees`, `admin/team`, `admin/roles`, `admin/modules`, `admin/users/*`, `admin/permissions/*` | RBAC + team | auth |
| `admin/hotels`, `admin/hotels/stats`, `admin/rooms`, `admin/promotions` | hotels/rooms/promos | hotels |
| `admin/orders`, `admin/orders/[id]`, `admin/orders/[id]/status` | order ops | booking |
| `admin/payments`, `admin/payments/refund`, `admin/payments/splits` | payment ops | payments |
| `admin/reservations`, `admin/reservations/[id]/assign-driver` | reservations + driver assign | booking |
| `admin/settings`, `admin/stats`, `admin/agenda`, `admin/lookup`, `admin/queue`, `admin/realtime` | settings/ops/realtime | settings / realtime |

## Public / customer routes (real)
| Route | Real responsibility | Domain |
|---|---|---|
| `booking` | create booking | booking |
| `bookings/search`, `bookings/driver-assigned`, `bookings/delivery-completed` | booking status callbacks | booking / dispatch |
| `flights/validate` | flight + 15-day validation | booking |
| `hotels`, `promotions/validate` | hotel/promo lookup | hotels |
| `ratings`, `ratings/stats` | rating submit/read | ratings |
| `geocode` | address → coords | maps |
| `config` | public config | config |

## Webhook routes (real)
| Route | Calls | Domain |
|---|---|---|
| `webhooks/evolution` | WhatsApp inbound messages/status | notifications |
| `webhooks/n8n` | n8n workflow callbacks (incl. AI cases) | notifications / ai |
| `webhooks/paddle` | Paddle payment events (dedup) | payments |
| `webhooks/clerk` | Clerk org/member sync | auth |

## Chat routes (real) — `/api/chat/*`
`start`, `send`, `messages`, `conversations`, `close`, `rating`, `agents`, `agents/available`,
`agent-me`, `escalate`, `request-escalate`, `ai-response` — all → `domains/chat` + `domains/ai`.

## Assignments (real) — `/api/assignments/*`
`[id]/accept`, `[id]/decline`, `route` — driver accept/reject → `domains/dispatch`.

## Realtime today
No Socket.IO server yet (ADR-004 unimplemented). Clients **poll** (`use-polling.ts`,
`realtime-context.tsx`); the server side is `admin/realtime` + `cron/process-queue` which drains
`outgoing_messages`. See `WEBSOCKETS.md`.

## Observations
- Every admin route currently co-locates **auth check + business logic + DB access** in one
  handler. The Blueprint splits this into a thin route (orchestration) + domain service.
- Route handlers are the de-facto "application layer" today; there is no domain/service boundary.
