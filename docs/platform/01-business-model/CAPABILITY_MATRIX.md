# CAPABILITY_MATRIX (All Business Capabilities)

> Every capability in LocalPlug, scored on 10 dimensions.
> Evolution stages: Capability → Domain → Runtime → Application → Portal
> Last scored: 2026-07-11

---

## Evolution Stages

| Stage | Meaning | Gate |
|-------|---------|------|
| **Capability** | Concept exists, no code | Documented in CAPABILITY_MATRIX |
| **Domain** | Domain package with entities, services, repos | All 13 domain files exist |
| **Runtime** | Events published, outbox pattern working | Events flow through bus |
| **Application** | Admin page consumes API (no direct DB) | Admin refactored |
| **Portal** | Standalone portal consuming domain services | Portal deployed |

---

## Summary

| Capability | Score | Stage | Evolution | Priority |
|------------|:-----:|:-----:|:---------:|:--------:|
| Drivers | 72% | Runtime | ✅ Complete | — |
| Booking | 65% | Runtime | ✅ Complete | — |
| Dispatch | 55% | Runtime | ✅ Complete | — |
| Payments | 52% | Runtime | ⚠️ Consolidate 3 impls | — |
| Vehicles | 48% | Runtime | ✅ Complete (B17) | — |
| Trips | 45% | Runtime | ✅ Complete (B16) | — |
| Notifications | 40% | Domain | ⏳ B11B pending | — |
| Hotels | 28% | Capability | 🔴 Extract first | 1 |
| Customers | 25% | Capability | 🔴 Schema fix first | 2 |
| Ratings | 28% | Capability | 🔴 Consolidate 2 tables | 3 |
| Cases | 22% | Capability | 🔴 Clean boundaries | 4 |
| Chat | 22% | Capability | 🔴 Most complex | 5 |
| AI | 18% | Capability | 🔴 Extract with Chat | 6 |
| Analytics | 18% | Capability | 🔴 Read-only, lowest effort | 7 |
| Settings | 30% | Capability | 🔴 High coupling | 8 |
| Maps | 10% | Capability | Future | — |
| Moderation | 12% | Capability | Future | — |
| Partners | 5% | Capability | Future | — |
| CRM | 5% | Capability | Future | — |
| Support | 8% | Capability | Future | — |

---

## Detailed Scoring

### DRIVERS — 72% ⭐

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 9 | Clear ownership, well-defined responsibility |
| Architecture | 8 | Full domain package: entities, services, repos, policies |
| Engineering | 8 | Clean separation, repository pattern |
| Infrastructure | 8 | 4 tables, clean schema, migrations |
| Application | 7 | Admin consumes API, portal consumes domain |
| Portal | 8 | Driver Portal exists, first new app |
| Tests | 6 | Some integration tests, no E2E |
| Events | 5 | Events defined, some published, few consumers |
| API | 7 | API routes thin, delegate to services |
| Documentation | 8 | Domain blueprint, entity models documented |

### BOOKING — 65%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 8 | Clear ownership, state machine defined |
| Architecture | 7 | Domain service with entities, repo stubs |
| Engineering | 6 | Some logic still in API routes |
| Infrastructure | 7 | Orders table (20+ cols), experience_bookings |
| Application | 5 | Admin reads directly from DB in places |
| Portal | 0 | No customer portal yet |
| Tests | 5 | Some integration tests |
| Events | 7 | booking.created/confirmed/cancelled published |
| API | 5 | Some routes are thin, some have logic |
| Documentation | 5 | Blueprint exists, some gaps |

### DISPATCH — 55%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 6 | Ownership documented, some separation |
| Architecture | 5 | AssignmentService stub, some logic in routes |
| Engineering | 5 | Mixed: some domain, some inline |
| Infrastructure | 6 | driver_availability, assignments tables |
| Application | 5 | Admin page has client-side dispatch logic |
| Portal | 0 | No standalone portal |
| Tests | 3 | Minimal tests |
| Events | 5 | assignment.created/accepted/rejected |
| API | 4 | API routes have business logic |
| Documentation | 4 | Basic blueprint |

### PAYMENTS — 52%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 7 | Clear payment domain, split logic defined |
| Architecture | 5 | Domain service exists + 2 duplicates |
| Engineering | 4 | 3 duplicate implementations (lib, app, packages) |
| Infrastructure | 7 | payments table with splits, clean schema |
| Application | 5 | Step-payment.tsx uses API |
| Portal | 0 | No finance portal |
| Tests | 3 | Some webhook tests |
| Events | 7 | payment.succeeded/failed/refunded |
| API | 6 | Most routes thin, some have logic |
| Documentation | 3 | Flow docs exist, no domain blueprint |

### VEHICLES — 48%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 6 | Extracted from drivers |
| Architecture | 4 | Basic domain structure |
| Engineering | 4 | Some separation, some coupling |
| Infrastructure | 5 | vehicles table, driver_vehicles junction |
| Application | 4 | Admin CRUD |
| Portal | 0 | No portal |
| Tests | 2 | Minimal |
| Events | 3 | vehicle.registered defined |
| API | 4 | Basic CRUD routes |
| Documentation | 3 | Basic |

### TRIPS — 45%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 5 | Derived from orders + assignments |
| Architecture | 4 | Basic structure |
| Engineering | 4 | Some separation |
| Infrastructure | 5 | trips table, state machine |
| Application | 4 | Admin view |
| Portal | 0 | No portal |
| Tests | 2 | Minimal |
| Events | 4 | trip.started/completed |
| API | 4 | Basic |
| Documentation | 3 | State machine documented |

