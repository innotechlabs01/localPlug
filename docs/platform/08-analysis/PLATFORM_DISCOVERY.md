# PLATFORM_DISCOVERY

> **Etapa 1 — Descubrir la plataforma actual.** Output of the discovery pass over the
> running codebase (`premium-andean-hospitality`). No code was changed. This is the
> evidence base for Epic 1 (Platform Discovery) and the source of items in `TECH_DEBT.md`.
>
> Companion to `CURRENT_ARCHITECTURE.md` (concise as-is snapshot) and
> `02-architecture/` (target design).

## 1. Modules that exist

| Area | Location |
|---|---|
| Booking (customer) | `app/booking/*`, `app/components/booking/*`, `lib/services/booking-service.ts`, `app/api/booking/route.ts`, `app/api/bookings/*`, `app/api/flights/validate/route.ts` |
| Reservations (admin) | `app/admin/reservations/*`, `app/api/admin/reservations/*`, `lib/reservations-api.ts`, `lib/reservations-types.ts` |
| Dispatch | `lib/dispatch/availability.ts` (clean), `app/api/admin/dispatch/route.ts`, `app/api/assignments/**`, `app/admin/dispatch/*`, `app/admin/logistics/*` |
| Drivers / Fleet / Vehicles | `app/admin/drivers/*`, `app/api/admin/drivers/**`, `app/admin/fleet/*`, `app/admin/agenda/*` |
| Customers | `app/admin/customers/*`, `app/api/admin/customers/route.ts` |
| Payments | `lib/services/payment-service.ts`, `lib/payment-record.ts`, `lib/paddle/server.ts`, `app/api/payments/**`, `app/api/webhooks/paddle/route.ts`, `app/api/admin/payments/**` |
| Notifications (WA + n8n) | `lib/services/whatsapp-service.ts`, `lib/n8n/client.ts`, `lib/whatsapp-event.ts`, `lib/queue/*`, `lib/resilience/circuit-breaker.ts`, `app/api/webhooks/evolution/route.ts`, `app/api/cron/process-queue/route.ts` |
| Chat / Support | `lib/services/chat-service.ts`, `lib/services/agent-service.ts`, `lib/conversation.ts`, `app/api/chat/**`, `app/admin/ia-chat/*`, `app/admin/support/*` |
| AI / Concierge | `lib/services/ollama-service.ts`, `lib/services/whatsapp-service.ts#generateAIResponse`, `lib/n8n/client.ts#triggerAiChatMessage`, `app/api/chat/ai-response/route.ts`, landing content components |
| Analytics / Intelligence | `app/admin/analytics/*`, `app/api/admin/analytics/route.ts`, `app/admin/intelligence/*` |
| Settings / Config | `lib/config.ts`, `app/api/admin/settings/route.ts`, `app/api/config/route.ts`, `app/admin/settings/*` |
| Auth / RBAC | `middleware.ts`, `lib/admin/{auth,permissions,hotel-auth}.ts`, `app/api/admin/permissions/**`, `app/api/admin/roles/route.ts`, `app/api/admin/team/**`, `app/api/webhooks/clerk/route.ts`, `lib/webhook-auth.ts` |
| Cases / Compliance | `app/admin/cases/**`, `app/api/admin/cases/**` |
| Hotels / Rooms / Promotions | `app/admin/hotels/*`, `app/admin/inventory/*`, `app/api/admin/hotels/**`, `app/api/hotels/route.ts`, `app/api/admin/promotions/route.ts` |
| Ratings | `lib/services/rating-service.ts`, `app/components/ratings/*`, `app/api/ratings/**` |
| Moderation | `lib/moderation/comment-filter.ts` |
| Maps | `app/components/ui/leaflet-map.tsx`, `app/api/geocode/route.ts` |
| Cross-cutting utils | `lib/db.ts`, `lib/date-utils.ts`, `lib/phone-utils.ts`, `lib/string-utils.ts`, `lib/countries.ts`, `lib/language-utils.ts`, `lib/rate-limit.ts`, `lib/logger.ts`, `lib/i18n/*` |

## 2. Where business logic lives (problem)
Domain logic is **overwhelmingly embedded in `app/api/*` route handlers and React
components**, not in `lib/`. Examples:
- `app/api/admin/dispatch/route.ts` (289 lines): dispatch state machine + availability +
  order transitions + n8n trigger inline.
- `app/api/booking/route.ts`: order creation + duplicate-reference guard + payment reconcile.
- `app/api/webhooks/paddle/route.ts`: payment-split calc + order confirmation.
- `app/api/webhooks/n8n/route.ts` (294 lines): giant `switch(event)` mutating chat/payments/
  flags inline for ~10 event types — the de-facto event bus, with no separation.
- `app/components/booking/step-flight-logistics.tsx`: `getMinDate()` date math + return-date
  rules in the UI.
