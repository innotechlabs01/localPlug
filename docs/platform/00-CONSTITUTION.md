# 00 — CONSTITUTION

**Version:** 2.0.0
**Date:** 2026-07-11
**Status:** Active — The immutable law of the LocalPlug Platform
**Supersedes:** `MASTER_SPEC.md` (v1.0.0)

> This document is the single source of truth. All code, plans, and reviews must
> align with it. It is intentionally short and non-negotiable. Detailed material
> lives in the layer folders referenced throughout.

---

## 1. Identity

LocalPlug is a **Business Operating System** for premium airport transfers and
tourism concierge in Medellín, Colombia. It connects Travelers, Drivers, and
Dispatchers across multiple applications built on shared business domains.

It is not a CRUD app. It is not an admin dashboard. It is a platform.

---

## 2. The Layered Priority (never invert)

```
Business Domains
      ↓
Application Layer
      ↓
Platform Services
      ↓
Infrastructure
```

- Business rules must **never** depend on frameworks.
- Applications are replaceable. Business Domains are permanent.
- Frameworks may change. Business rules never should.

---

## 3. Dependency Rules

```
apps/*            → packages/*  and  packages/domains/*
packages/api      → packages/domains/*, db, auth, realtime
packages/domains  → db, types, validation
packages/realtime → pure event broadcasting, NO business logic
packages/auth     → identity only, NO authorization rules
packages/db       → persistence only, NO business logic
packages/*        → NEVER import from apps/*
```

No circular dependencies. Dependencies flow downward only.

---

## 4. Inversion of Control (correct shape)

```
WRONG:  UI → Database
WRONG:  UI → API → Database
WRONG:  UI → Business Logic → Database

CORRECT:
  UI → API → Domain → Database
            ↕
         Realtime
```

---

## 5. Engineering Principles

- **SOLID** — single responsibility per package/domain; depend on abstractions.
- **DRY, but smart** — extract shared logic at the 2nd use case; never duplicate business logic; UI may duplicate when it diverges visually.
- **YAGNI, with foresight** — build today, leave extension points, no speculative features.
- **KISS, with depth** — simple surface, robust core; every abstraction must justify itself.

---

## 6. Domain-Driven Design

- Domains communicate through **events**, never direct calls.
- Each domain owns its data — no cross-domain queries.
- Domain logic lives in `packages/domains/*`, never in UI or API routes.
- Domain events are the only way to trigger cross-boundary side effects.
- Each domain has its own validation schemas (Zod).

### Domain catalog

| Domain | Responsibility | Key Entities |
|---|---|---|
| Booking | Reservation lifecycle, pricing, requests | Booking, Quote, Promotion |
| Dispatch | Assignment engine, matching, queue | Assignment, Queue, Match |
| Drivers | Registration, claim, profile, compliance | Driver, Document, Session |
| Trips | Trip lifecycle, transitions, completion | Trip, Route, Milestone |
| Vehicles | Registry, fleet, categorization | Vehicle, Category, Assignment |
| Customers | Profiles, history, preferences | Customer, Preference, History |
| Payments | Earnings, commissions, payouts | Earning, Commission, Payout |
| Notifications | Push, in-app, WhatsApp rules | Notification, Template, Channel |
| Analytics | Metrics, reporting, tracking | Metric, Report, Dashboard |
| Content | Experiences, tours, curated services | Experience, Category, Media |

---

## 7. Applications

- Admin Portal (Next.js 15, Web) — active
- Driver Portal (Next.js 15, PWA) — planned (starts only after Epic 2C + domains stable + shared infra + Admin on domains)
- Customer Portal (Next.js 15, PWA) — planned
- Landing (Next.js 15, Web) — active

Each app: own `package.json`, deployable independently, shares logic via
`packages/domains`, shares infra via `packages/*`. **Apps never contain business logic.**

---

## 8. Data & Persistence

- Engine: **Turso** (libSQL) + **Drizzle** ORM.
- UUID v4 primary keys on every table.
- Soft deletes (`deleted_at` + `deleted_by`) on core tables.
- Optimistic concurrency (`version` + `updated_at`) on hot tables.
- Audit timestamps (`created_at`, `updated_at`) everywhere.
- Enums for status; unique constraints enforce business rules; explicit FKs.

---

## 9. Realtime

- **Socket.IO** from day one; WebSocket with HTTP fallback.
- Rooms: `driver:{id}`, `dispatch`, `admin`, `all-drivers`.
- No business logic in the realtime layer; events are typed and validated.
- Horizontal scaling via Redis adapter; persistent process (never serverless).

---

## 10. Auth & Authorization

- Identity: **Clerk** sessions + branded **OTP via WhatsApp** (Evolution API).
- Phone is the driver primary identifier (`UNIQUE`); claim-first prevents duplicates.
- `packages/auth` = identity only; authorization (RBAC) lives in domain services.
- Drivers access only their own data; admin roles: admin, manager, concierge, viewer.

---

## 11. Events

- Immutable once published; typed via `packages/types`; correlation IDs for tracing.
- No business logic in handlers; handlers idempotent; failures logged, never blocking.
- `Domain Service → Event Bus → Socket.IO Server → Room Broadcast → Clients`.

---

## 12. Quality Gates (must pass before any file is created)

```
□ Does this duplicate logic?
□ Does this belong to the correct domain?
□ Is there already a shared component?
□ Does this respect the monorepo?
□ Does this break the API?
□ Does this affect realtime?
□ Does this require migration?
□ Is this reusable?
□ Is this documented?
```

Any "no" → stop, explain, propose the correct approach. Record material decisions as ADRs in `05-decisions/`.

---

## 13. Documentation Rule

Every architectural decision is documented. Documentation is **migrated, never deleted** —
old versions live in `archive/`. See `PLATFORM_INDEX.md` for the reading order.

---

## 14. Refactoring Principle (Ownership over Duplication)

This is a permanent platform principle, adopted from the Platform Blueprint (Epic 2A):

- **We do not refactor because code is duplicated. We refactor because ownership is
  incorrect.** The objective of restructuring is **correct business boundaries**, not
  cleaner code.
- The approved **Platform Blueprint** (`02-architecture/blueprint/`) is the architectural
  source of truth for restructuring. Epic 2C executes it; it does not redefine it.
- During migration we **move behavior, we do not change behavior.** A user-visible change
  is a regression unless it was explicitly planned as part of a step.
- Every migration step is independently deployable, incremental, and reversible. No
  "big bang." See `02-architecture/blueprint/EXECUTION_GUIDE.md`.