### NOTIFICATIONS — 40%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 7 | Architecture contract complete (B11A) |
| Architecture | 3 | Contract exists, runtime pending |
| Engineering | 2 | Still in n8n god module |
| Infrastructure | 4 | notifications table exists |
| Application | 2 | Inline in other features |
| Portal | 0 | No portal |
| Tests | 1 | No tests |
| Events | 5 | Event mapping defined |
| API | 2 | No dedicated API |
| Documentation | 9 | 10 architecture docs complete |

### HOTELS — 28%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 3 | Identified but fully embedded in Admin |
| Architecture | 0 | No domain package |
| Engineering | 2 | All logic in API routes |
| Infrastructure | 5 | 4 tables, clean schema |
| Application | 2 | 935-line admin page, direct DB |
| Portal | 0 | No portal |
| Tests | 1 | No tests |
| Events | 1 | No events published |
| API | 2 | CRUD routes with business logic |
| Documentation | 2 | Basic analysis doc |

### CUSTOMERS — 25%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 3 | Identified but embedded |
| Architecture | 0 | No domain package |
| Engineering | 2 | Logic in API route |
| Infrastructure | 3 | Schema discrepancy (Drizzle vs raw SQL) |
| Application | 2 | Admin page, direct DB |
| Portal | 0 | No portal |
| Tests | 1 | No tests |
| Events | 1 | Types defined but not published |
| API | 2 | CRUD with sync function |
| Documentation | 1 | Minimal |

### RATINGS — 28%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 4 | Clear concept, some separation |
| Architecture | 2 | Service exists but not domain package |
| Engineering | 3 | rating-service.ts, some structure |
| Infrastructure | 3 | 2 duplicate tables (ratings + conversation_ratings) |
| Application | 3 | 4 components, chat integration |
| Portal | 0 | No portal |
| Tests | 1 | No tests |
| Events | 1 | rating.submitted defined |
| API | 3 | 3 routes |
| Documentation | 2 | Basic |

### CHAT — 22%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 3 | Concept exists, heavily coupled to AI |
| Architecture | 1 | Services in lib/, no domain package |
| Engineering | 2 | Mixed: chat-service + agent-service + n8n |
| Infrastructure | 4 | 5 tables, 3 migrations |
| Application | 3 | Widget + admin page, direct DB |
| Portal | 0 | No standalone portal |
| Tests | 4 | 6 test files (best tested embedded domain) |
| Events | 1 | No events |
| API | 2 | 12 routes with business logic |
| Documentation | 2 | Specs exist but not structured |

### SETTINGS — 30%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 4 | Clear concept, key-value store |
| Architecture | 1 | lib/settings.ts, no domain package |
| Engineering | 3 | Typed accessors, caching, 317L |
| Infrastructure | 4 | settings table, simple schema |
| Application | 3 | Admin page (553L) |
| Portal | 0 | No portal |
| Tests | 1 | No tests |
| Events | 1 | No events |
| API | 3 | GET/PUT route |
| Documentation | 4 | Design spec exists |

### ANALYTICS — 18%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 3 | Concept exists, no ownership |
| Architecture | 0 | No domain package, queries inline |
| Engineering | 1 | 8 SQL queries in API route |
| Infrastructure | 2 | No dedicated tables, queries existing data |
| Application | 2 | Admin page with SVG charts |
| Portal | 0 | No portal |
| Tests | 0 | No tests |
| Events | 1 | No events |
| API | 2 | Single route with all logic |
| Documentation | 1 | No domain docs |

### CASES — 22%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 4 | Clear case management concept |
| Architecture | 0 | No domain package |
| Engineering | 2 | Logic in API routes |
| Infrastructure | 4 | 4 tables, clean schema |
| Application | 2 | 1 detail page (273L) |
| Portal | 0 | No portal |
| Tests | 0 | No tests |
| Events | 0 | No events |
| API | 4 | 4 routes with CRUD |
| Documentation | 1 | Minimal |

### AI — 18%

| Dimension | Score | Evidence |
|-----------|:-----:|----------|
| Business Domain | 3 | Tightly coupled to Chat and WhatsApp |
| Architecture | 0 | No domain package, split across services |
| Engineering | 2 | Ollama + GPT-4o + n8n, no abstraction |
| Infrastructure | 2 | ai_confidence column, sender_type |
| Application | 2 | Admin IA Chat page (951L) |
| Portal | 0 | No portal |
| Tests | 2 | Ollama service tests |
| Events | 1 | No events |
| API | 2 | Inline in chat send route |
| Documentation | 2 | Specs exist |

---

## Capabilities Not Yet Scored (Future)

| Capability | Current State | Notes |
|------------|--------------|-------|
| Maps | Google Maps API usage only | No domain concept |
| Moderation | Basic comment filter | Part of Chat |
| Partners | Not implemented | Future feature |
| CRM | Not implemented | Future feature |
| Support | Part of Chat | Future separation |

---

## Extraction Priority (by score ascending)

1. 🔴 **AI** (18%) — Extract with Chat
2. 🔴 **Analytics** (18%) — Read-only, lowest effort
3. 🔴 **Cases** (22%) — Clean boundaries
4. 🔴 **Chat** (22%) — Most complex, AI coupling
5. 🔴 **Customers** (25%) — Schema discrepancy first
6. 🔴 **Hotels** (28%) — Largest embedded domain
7. 🔴 **Ratings** (28%) — Consolidate 2 tables
8. 🔴 **Settings** (30%) — High coupling
9. ⏳ **Notifications** (40%) — B11B runtime next
10. ⏳ **Trips** (45%) — Enhance existing
11. ⏳ **Vehicles** (48%) — Enhance existing
12. ⏳ **Payments** (52%) — Consolidate 3 implementations
13. ✅ **Dispatch** (55%) — Enhance existing
14. ✅ **Booking** (65%) — Enhance existing
15. ✅ **Drivers** (72%) — Reference implementation
