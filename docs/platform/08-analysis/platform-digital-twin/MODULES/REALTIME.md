# Realtime (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/admin/realtime-context.tsx`
  - **Responsibilities (real):**
    - ✔ `RealtimeProvider` ('use client') — polls `/api/admin/realtime` every 15s (`POLL_INTERVAL = 15_000`); pauses on `document.hidden`; refetches on `visibilitychange`/`focus`.
    - ✔ Maintains `orders`, `conversations`, `stats`, `notifications` state; derives `RealtimeNotification[]` by diffing `lastTimestampRef` against new orders and new `human_active` conversations.
    - ✔ Exposes `useRealtime()` (returns a safe default when no provider).
  - **Problem (real):** This is the only "realtime" mechanism and it is client-side **polling**, not push. It mixes data fetching, diff-based notification synthesis, and UI state in one context. The `stats` default is hardcoded and the notification detection is re-derived client-side instead of being emitted by the server. No socket/WebSocket/EventSource exists anywhere in the app (grep for `socket|websocket|event-source|EventSource|Server-Sent` in `app/**` returned nothing).

- **File:** `app/admin/dispatch/use-polling.ts`
  - **Responsibilities (real):** ✔ `usePolling(fetchFn, {intervalMs=10_000, enabled, onAuthError})` — generic React hook that runs `fetchFn` on an interval, pauses on `document.hidden`, stops permanently on `AUTH_ERROR`, refetches on `visibilitychange`/`focus`.
  - **Problem (real):** A second, generic polling primitive distinct from `realtime-context.tsx`'s inline interval. Two polling implementations coexist (this hook vs the provider's hand-rolled interval), with slightly different auth-error handling.

- **File:** `app/api/admin/realtime/route.ts`
  - **Responsibilities (real):** ✔ `GET` — Clerk auth (`auth()`); reads `?since=`; returns latest 20 `orders`, latest 20 `human_active` `conversations` (with last message), and an aggregate `stats` object (new/in_progress orders, pending/assigned dispatch, escalated/active conversations, pending_user_reply, available/busy drivers). Returns `timestamp`.
  - **Problem (real):** This is the server side of the "realtime" feature but it is just a snapshot query polled every 15s — there is no change-stream, no pub/sub, no event emission. The route name implies push; the implementation is pull. Notification *generation* is left to the client diffing `since`.

- **File:** `app/components/chat/ChatWidget.tsx` (realtime aspect)
  - **Responsibilities (real):** ✔ Polls `/api/chat/messages?conversationId=…` every 5s while open; deduplicates by id/content; resets inactivity timers on new messages. This is the chat-channel "realtime" path, separate from the admin realtime context.
  - **Problem (real):** A third polling site. Chat freshness depends entirely on a 5s client poll; there is no server push and no shared realtime abstraction between admin and chat.

## Module-level real responsibilities

- ✔ Admin live dashboard: orders, escalated conversations, aggregate stats, and synthesized notifications — delivered via **15s client polling**.
- ✔ Generic client polling primitive (`usePolling`) used by other admin screens.
- ✔ Chat widget message freshness — delivered via **5s client polling** of `/api/chat/messages`.
- ✔ Server snapshot endpoint `/api/admin/realtime` that the admin poll calls.

## Proposed split (target per Blueprint domains/packages)

- `packages/infra/realtime` → a real push gateway (e.g. Socket.IO / SSE) as the single source of live events, with **polling kept only as a fallback** (exactly as the Blueprint prescribes). The notification/order/conversation "events" should be emitted server-side and broadcast, not re-derived client-side from `since` diffs.
- `packages/infra/realtime` → one shared client hook (replace both `realtime-context.tsx` interval and `use-polling.ts`); both today are hand-rolled `setInterval` + visibility logic.
- `app/api/admin/realtime` → becomes an event source / subscription endpoint rather than a polling snapshot; business events (new order, escalation) published by the domains that own them (orders, chat) through the realtime gateway.

## Dependency observations (real)

- Realtime has **no circular dependency**. Its only structural issue is duplication: three independent polling sites (`realtime-context.tsx` 15s, `use-polling.ts` 10s generic, `ChatWidget.tsx` 5s) and a server snapshot route that pretends to be push.
- The `/api/admin/realtime` route depends on `auth()` (Clerk) and the DB directly; it does not depend on notifications or queue, so it is isolated from the `lib/queue ↔ lib/n8n` cycle.
- Confirmed by grep: there is **no** `socket`, `websocket`, `EventSource`, or `Server-Sent` usage in `app/**` — realtime today is 100% polling.
