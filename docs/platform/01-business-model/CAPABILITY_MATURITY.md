# CAPABILITY_MATURITY (Scoring Rubric)

> Objective scoring system for every business capability.
> 10 dimensions, each 0-10 points. Total: 100 points per capability.
> Score = maturity percentage. Used to decide extraction priority.

---

## Scoring Dimensions

| # | Dimension | Weight | What It Measures |
|---|-----------|--------|-----------------|
| 1 | **Business Domain** | 10 | Is there a clear domain with defined responsibility? |
| 2 | **Architecture** | 10 | Domain package exists with entities, services, repositories? |
| 3 | **Engineering** | 10 | Code quality, patterns, separation of concerns? |
| 4 | **Infrastructure** | 10 | DB schema clean, migrations managed, no orphan tables? |
| 5 | **Application** | 10 | UI consumes domain services, not direct DB? |
| 6 | **Portal** | 10 | Standalone application consuming the domain? |
| 7 | **Tests** | 10 | Unit, integration, contract tests exist? |
| 8 | **Events** | 10 | Domain events published, event-driven architecture? |
| 9 | **API** | 10 | API routes are thin orchestrators over domain services? |
| 10 | **Documentation** | 10 | Domain blueprint, entity models, policies documented? |

**Total: 100 points**

---

## Scoring Scale

| Score | Label | Meaning |
|-------|-------|---------|
| 0-10% | **Non-existent** | Capability doesn't exist or is just a concept |
| 11-30% | **Embedded** | Logic exists but lives inside another domain (Admin) |
| 31-50% | **Partially Extracted** | Some domain logic extracted, some still in Admin |
| 51-70% | **Domain Exists** | Domain package exists, services implemented, some gaps |
| 71-90% | **Mature Domain** | Full domain with events, tests, API, documentation |
| 91-100% | **Production-Ready** | Portal exists, fully tested, observability, hardened |

---

## Dimension Scoring Guide

### 1. Business Domain (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No concept of this capability in the system |
| 2 | Capability exists but has no defined ownership |
| 4 | Capability is identified but embedded in Admin |
| 6 | Domain ownership is documented, some separation exists |
| 8 | Domain has clear responsibility, entities, and policies defined |
| 10 | Domain is fully autonomous with well-defined boundaries |

### 2. Architecture (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No domain package |
| 2 | Domain package exists but is empty/stub |
| 4 | Some entities defined, no services |
| 6 | Entities + services exist, repositories are stubs |
| 8 | Full domain package: entities, services, repos, policies, events |
| 10 | Domain package with all components + mappers + validation |

### 3. Engineering (0-10)

| Score | Criteria |
|-------|----------|
| 0 | Logic inline in routes/pages |
| 2 | Some service functions extracted to lib/ |
| 4 | Service layer exists but coupled to DB/routes |
| 6 | Service uses repository pattern, some separation |
| 8 | Clean separation: domain → service → repository → DB |
| 10 | SOLID principles, dependency injection, testable |

### 4. Infrastructure (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No tables or inline SQL |
| 2 | Tables exist but schema is inconsistent |
| 4 | Schema defined, some migrations, some duplication |
| 6 | Clean schema, managed migrations, no duplication |
| 8 | Schema + indexes + constraints + seed data |
| 10 | Schema + migrations + observability + backup strategy |

### 5. Application (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No UI for this capability |
| 2 | UI exists but queries DB directly |
| 4 | UI exists, some API calls, mostly direct DB |
| 6 | UI consumes API routes exclusively |
| 8 | UI consumes domain services via API |
| 10 | UI is a thin consumer, all logic in domain |

### 6. Portal (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No portal concept |
| 2 | Portal planned but not started |
| 4 | Portal scaffold exists, minimal features |
| 6 | Portal with core features, consumes domain |
| 8 | Portal with full features, auth, RBAC |
| 10 | Portal production-ready, PWA, offline support |

### 7. Tests (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No tests |
| 2 | Some integration tests only |
| 4 | Unit tests for some services |
| 6 | Unit + integration tests for domain |
| 8 | Full test suite: unit, integration, contract |
| 10 | Full suite + E2E + mutation testing |

### 8. Events (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No events |
| 2 | Events defined in types but not published |
| 4 | Events published but no consumers |
| 6 | Events published + some consumers |
| 8 | Full event-driven: publish + consume + outbox |
| 10 | Event-driven + saga/choreography + observability |

### 9. API (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No API |
| 2 | API exists but is a god route |
| 4 | API has some structure, some business logic |
| 6 | API routes are thin, delegate to services |
| 8 | API routes are pure orchestrators, no logic |
| 10 | API + OpenAPI spec + rate limiting + versioning |

### 10. Documentation (0-10)

| Score | Criteria |
|-------|----------|
| 0 | No documentation |
| 2 | Some inline comments |
| 4 | README with basic info |
| 6 | Domain blueprint with entities, services |
| 8 | Full blueprint + policies + events + diagrams |
| 10 | Blueprint + ADRs + runbooks + API docs |

---

## Usage

1. Score each capability on all 10 dimensions
2. Sum the scores (max 100)
3. Sort by total score ascending
4. Lowest score = highest extraction priority
5. Track score over time to measure progress

The goal is to get every capability to 70%+ (Mature Domain).