- `app/components/booking/lib/payment-store.ts`: DB access inside the browser bundle.

Pure data access (good): `lib/db.ts`, `lib/services/payment-service.ts`,
`lib/services/rating-service.ts`, `lib/services/agent-service.ts`, `lib/services/booking-service.ts`.

## 3. Duplication (top findings)
1. **Payment data-access twice** — `lib/services/payment-service.ts` vs
   `app/components/booking/lib/payment-store.ts` (same `payments` table) + **two
   `PaymentRecord` types** (`lib/payment-record.ts` vs `app/components/booking/lib/types.ts`).
2. **Order-confirmation SQL** duplicated in `app/api/booking/route.ts:88` and
   `app/api/webhooks/paddle/route.ts:100`.
3. **Assignment creation** duplicated in `app/api/admin/dispatch/route.ts` (assign) and
   `app/api/assignments/route.ts` (POST).
4. **ES/EN detection** copy-pasted in 4 `lib/n8n/client.ts` triggers + a 5th copy in
   `lib/services/whatsapp-service.ts`; ignores shared `lib/language-utils.ts#detectLanguage`.
5. **"Low-confidence → escalate"** duplicated in `app/api/webhooks/n8n/route.ts` and
   `app/api/chat/ai-response/route.ts`.
6. **Conversation find-or-create** re-implemented in 3 places.
7. **Auto-register viewer user** in 3 copies (`lib/admin/auth.ts`, `lib/admin/permissions.ts`,
   `app/api/webhooks/clerk/route.ts`).
8. **Pricing indirection** — `lib/pricing.ts` is a redundant alias of `lib/config.ts`.
9. **Advance-booking-days**: `lib/config.ts` says default 10, UI hardcodes `+10`, test
   expects 15 — rule not config-driven and self-contradictory.

## 4. Mixing / coupling (top findings)
- `app/api/admin/dispatch/route.ts`: persistence + domain rules + side-effects + HTTP in one file.
- `app/api/webhooks/n8n/route.ts`: cross-domain state changes inline in a 294-line switch.
- `lib/services/whatsapp-service.ts`: DB writes + Evolution orchestration + OpenAI + i18n in one module.
- `lib/n8n/client.ts`: HTTP client + circuit breaker + rate limiter + 6+ triggers + templating.
- `lib/admin/auth.ts` & `lib/admin/permissions.ts`: overlapping RBAC + auto-registration + Clerk sync.
- Tight 1:1 Admin UI ↔ API coupling (`lib/reservations-api.ts` bakes the contract in).
- `lib/db.ts` imported by both server routes **and** client components (DB in browser bundle).

## 5. Data / DB layer
- `@libsql/client` against Turso. **No Drizzle.** Single shared remote DB, no per-domain schemas.
- `lib/db.ts`: `getDb()` singleton, `executeWithRetry` (SQLITE_BUSY/LOCKED backoff),
  `buildSafeUpdate` (whitelisted columns).
- 30 migrations in `lib/db/migrations/*.sql`, applied by `scripts/migrate.ts`.
- **Second schema path**: `lib/db/migrate-auto.ts#ensureSchema()` bootstraps
  `modules/role_permissions/roles` separately from the migration files.
- Core tables: `orders` (central, links Booking+Trips+Dispatch+Payments), `payments`,
  `conversations/messages/support_agents`, `customers`, `drivers` (vehicle fields live here),
  `assignments`, `cases*`, `hotels/rooms/promotions`, `ratings`, `settings`,
  `users/roles/user_roles/modules/role_permissions`, `outgoing_messages/whatsapp_events`.

## 6. Realtime / events (today)
- **No Socket.IO / WebSocket.** Realtime faked via polling: `app/admin/dispatch/use-polling.ts`
  (10s), `lib/admin/realtime-context.tsx` (15s), `app/api/admin/realtime/route.ts`.
- Queue: `lib/queue/message-queue.ts` (DB-backed `outgoing_messages`) + `lib/queue/whatsapp-worker.ts`,
  driven **only by cron** `app/api/cron/process-queue/route.ts` — no standalone worker.
- Resilience: `lib/resilience/circuit-breaker.ts` (guards Evolution/n8n).
- "Event bus" = untyped HTTP POSTs: `app/api/webhooks/n8n/route.ts` (string `event` switch) +
  `app/api/webhooks/evolution/route.ts`. No correlation IDs, no broker.

## 7. Auth (today)
- Clerk (`clerkMiddleware` in `middleware.ts`); session cookie. Public/admin route matchers in
  `middleware.ts`.
- Custom DB-backed RBAC: `users/roles/user_roles/modules/role_permissions`.
  `lib/admin/auth.ts` (`requireRole`, auto-register viewer), `lib/admin/permissions.ts`
  (`getUserPermissions`/`requirePermission`), `lib/admin/hotel-auth.ts` (`resolveHotelContext`).
