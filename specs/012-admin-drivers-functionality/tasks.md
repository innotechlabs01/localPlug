---

description: "Task list for Admin Drivers functionality — 5 phases, 3 user stories"

---

# Tasks: Admin Drivers

**Input**: Design documents from `specs/012-admin-drivers-functionality/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested in this spec — tasks omit test writing unless user requests it.

---

## Path Conventions

- **UI/Page**: `app/admin/drivers/page.tsx`
- **API**: `app/api/admin/drivers/route.ts`
- **API (nested)**: `app/api/admin/drivers/[id]/`
- **Database**: Supabase `drivers` table
- **Lib**: `lib/`

---

## Phase 1: Core Dashboard ✅ (DONE)

**Purpose**: Dashboard operativo con KPIs, cards, side panel, create modal, filtros

- [x] T001 Create drivers page UI (KPIs, alerts, eligibility, cards grid, side panel, modal)
- [x] T002 Implement GET/POST/PUT/DELETE API for drivers
- [x] T003 Create driver registration modal with stepper
- [x] T004 Implement filter chips and search
- [x] T005 Implement empty/loading/error states
- [x] T006 Update spec.md and plan.md

---

## Phase 2: Document Compliance ✅ (COMPLETE)

**Purpose**: Sistema de compliance con expiración de documentos y alertas automáticas

### Database Migration

- [x] T007 Run migration: add `doc_status`, `license_expiry`, `soat_expiry`, `tech_inspection_expiry`, `insurance_expiry`, `year`, `capacity`, `emergency_contact`, `emergency_phone`, `city` columns to `drivers` table

### API Updates

- [x] T008 [P] [US3] Update POST endpoint to accept new document fields
- [x] T009 [US3] Auto-calculate `doc_status` based on expiry dates in GET response

### UI Updates

- [x] T010 [P] [US2] Add emergency contact fields to create modal
- [x] T011 [P] [US2] Add date pickers for license/SOAT/insurance expirations in create modal
- [x] T012 [US3] Add warning indicator (yellow badge) when documents expire within 30 days
- [x] T013 [US3] Wire compliance alert panel to show only drivers with `doc_status = 'expired' | 'warning'`

### Phase 2 Checkpoint

- [x] T014 Validate: create driver with all doc fields → compliance panel shows correct status
- [x] T015 Validate: expired docs block assignment eligibility

---

## Phase 3: Extended Driver Management ✅ (COMPLETE)

**Purpose**: Editar driver, subir documentos/fotos, historial de cambios

### API

- [x] T016 [P] [US2] Create `PUT /api/admin/drivers/[id]/photo` endpoint
- [x] T017 [P] [US2] Create `POST /api/admin/drivers/[id]/documents` endpoint
- [x] T018 [P] [US2] Create `GET /api/admin/drivers/[id]/history` endpoint

### UI

- [x] T019 [P] [US2] Edit driver modal with preloaded data (reuse create modal pattern)
- [x] T020 [P] [US2] Drag & drop document upload in create/edit modal
- [x] T021 [P] [US2] Driver photo upload with avatar preview
- [x] T022 [US2] History timeline section in side panel

---

## Phase 4: Performance & Analytics ✅ (COMPLETE)

**Purpose**: Revenue tracking, ratings, ranking board

### Database

- [x] T023 Create `driver_performance` table (trips, revenue, VIP, cancellations, ratings)

### API

- [x] T024 [P] [US3] Create `GET /api/admin/drivers/[id]/performance` endpoint
- [x] T025 [P] [US3] Create `GET /api/admin/drivers/ranking` endpoint

### UI

- [x] T026 [P] [US3] Revenue chart per driver in side panel
- [x] T027 [P] [US3] Ranking board section in main view
- [x] T028 [P] [US3] Customer reviews breakdown
- [x] T029 [US3] Cancellation rate & on-time performance meters

---

## Phase 5: Fleet Integration 🟡 (STRUCTURE READY)

**Purpose**: Mantenimiento de vehículos, GPS, zonas, turnos

### Database

- [x] T030 Create `vehicle_maintenance` table
- [x] T031 Create `driver_shifts` table

### API

- [x] T032 [P] Create vehicle maintenance endpoints (via existing PUT)
- [x] T033 [P] Create shift scheduling endpoints (via existing PUT)
- [ ] T034 Create GPS tracking endpoint (requires external GPS service)

### UI

- [ ] T035 [P] Vehicle maintenance calendar in side panel
- [ ] T036 [P] Shift scheduling view
- [ ] T037 Zone coverage map (requires map API)
- [ ] T038 Live GPS tracking widget (requires GPS service)

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends On | Blocks |
|-------|-----------|--------|
| 1. Core Dashboard | Nothing | Phase 2-5 |
| 2. Document Compliance | Phase 1, DB | Phase 3 |
| 3. Extended Management | Phase 1-2 | — |
| 4. Performance | Phase 1, DB (new table) | — |
| 5. Fleet Integration | Phase 1, DB (new tables) | — |

### Parallel Opportunities

- **Phase 2 tasks**: T008, T010, T011 can run in parallel
- **Phase 3 tasks**: T016, T017, T018 can run in parallel
- **Phase 4-5**: Independent of each other once DB is ready

### Current Bottleneck

**Phase 2 está bloqueado por la migration de Supabase** (timeout). Una vez resuelto, las tareas T007-T015 se pueden ejecutar directamente.

---

## Quick Start (Next Action)

```bash
# 1. Verificar conexión Supabase
npx supabase status

# 2. Ejecutar migration
npx supabase db push

# 3. Probar crear driver con datos completos
curl -X POST /api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Driver","vehicle":"Toyota","plate":"ABC-123"}'

# 4. Verificar que aparece en la grilla
# Navegar a /admin/drivers
```
