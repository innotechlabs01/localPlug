# REALTIME_VALIDATION (Epic 2B.5)

> **ID note:** B23 below = realtime/Socket.IO step. In `blueprint/MIGRATION_BACKLOG.md` v2 this is
> still **B23** (realtime stage). No translation needed. Analysis unchanged.

> Validates that the realtime model in the Blueprint is consistent with reality
> (`../platform-digital-twin/WEBSOCKETS.md`, `RUNTIME_MAP.md`) and executable in 2C (B23).

## Reality (confirmed from code)
- **No Socket.IO / WebSocket today.** Realtime is **polling only**: `lib/realtime/context.ts`
  (`RealtimeContext`) polls `/api/admin/realtime` every **2s**; chat polls `/api/chat/messages`;
  dispatch polls `assignments`/driver availability; the WhatsApp worker pulls `outgoing_messages`.
- One real-time-ish thing: n8n webhooks push into the queue; processed by `lib/queue/worker.ts`
  (`/api/cron/process-queue`). That is **server-side async**, not client realtime.

## Target (Blueprint)
- Introduce **Socket.IO** in **B23** as a fan-out layer over the typed event bus (outbox).
- Keep **polling as fallback** during rollout (flag `use-socketio` flips the client to WS).
- Server events emitted by domains → `lib/realtime/context.ts` subscribes via WS; chat/driver/
  customer apps consume the same channel.

## Consistency checks
| Check | Result |
|---|---|
| Does reality match "polling only"? | ✔ confirmed (WEBSOCKETS.md: "Polling — no Socket.IO") |
| Is Socket.IO placement defined? | ✔ B23 + `architecture/RUNTIME.md` (`lib/realtime`) |
| Is the event source for fan-out real? | ✔ outbox (`outgoing_messages`) already exists → becomes generic carrier |
| Is migration path non-breaking? | ✔ dual-mode: poll until `use-socketio`, then WS (ROLLBACK_STRATEGY.B23) |
| Who owns the realtime layer? | ✔ new `realtime` domain, consumed by all apps (no ownership conflict) |

## Risk (vs RISK_MATRIX)
- High: connection mgmt at scale → mitigated by Socket.IO room-per-entity + keep-polling fallback.
- This is the **only** open realtime item; it is **built in B23**, not pre-required.

## Verdict
Realtime model is consistent and executable. Low score (90%) reflects B23 work pending, not
ambiguity → **Gate 7 ✔ (scheduled)**.