- Webhook auth: `lib/webhook-auth.ts` (generic), Clerk via Svix, n8n via `timingSafeEqual`.

## 8. Proposed domain mapping (current → target)
See `../02-architecture/packages.md` and `../02-architecture/ddd.md` for the target. Every row below
is a future `packages/domains/<domain>` whose logic must be **extracted** from the current files.

| Target domain | Extract from |
|---|---|
| Booking | `app/api/booking/*`, `app/api/bookings/*`, `lib/services/booking-service.ts`, `app/components/booking/lib/*`, `app/booking/*`, `lib/config.ts` (pricing), `lib/pricing.ts`, `lib/trm.ts` |
| Dispatch | `lib/dispatch/availability.ts` (keep), `app/api/admin/dispatch/route.ts`, `app/api/assignments/**`, `app/admin/dispatch/*`, `app/admin/logistics/*` |
| Drivers | `app/api/admin/drivers/**`, `app/admin/drivers/*` |
| Trips | `orders` + `assignments` logic in `app/api/admin/orders/**`, `app/admin/orders/*`, `app/admin/grid/*` (no explicit "trip" concept today) |
| Vehicles | vehicle fields on `drivers`; `app/admin/fleet/*` (become own aggregate) |
| Customers | `app/api/admin/customers/route.ts`, `app/admin/customers/*` |
| Payments | `lib/services/payment-service.ts`, `lib/payment-record.ts`, `lib/paddle/server.ts`, `app/api/payments/**`, `app/api/webhooks/paddle/route.ts`, `app/api/admin/payments/**` (delete `app/components/booking/lib/payment-store.ts`) |
| Notifications | `lib/services/whatsapp-service.ts`, `lib/n8n/client.ts`, `lib/whatsapp-event.ts`, `lib/queue/*`, `lib/resilience/circuit-breaker.ts`, `app/api/webhooks/evolution/route.ts`, `app/api/cron/process-queue/route.ts` |
| Chat / Support | `lib/services/chat-service.ts`, `lib/services/agent-service.ts`, `lib/conversation.ts`, `app/api/chat/**`, `app/admin/ia-chat/*`, `app/admin/support/*` |
| AI / Concierge | `lib/services/ollama-service.ts`, `lib/services/whatsapp-service.ts#generateAIResponse`, `lib/n8n/client.ts#triggerAiChatMessage`, `app/api/chat/ai-response/route.ts`, landing content |
| Analytics | `app/api/admin/analytics/route.ts`, `app/admin/analytics/*`, `app/admin/intelligence/*` |
| Settings | `lib/config.ts`, `app/api/admin/settings/route.ts`, `app/api/config/route.ts`, `app/admin/settings/*` |
| Auth / RBAC | `middleware.ts`, `lib/admin/{auth,permissions,hotel-auth}.ts`, `app/api/admin/permissions/**`, `app/api/admin/roles/route.ts`, `app/api/admin/team/**`, `app/api/webhooks/clerk/route.ts`, `lib/webhook-auth.ts`, `lib/db/migrate-auto.ts` |
| Cases / Compliance | `app/admin/cases/**`, `app/api/admin/cases/**` |
| Hotels / Promotions | `app/admin/hotels/*`, `app/admin/inventory/*`, `app/api/admin/hotels/**`, `app/api/hotels/route.ts`, `app/api/admin/promotions/route.ts` |
| Ratings | `lib/services/rating-service.ts`, `app/components/ratings/*`, `app/api/ratings/**` |
| Maps | `app/components/ui/leaflet-map.tsx`, `app/api/geocode/route.ts` |
| Content (Landing) | `app/page.tsx`, `app/components/{hero,pricing,experiences,how-it-works,testimonials,stats,cta,about}/*` → `apps/landing` |
| `packages/db` | `lib/db.ts`, `lib/db/migrate-auto.ts`, `scripts/migrate.ts`, `lib/db/migrations/*` |
| `packages/api` | all `app/api/**` (after extracting domain logic) |
| `packages/auth` | `middleware.ts` + `lib/admin/*` auth/permissions |
| `packages/realtime` | new (replaces polling): `use-polling.ts`, `realtime-context.tsx`, `app/api/admin/realtime/route.ts`, `app/api/cron/process-queue/route.ts`, `lib/queue/*` |

**Highest-value, lowest-risk extraction targets:**
1. Dispatch domain service (removes assignment-creation duplication).
2. Collapse the two payment modules into one `Payments` domain.
3. Centralize message templating + language detection in `Notifications`.
4. Replace the n8n webhook `switch` with a typed event dispatcher (foundation for `realtime`).
5. Unify the 3 auto-registration copies into one `Auth` bootstrap.
6. Replace client polling with a real `packages/realtime` (Socket.IO per ADR-004).
