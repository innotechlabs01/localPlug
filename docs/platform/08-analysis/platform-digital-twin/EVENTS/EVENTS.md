# EVENTS (Real — Digital Twin)

> Source of truth for the **real** events emitted/consumed today. No code changes. Derived from
> `MODULES/NOTIFICATIONS.md`, `MODULES/CHAT.md`, `MODULES/DISPATCH.md`, `DATABASE/DATABASE.md`.

## Reality today: eventing is implicit, not a bus
There is **no event bus / typed event contract** (contrast Blueprint `EVENT_OWNERSHIP.md`).
"Events" today are **side-effects performed inline** inside request handlers, plus **rows
written to `outgoing_messages` / `whatsapp_events`** that a worker later drains.

## Real event-like flows (today)
| Trigger (real) | Producer (file) | Consumer (real) | Transport today |
|---|---|---|---|
| WhatsApp inbound | `webhooks/evolution/route.ts` | `lib/queue` (enqueue) → `whatsapp-worker` → n8n/Evolution | HTTP webhook + DB row |
| WhatsApp outbound | `lib/services/whatsapp-service.ts` | n8n / Evolution API | direct HTTP |
| Assignment created | `admin/dispatch/route.ts` | driver (poll), n8n notify | DB row + n8n call |
| Assignment accepted/declined | `assignments/[id]/accept`, `decline` | booking/order update (poll) | DB row |
| Booking confirmed | `booking/route.ts` | customer WhatsApp, admin view | n8n + DB row |
| Chat message sent | `chat/send/route.ts` | agent UI (poll), ollama (ai-response) | DB row + direct call |
| Chat escalated | `chat/escalate`, `request-escalate` | human agent, n8n case | DB row + n8n |
| Payment confirmed | `webhooks/paddle/route.ts` | order/split update, customer notify | DB row + n8n |
| AI reply | `chat/ai-response` + `ollama-service` | chat (poll) | direct call |

## Where events "live" as data
- **`outgoing_messages`** — the notification outbox (status: queued/sent/failed). Real
  event-stream source for WhatsApp.
- **`whatsapp_events`** — inbound WhatsApp event log (message status, timestamps).
- **`conversations` / `messages`** — chat event source.
- **`case_events` / `case_tasks` / `case_documents`** — case lifecycle events.

## Problems (real, to fix in 2C)
1. **Coupling:** producers call consumers directly (e.g. a booking handler calls the WhatsApp
   service inline). No decoupling → the `lib/queue ↔ lib/n8n` cycle.
2. **No schema:** events have no typed contract; they are ad-hoc function calls + rows.
3. **No replay/observability:** failures are per-call; no outbox semantics except
   `outgoing_messages` (which is notification-only).

## Target (Blueprint)
Establish **typed events** (`EVENT_OWNERSHIP.md`): each domain **publishes** via
`packages/realtime`/an outbox; other domains **subscribe** — never direct cross-domain imports.
`outgoing_messages` becomes the generic outbox for all domains, not just notifications.
