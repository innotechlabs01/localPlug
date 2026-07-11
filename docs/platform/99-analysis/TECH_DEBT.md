# TECH_DEBT

Prioritized technical debt for the **LocalPlug Business Platform**. Evidence from
`PLATFORM_DISCOVERY.md` (Etapa 1). Each item maps to an Epic and a severity. This list is
the input to the Platform Separation Project (Epics 2–5) and must be burned down before
Epic 6 (Driver Portal).

Severity: **Critical** (blocks platform extraction) · **High** (duplication / coupling risk)
· **Medium** (consistency / maintainability) · **Low** (hygiene).

---

## Critical — blocks the platform
- **C-1 · No domain layer.** Business logic lives in `app/api/*` route handlers and React
  components; there is no `packages/domains/*`. *Epic 3.* Impact: no app can be built without
  re-implementing logic.
- **C-2 · No monorepo / shared infra.** Single Next.js app; `packages/{api,db,auth,realtime}`
  do not exist. *Epic 4.* Impact: cannot share logic across Admin/Driver/Customer.
- **C-3 · No Drizzle (ADR-003 unimplemented).** Code uses raw `@libsql/client`. *Epic 4.*
  Impact: schema/query safety, migrations, and domain data access can't be shared cleanly.
- **C-4 · No realtime (ADR-004 unimplemented).** "Realtime" is client polling; no Socket.IO.
  *Epic 4.* Impact: Driver Portal assignment push can't be built on polling.
- **C-5 · DB access in the browser bundle.** `lib/db.ts` is imported by client components
  (`app/components/booking/lib/payment-store.ts`). *Epic 3/4.* Impact: security + boundary
  violation; blocks domain extraction.

## High — duplication & coupling
- **H-1 · Payment module duplicated.** `lib/services/payment-service.ts` vs
  `app/components/booking/lib/payment-store.ts` + two `PaymentRecord` types
  (`lib/payment-record.ts` vs `app/components/booking/lib/types.ts`). *Epic 3 (Payments).*
- **H-2 · Assignment creation duplicated.** `app/api/admin/dispatch/route.ts` (assign) and
  `app/api/assignments/route.ts` (POST) run identical INSERT + availability check + order
  transition. *Epic 3 (Dispatch).*
- **H-3 · Order-confirmation SQL duplicated.** `app/api/booking/route.ts:88` and
  `app/api/webhooks/paddle/route.ts:100`. *Epic 3 (Booking/Payments).*
- **H-4 · God-route `app/api/webhooks/n8n/route.ts`** (294-line `switch(event)`) performs
  cross-domain state changes inline — the de-facto untyped event bus. *Epic 4 (realtime) +
  Epic 3 (Notifications).*
- **H-5 · Auto-register viewer duplicated in 3 places** (`lib/admin/auth.ts`,
  `lib/admin/permissions.ts`, `app/api/webhooks/clerk/route.ts`). *Epic 4 (auth).*
- **H-6 · ES/EN detection duplicated 5×** (4 triggers in `lib/n8n/client.ts` + 1 in
  `lib/services/whatsapp-service.ts`), ignoring shared `lib/language-utils.ts#detectLanguage`.
  *Epic 3 (Notifications).*
- **H-7 · "Low-confidence → escalate" duplicated** in `app/api/webhooks/n8n/route.ts` and
  `app/api/chat/ai-response/route.ts`. *Epic 3 (Chat/AI).*
- **H-8 · Conversation find-or-create re-implemented 3×.** *Epic 3 (Chat/Notifications).*

## Medium — consistency & maintainability
- **M-1 · `lib/pricing.ts` is a redundant alias of `lib/config.ts`.** *Epic 3 (Booking).*
- **M-2 · Advance-booking-days rule inconsistent** (config=10, UI hardcodes +10, test expects
  15). Not config-driven. *Epic 3 (Booking).*
- **M-3 · Second schema path** — `lib/db/migrate-auto.ts#ensureSchema()` bootstraps
  RBAC tables outside the migration files. *Epic 4 (db).*
- **M-4 · Tight 1:1 Admin UI ↔ API coupling** (`lib/reservations-api.ts` bakes the contract).
  *Epic 5 (Admin).*
- **M-5 · `lib/services/whatsapp-service.ts` mixes DB + Evolution + OpenAI + i18n.** *Epic 3
  (Notifications).*
- **M-6 · `lib/n8n/client.ts` mixes HTTP client + circuit breaker + rate limiter + 6+ triggers
  + templating.** *Epic 3 (Notifications).*
- **M-7 · Vehicles not a separate aggregate** — vehicle fields live on `drivers`. *Epic 3
  (Vehicles).*
- **M-8 · No explicit "Trip" concept** — trips = `orders` + `assignments` implicitly. *Epic 3
  (Trips).*

## Low — hygiene / docs / process
- **L-1 · Booking lookup SQL overlap** across `booking-service.ts`, `bookings/search`,
  `flights/validate`. *Epic 3 (Booking).*
- **L-2 · DB rules not in a dedicated `03-database/` section; ERD not produced.** *Docs.*
- **L-3 · CI quality gates (lint/typecheck/test) not enforced as required by
  `../03-engineering/quality-gates.md`.** *Process (Epic 4).*
- **L-4 · No auto-generated API reference from route handlers.** *Docs.*
- **L-5 · `01-business/*` READMEs concise; detailed field specs still in `archive/spec-v1`.**
  *Docs (port gradually).*

---

## Mitigation
- Critical/High items become tracked tasks under Epics 2–5 and are resolved by **extraction,
  not new features**.
- Each extraction target maps to a domain in `PLATFORM_DISCOVERY.md` §8.
- Nothing here is "new product work" — it is paying down debt so Epic 6+ can be built fast.
- Re-run the Platform Audit (`PLATFORM_AUDIT.md`) after each epic to confirm the boundary holds.
