# CURRENT_ARCHITECTURE (as-is)

Snapshot of the **actual code that exists today** (2026-07-11), discovered in Etapa 1
(see `PLATFORM_DISCOVERY.md` for the detailed module map). This is the starting point of
the Platform Separation Project. It is deliberately distinct from the **target** design
in `02-architecture/` — read both to understand the gap.

## Reality check
The `docs/platform/` architecture (ADRs, monorepo, DDD) describes where we are **going**,
not where we are. The running system is a single Next.js application.

| Aspect | Documented target (`02-architecture/`, ADRs) | Actual code today |
|---|---|---|
| Repo shape | Turborepo monorepo, `apps/*` + `packages/*` | Single Next.js app `premium-andean-hospitality` |
| Data layer | Turso **+ Drizzle** (ADR-003) | Raw `@libsql/client` (no Drizzle) |
| Realtime | **Socket.IO** event bus (ADR-004) | Client-side polling (`use-polling.ts`, `realtime-context.tsx`) |
| Domains | `packages/domains/*` own logic | Logic embedded in `app/api/*` route handlers + React components |
| Apps | admin / driver / customer / landing | Only `admin` + `booking` + landing exist; driver/customer = none |

## Topology (today)
```
premium-andean-hospitality  (one Next.js 15 App Router app)
├── app/admin/*        Admin portal (booking, drivers, fleet, dispatch, orders,
│                      customers, payments, analytics, settings, support, cases, hotels)
├── app/api/*          Route handlers — most business logic lives here
├── app/booking/*      Customer booking flow (UI + persistence in the browser)
├── lib/*              Mixed bag: some services, some infra, some duplicated client code
├── middleware.ts      Clerk auth + custom RBAC
└── n8n/ , scripts/    n8n workflows, DB migrations (30 .sql files)
```

## Stack (actual)
- Next.js 15 + React 18 + TypeScript
- `@clerk/nextjs` (identity) + custom DB-backed RBAC (`users/roles/user_roles/modules/role_permissions`)
- `@libsql/client` (Turso remote) — raw SQL, `lib/db.ts`
- `@paddle/paddle-node-sdk` + `@paddle/paddle-js` (payments)
- n8n + Evolution API (WhatsApp); OpenAI + local ollama (AI chat)
- leaflet (maps); client polling for "realtime"

## Why this matters
The Platform Separation Project (Epics 1–5) exists to close the gap above: extract the
business logic out of `app/api/*` and components into `packages/domains/*`, add the missing
infrastructure (`db`/Drizzle, `realtime`/Socket.IO, `api`, `auth`), and turn `admin` into a
consumer of those domains. Until then, Driver Portal / Customer Portal cannot be built
cleanly — every new app would re-implement the same embedded logic.

See `PLATFORM_DISCOVERY.md` for the full module-by-module map, duplication, and coupling.
See `TECH_DEBT.md` for prioritized findings. See `02-architecture/` for the target.
