# EPIC 2D: BUSINESS CAPABILITY EXTRACTION PLANNING

> Before writing any more code, separate conceptually the ENTIRE platform.
> Know what every capability IS before extracting it.
> No code. Only documentation and planning.

---

## Objective

Model ALL business capabilities with identical domain documentation structure.
Create a complete capability matrix with maturity scoring.
Define two parallel work lines (Platform + Business).
Ensure every capability folder in `01-business/` has the same 13 files.

## Why Now

1. **We don't fully know the platform yet** — 8 capabilities still embedded in Admin
2. **No extraction priority** — we don't know which to extract first
3. **No domain structure** — no identical pattern for all capabilities
4. **No maturity tracking** — we can't measure progress

## Deliverables

| # | Document | Status |
|---|----------|--------|
| 1 | [CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md) | ✅ All 20 capabilities scored |
| 2 | [CAPABILITY_MATURITY.md](CAPABILITY_MATURITY.md) | ✅ Scoring rubric (10 dimensions) |
| 3 | [EXTRACTION_GUIDE.md](EXTRACTION_GUIDE.md) | ✅ Step-by-step extraction process |
| 4 | [EXTRACTION_TRACKS.md](EXTRACTION_TRACKS.md) | ✅ Parallel Platform + Business lines |
| 5 | [DOMAIN_TEMPLATE/](domain-template/TEMPLATE.md) | ✅ Identical structure template |
| 6 | `01-business/domains/` | ✅ 16 capability folders created |

## Domain Folders

| Capability | Folder | Status |
|------------|--------|--------|
| Booking | `01-business/domains/booking/` | README created |
| Drivers | `01-business/domains/drivers/` | README created (reference) |
| Customers | `01-business/domains/customers/` | README created |
| Hotels | `01-business/domains/hotels/` | README created |
| Payments | `01-business/domains/payments/` | README created |
| Dispatch | `01-business/domains/dispatch/` | README created |
| Vehicles | `01-business/domains/vehicles/` | README created |
| Trips | `01-business/domains/trips/` | README created |
| Notifications | `01-business/domains/notifications/` | README created |
| Chat | `01-business/domains/chat/` | README created |
| AI | `01-business/domains/ai/` | README created |
| Ratings | `01-business/domains/ratings/` | README created |
| Cases | `01-business/domains/cases/` | README created |
| Settings | `01-business/domains/settings/` | README created |
| Analytics | `01-business/domains/analytics/` | README created |
| Maps | `01-business/domains/maps/` | README created |

## What We Learned

### Biggest Surprise
**Hotels (28%) is the LARGEST embedded domain** — 935-line admin page, inline DB logic, commission calculation in settings.ts. This is the biggest extraction challenge.

### Second Surprise
**Payments (52%) has 3 duplicate implementations** — lib/payment-service.ts, app/api/bookings/step-payment.tsx, packages/domains/_services/src/payment.ts. Must consolidate before extraction.

### Third Surprise
**Chat (22%) and AI (18%) are tightly coupled** — AI responses are part of chat flow. Must extract together or separate carefully.

### Fourth Surprise
**Notifications (40%) has the best documentation but no runtime** — 10 architecture docs complete (B11A), but no code (B11B pending).

## Next Steps

### Platform Line (can start now)
1. **B11B** — Communication Runtime (WhatsApp, Email, SMS adapters)
2. **B12** — Booking State Machine
3. **B5B** — Payment Integration

### Business Line (after Epic 2D)
1. **Hotels** (28%) — Largest embedded domain
2. **Customers** (25%) — Schema discrepancy fix
3. **Ratings** (28%) — Consolidate 2 tables
4. **Cases** (22%) — Clean boundaries
5. **Chat** (22%) — Most complex
6. **AI** (18%) — Extract with Chat
7. **Analytics** (18%) — Read-only, lowest effort
8. **Settings** (30%) — High coupling

## Rules

1. **Move behavior, never copy** — Constitution §14
2. **API routes are thin orchestrators** — No business logic
3. **Events for all state changes** — B10 pattern
4. **Identical domain structure** — 13 files per capability
5. **Two parallel tracks** — Platform and Business never conflict
6. **Full extraction or don't start** — No partial work

## Gate

Epic 2D is complete when:
- [ ] All 16 capabilities have full domain folder structure
- [ ] CAPABILITY_MATRIX.md is scored and reviewed
- [ ] EXTRACTION_TRACKS.md defines clear parallel lines
- [ ] No code written yet (documentation only)
