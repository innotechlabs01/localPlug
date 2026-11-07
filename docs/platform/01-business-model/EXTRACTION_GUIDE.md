# EXTRACTION_GUIDE

> Step-by-step process for extracting any business capability from Admin into the platform.
> Every capability follows the same process. No exceptions.

---

## Pre-Conditions

Before extracting any capability:

1. **Epic 2D is complete** — capability scored, domain template defined
2. **B10 (Event Bus + Outbox)** — events available for publishing
3. **B11A (Communication Architecture)** — notification contract exists
4. **B11B (Communication Runtime)** — notification channel ready (optional, can proceed in parallel)

---

## Phase 0: Conceptual Separation (Epic 2D)

**Goal**: Know what the capability IS before writing code.

| Step | Task | Output |
|------|------|--------|
| 0.1 | Score the capability on 10 dimensions | MATURITY.md |
| 0.2 | Define entities, value objects, aggregates | DOMAIN_MODEL.md |
| 0.3 | Define business rules and policies | POLICIES.md |
| 0.4 | Define domain events | EVENTS.md |
| 0.5 | Define repository contracts | REPOSITORIES.md |
| 0.6 | Define RBAC and ownership rules | PERMISSIONS.md |
| 0.7 | Define API contracts | API.md |
| 0.8 | Define database schema | DATABASE.md |
| 0.9 | Define extraction roadmap | ROADMAP.md |

**Gate**: All 13 files exist and are reviewed. No code written.

---

## Phase 1: Infrastructure

**Goal**: Database and persistence layer ready.

| Step | Task | Output |
|------|------|--------|
| 1.1 | Create domain package | `packages/domains/{capability}/` |
| 1.2 | Create entities | `packages/domains/{capability}/src/entities/` |
| 1.3 | Create value objects | `packages/domains/{capability}/src/value-objects/` |
| 1.4 | Create repository contracts | `packages/domains/{capability}/src/repositories/` |
| 1.5 | Create DB schema (Drizzle) | `packages/db/src/domains/{capability}/` |
| 1.6 | Create migrations | `packages/db/migrations/` |
| 1.7 | Implement repositories | `packages/domains/{capability}/src/repositories/implementation/` |

**Gate**: Repositories pass basic CRUD tests.

---

## Phase 2: Domain Services

**Goal**: Business logic in domain package, not in API routes.

| Step | Task | Output |
|------|------|--------|
| 2.1 | Create domain services | `packages/domains/{capability}/src/services/` |
| 2.2 | Implement business rules | Policies in domain service |
| 2.3 | Create event publishers | `packages/domains/{capability}/src/events/` |
| 2.4 | Create mappers | `packages/domains/{capability}/src/mappers/` |
| 2.5 | Create validation schemas | `packages/validation/src/{capability}/` |

**Gate**: Domain service tests pass. No business logic in API routes.

---

## Phase 3: API Routes

**Goal**: Thin orchestrators over domain services.

| Step | Task | Output |
|------|------|--------|
| 3.1 | Create route file | `app/api/{capability}/route.ts` |
| 3.2 | Extract logic from Admin page | Move to domain service |
| 3.3 | Route validates → calls service → returns | Thin orchestrator |
| 3.4 | Add RBAC middleware | `packages/auth/` |
| 3.5 | Add validation middleware | `packages/validation/` |

**Gate**: API routes contain zero business logic. All logic in domain.

---

## Phase 4: Admin Page Refactor

**Goal**: Admin page consumes API, not direct DB.

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create hooks | `hooks/use{Capability}.ts` |
| 4.2 | Create components | `components/{capability}/` |
| 4.3 | Refactor admin page | `app/admin/{capability}/page.tsx` |
| 4.4 | Remove direct DB calls | No `db.select()` in page |
| 4.5 | Add loading/error states | Skeletons, error boundaries |

**Gate**: Admin page uses only API calls. No direct DB access.

---

## Phase 5: Events

**Goal**: Domain publishes events on state changes.

| Step | Task | Output |
|------|------|--------|
| 5.1 | Define events | `packages/events/src/types.ts` |
| 5.2 | Publish from domain service | After successful state change |
| 5.3 | Create consumers | `packages/events/src/consumers/{capability}/` |
| 5.4 | Add outbox support | `packages/events/src/outbox.ts` |

**Gate**: Events published for all state changes. Consumers handle events.

---

## Phase 6: Tests

**Goal**: Full test coverage.

| Step | Task | Output |
|------|------|--------|
| 6.1 | Unit tests | Domain services |
| 6.2 | Integration tests | Repositories |
| 6.3 | Contract tests | API routes |
| 6.4 | E2E tests | Full flow (optional) |

**Gate**: All tests pass. Coverage > 70%.

---

## Phase 7: Documentation

**Goal**: Domain fully documented.

| Step | Task | Output |
|------|------|--------|
| 7.1 | Update all 13 domain files | Based on implementation |
| 7.2 | Update MATURITY.md | Re-score dimensions |
| 7.3 | Update CAPABILITY_MATRIX.md | New score |

**Gate**: Documentation matches implementation. Score improves.

---

## Phase 8: Portal (Optional)

**Goal**: Standalone portal consuming domain services.

| Step | Task | Output |
|------|------|--------|
| 8.1 | Create portal project | `apps/{portal}/` |
| 8.2 | Implement auth | RBAC for portal users |
| 8.3 | Implement core features | Main workflow |
| 8.4 | Add offline support | PWA manifest |
| 8.5 | Deploy | Vercel / custom |

**Gate**: Portal production-ready.

---

## Parallel Track Rules

### Platform Line (B11B → B12 → B5B)
- No business logic changes
- Infrastructure improvements only
- Can proceed during Epic 2D
- Must not block business extraction

### Business Line (Capability Audit → Domain → Portal)
- Follows extraction phases 0-8
- Each capability independent
- Can extract in any order (priority by score)
- Must not duplicate logic (move, never copy)

### Merge Rules
- Platform changes merged first
- Business extraction on top of platform
- Never both changing the same file simultaneously
- Conflict resolution: platform wins (it's infrastructure)

---

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Duplication | Move behavior, never copy. Constitution §14 |
| Logic in API routes | Domain services own all business rules |
| Direct DB in pages | Always go through API → domain service |
| Mixing event types | Business ≠ Integration ≠ System |
| Breaking events | Additive only, never remove/rename fields |
| Skipping tests | Extraction without tests = technical debt |
| Partial extraction | Full capability or don't start |
