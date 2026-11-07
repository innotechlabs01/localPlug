# STRATEGIC ROADMAP

> **Where the platform is going in 1-3 years.**
> This is the North Star for all technical decisions.
> Every architectural choice should make the next phase easier, not harder.

---

## Phase 1: Core Platform (Now — Q3 2026)

**Goal:** Extract business logic from routes into domain services. Make the platform consumable.

| Milestone | Status | Impact |
|-----------|--------|--------|
| Foundation (B0-B7) | ✅ Done | Shared packages, config, auth, validation, types |
| Database Layer (B4) | ✅ Done | Drizzle ORM, dual runtime, 33 tables |
| Persistence Architecture (B8) | ✅ Done | Repository contract, CQRS, transactions |
| Domain Services (B9) | ✅ Done | BookingService reference, 5 stubs |
| Event Bus (B10) | ✅ Done | Typed events, outbox, handler contract |
| Notifications (B11) | ⬜ Next | First real event consumer |
| API Layer (B12) | ⬜ | Thin orchestrators, error envelope |
| Auth Persistence (B5B) | ⬜ | RBAC, permissions, claims |

**Exit criteria:** All business logic in domain services. Routes are thin orchestrators.

---

## Phase 2: Applications (Q4 2026)

**Goal:** Build the first applications that consume the platform.

| Application | Priority | Dependencies |
|-------------|----------|--------------|
| Admin Portal (refactor) | P0 | B13-B21 (all domains) |
| Driver Portal (new) | P0 | B15, B14, B16, B19, B11, B23 |
| Customer Portal | P1 | B13, B19 |
| Landing Page | P1 | B7 (types only) |

**Exit criteria:** Admin on domains. Driver Portal live. Customer Portal live.

---

## Phase 3: Ecosystem (Q1 2027)

**Goal:** Open the platform to partners and third parties.

| Capability | Priority | Impact |
|-----------|----------|--------|
| Hotel Portal | P1 | Hotel partners manage their listings |
| Partner API | P1 | Travel agencies book via API |
| SDK | P2 | Third-party integrations |
| Corporate Accounts | P2 | B2B bookings |

**Exit criteria:** API accessible. First partner integrated.

---

## Phase 4: Scale (Q2-Q4 2027)

**Goal:** Multi-city expansion and platform maturity.

| Capability | Priority | Impact |
|-----------|----------|--------|
| Multi-city support | P0 | City-agnostic core, city-specific config |
| Agency Portal | P1 | Tour operators manage inventory |
| Operator Portal | P1 | Fleet operators manage drivers |
| Finance Portal | P2 | Accounting, reporting, tax compliance |
| Support Portal | P2 | Customer service tools |
| AI Console | P2 | Manage AI models, prompts, training |
| Analytics Dashboard | P1 | Real-time business intelligence |

**Exit criteria:** 3+ cities live. 10+ portal types. Self-service onboarding.

---

## Technical Decisions Driven by Roadmap

| Decision | Why |
|----------|-----|
| Monorepo (pnpm + Turborepo) | Shared packages across 10+ apps |
| Domain-Driven Design | Correct business boundaries for multi-app consumption |
| Event Bus (B10) | Decoupled domains enable independent app development |
| Repository Pattern (B8) | Swap persistence without changing business logic |
| Feature Flags | Gradual rollout across cities and apps |
| Turso (libSQL) | Edge-ready for global expansion |
| Clerk | Multi-tenant auth ready for partner portals |

---

## What We Will NOT Build

| Avoid | Why |
|-------|-----|
| Monolithic admin | Already extracting to domains |
| God routes | B12 eliminates them |
| Direct DB access from UI | Constitution §4: UI → API → Domain → DB |
| Tightly coupled notifications | B10 event bus decouples them |
| City-specific hardcoding | Platform is city-agnostic by design |
