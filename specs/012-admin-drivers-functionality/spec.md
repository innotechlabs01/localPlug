# Feature Specification: Admin Drivers Functionality

**Feature Branch**: `[012-admin-drivers]`

**Created**: 2026-05-21

**Updated**: 2026-05-21

**Status**: 🟢 Active — 5 phases definidas, Phase 1 completo

---

## Phases Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Dashboard | ✅ Complete |
| 2 | Document Compliance | 🟡 In progress |
| 3 | Extended Driver Management | 🟡 In progress |
| 4 | Performance & Analytics | ⬜ Planned |
| 5 | Fleet Integration | ⬜ Planned |

Ver `plan.md` para detalle completo por fase.

---

## User Stories

### US-01 — View Drivers Dashboard (P1) ✅
As an admin, I want to view a comprehensive drivers dashboard with KPIs, compliance alerts, eligibility info, and a filterable driver roster.

**Acceptance:**
1. ✅ KPI row shows total, available, assigned, VIP, alerts, avg rating
2. ✅ Filter chips filter driver list by status
3. ✅ Search filters by name, phone, vehicle, plate, languages
4. ✅ Clicking a driver card updates side panels (profile, compliance, performance)

### US-02 — Manage Driver Information (P1)
As an admin, I want to add and edit drivers through a guided form.

**Acceptance:**
1. ✅ "Create Driver" button opens 6-step modal
2. ✅ Basic fields (name, phone, email, vehicle, plate, category, notes) — working
3. ⬜ Emergency contact fields — Phase 2
4. ⬜ Document expirations (license, SOAT, insurance) — Phase 2
5. ⬜ Edit driver — Phase 3
6. ⬜ Document uploads — Phase 3
7. ⬜ Driver photo upload — Phase 3

### US-03 — Monitor Compliance & Performance (P2) ✅
As an admin, I want to view compliance validation and performance metrics per driver.

**Acceptance:**
1. ✅ Alert panel shows compliance issues with "Review" button
2. ✅ Compliance panel shows document status badges (valid/warning/expired)
3. ✅ Performance panel shows score ring + metric bars (trips, revenue, VIP, satisfaction)
4. ⬜ Auto-calculate doc_status from expiry dates — Phase 2
5. ⬜ Revenue tracking per driver — Phase 4
6. ⬜ On-time performance — Phase 4

---

## Functional Requirements

### Phase 1 — Core Dashboard ✅
| FR | Description | Status |
|----|-------------|--------|
| FR-001 | Drivers page with sidebar nav matching admin layout | ✅ |
| FR-002 | KPI cards: total, available, assigned, VIP, alerts, avg rating | ✅ |
| FR-003 | Filter chips by driver status (7 filters) | ✅ |
| FR-004 | Compliance alerts panel | ✅ |
| FR-005 | Eligibility panel (airport pickup, VIP, restricted, ETA) | ✅ |
| FR-006 | Driver roster in card format (photo, name, status, stats, vehicle) | ✅ |
| FR-007 | Side panels: profile, compliance, performance | ✅ |
| FR-008 | Click driver card → update side panels | ✅ |
| FR-009 | Search by name, phone, vehicle, plate, languages | ✅ |
| FR-010 | "Add Driver" button → opens modal | ✅ |
| FR-011 | 6-step guided modal form | ✅ |
| FR-012 | Fetch data from database (not hardcoded) | ✅ |
| FR-013 | Responsive design matching HTML sample | ✅ |

### Phase 2 — Document Compliance 🟡
| FR | Description | Status |
|----|-------------|--------|
| FR-014 | Document fields in DB (license, SOAT, inspection, insurance) | ⬜ Migration pending |
| FR-015 | Auto-calculate doc_status from expiry dates | ⬜ |
| FR-016 | Warning indicators when documents expire within 30 days | ⬜ |
| FR-017 | Emergency contact fields in create modal | ⬜ |

### Phase 3 — Extended Management 🟡
| FR | Description | Status |
|----|-------------|--------|
| FR-018 | Edit driver modal with preloaded data | ⬜ |
| FR-019 | Document upload (drag & drop) | ⬜ |
| FR-020 | Driver photo upload with preview | ⬜ |
| FR-021 | Change history / audit timeline | ⬜ |

### Phase 4 — Performance & Analytics ⬜
| FR | Description | Status |
|----|-------------|--------|
| FR-022 | Revenue tracking per driver | ⬜ |
| FR-023 | Trip history with ratings | ⬜ |
| FR-024 | Cancellation rate & on-time performance | ⬜ |
| FR-025 | Ranking board | ⬜ |

### Phase 5 — Fleet Integration ⬜
| FR | Description | Status |
|----|-------------|--------|
| FR-026 | Vehicle maintenance scheduling | ⬜ |
| FR-027 | GPS live tracking | ⬜ |
| FR-028 | Zone coverage map | ⬜ |
| FR-029 | Shift scheduling | ⬜ |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| **Driver** | Person authorized to operate vehicles (name, phone, email, languages, status) |
| **Vehicle** | Transportation vehicle (make, model, plate, category, year, capacity) |
| **DriverStatus** | available, busy (assigned), offline, suspended, pending, inactive |
| **DocumentStatus** | valid, warning (expiring ≤30d), expired, pending |
| **ComplianceAlert** | Compliance issue requiring attention (expired docs, missing insurance) |
| **EligibilityMetrics** | Aggregate stats: airport eligible, VIP eligible, restricted, avg ETA |
| **PerformanceMetrics** | Historical: trips, revenue, VIP, cancellations, satisfaction, on-time rate |
| **VehicleConditionScore** | Aggregate score: cleanliness, interior, exterior, mechanical |

---

## Success Criteria

| SC | Description | Status |
|----|-------------|--------|
| SC-001 | Admin views all drivers filtered by status in ≤2s | ✅ |
| SC-002 | Side panels load in ≤1s after clicking driver card | ✅ |
| SC-003 | Search returns in ≤1s | ✅ |
| SC-004 | Visual match with provided HTML sample | ✅ |
| SC-005 | Compliance alerts update based on document expiry | ⬜ Phase 2 |
| SC-006 | Modal captures all required info with validation | 🟡 Basic fields only |

---

## Edge Cases

| Case | Handling | Status |
|------|----------|--------|
| No drivers in system | KPIs show 0, grid shows empty state message | ✅ |
| DB connection error | Toast + console error, graceful degradation | ✅ |
| Search yields no results | "No drivers match the current filter" | ✅ |
| Document expired | Warning badge + alert in compliance panel | 🟡 Phase 2 |
| Driver registered but no vehicle info | Shows "—" placeholders | ✅ |

---

## Files Changed

### Phase 1 ✅
- `app/admin/drivers/page.tsx` — Full page rewrite
- `app/api/admin/drivers/route.ts` — GET/POST/PUT/DELETE
- `specs/012-admin-drivers-functionality/spec.md` — This file
- `specs/012-admin-drivers-functionality/plan.md` — Implementation plan

### Phase 2-5 ⬜
- `app/api/admin/drivers/[id]/documents/route.ts`
- `app/api/admin/drivers/[id]/history/route.ts`
- `app/api/admin/drivers/[id]/photo/route.ts`
- `lib/drivers-types.ts` (optional)
- `lib/drivers-api.ts` (optional)
