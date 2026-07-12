# EPIC 3: BUSINESS CAPABILITY EXTRACTION

> Define every business domain with uniform structure.
> No code. Only documentation.
> When this epic completes, every domain is fully defined and applications become composition.

---

## Objective

Consolidate all 16 business domains with the same level of detail as Driver.
Each domain gets 9 files. No exceptions. No shortcuts.

When this epic completes:
- Every domain is fully defined (entities, events, policies, state machines, workflows)
- Driver stops being special — it's just an application that consumes domains
- Applications (Admin, Driver Portal, Customer Portal, Hotel Portal) become thin consumers
- No new business rules discovered during implementation

---

## Why Now

1. **Only Driver has full extraction strategy** — all other domains are embedded in Admin
2. **Building applications without defined domains** = discovering rules while coding = rework
3. **Platform maturity requires uniform domains** — not a collection of modules
4. **Each new portal should be composition**, not discovery

---

## Uniform Domain Structure

Every domain folder in `01-business/domains/{domain}/` MUST have exactly these 9 files:

```
{domain}/
├── README.md           ← Overview, responsibility, boundaries, status
├── DOMAIN_MODEL.md     ← Entities, value objects, aggregates, relationships
├── EVENTS.md           ← Domain events produced and consumed
├── POLICIES.md         ← Business rules, constraints, invariants
├── API.md              ← API routes, contracts, RBAC
├── STATE_MACHINE.md    ← State transitions, guards, side effects
├── WORKFLOWS.md        ← End-to-end business workflows
├── UI.md               ← Application layer, components, pages
└── MIGRATION.md        ← Extraction plan, dependencies, effort
```

---

## Domains to Define

| # | Domain | Priority | Complexity | Status |
|---|--------|:--------:|:----------:|:------:|
| 1 | Hotels | 1 | High | 🔴 Full detail |
| 2 | Customers | 2 | Medium | 🔴 Full detail |
| 3 | Chat | 3 | High | 🔴 Full detail |
| 4 | AI | 4 | High | 🔴 Full detail |
| 5 | Payments | 5 | High | 🔴 Full detail |
| 6 | Booking | 6 | High | ⚠️ Enhance existing |
| 7 | Dispatch | 7 | Medium | ⚠️ Enhance existing |
| 8 | Drivers | 8 | Low | ✅ Reference (already done) |
| 9 | Trips | 9 | Medium | ⚠️ Enhance existing |
| 10 | Vehicles | 10 | Low | ⚠️ Enhance existing |
| 11 | Ratings | 11 | Low | 🔴 Stub |
| 12 | Cases | 12 | Low | 🔴 Stub |
| 13 | Notifications | 13 | Medium | 🔴 Stub |
| 14 | Settings | 14 | Low | 🔴 Stub |
| 15 | Analytics | 15 | Medium | 🔴 Stub |
| 16 | Maps | 16 | Low | 🔴 Stub |

---

## Phase 1: Template + High-Priority Domains

Create the uniform template and fill in the 5 highest-priority domains with full detail:

1. Hotels (largest embedded domain)
2. Customers (schema discrepancy)
3. Chat (most complex, AI coupling)
4. AI (tightly coupled to Chat)
5. Payments (3 duplicate implementations)

## Phase 2: Enhance Existing Domains

Enhance domains that already have partial extraction:

6. Booking
7. Dispatch
8. Drivers (reference)
9. Trips
10. Vehicles

## Phase 3: Stub Remaining Domains

Create stubs for domains with lower priority:

11. Ratings
12. Cases
13. Notifications
14. Settings
15. Analytics
16. Maps

---

## Gate

Epic 3 is complete when:
- [ ] All 16 domains have 9 files each (144 files total)
- [ ] Every domain has DOMAIN_MODEL with entities, value objects, aggregates
- [ ] Every domain has EVENTS with produced and consumed events
- [ ] Every domain has POLICIES with business rules
- [ ] Every domain has STATE_MACHINE (where applicable)
- [ ] Every domain has WORKFLOWS with end-to-end flows
- [ ] No domain is "special" — all follow the same structure
- [ ] No code written (documentation only)

---

## After Epic 3

Once all domains are defined:
1. Applications become thin consumers (composition, not discovery)
2. Each portal is built by composing domain services
3. No new business rules discovered during implementation
4. Platform is truly mature

---

## Rules

1. **Uniform structure** — 9 files per domain, no exceptions
2. **Same detail level** — every domain has the same depth as Driver
3. **No code** — documentation only
4. **Business perspective** — entities, events, policies, not technical implementation
5. **Cross-references** — domains reference each other via events, not direct calls
