---

description: "Task list for Admin Dashboard with Order Queue & i18n"
---

# Tasks: Admin Dashboard with Order Queue & i18n

**Input**: Design documents from `specs/005-admin-dashboard-i18n/`

**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Tests are included per the implementation plan (Vitest + React Testing Library).

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: `app/` at repository root for Next.js App Router
- Admin pages: `app/admin/`
- API routes: `app/api/`
- Lib: `lib/`
- Translations: `lib/i18n/locales/`

---

## Phase 1: Setup (Already Complete)

**Purpose**: Database tables and admin pages created

- [x] T001 Create Turso migration for orders, users, roles, permissions tables
- [x] T002 Seed roles (admin, manager, concierge, viewer) and 17 permissions
- [x] T003 Create admin layout with sidebar navigation in `app/admin/layout.tsx`
- [x] T004 Create dashboard page with stats and recent orders in `app/admin/page.tsx`
- [x] T005 Create order queue page with filtering/search in `app/admin/orders/page.tsx`
- [x] T006 Create team management page in `app/admin/team/page.tsx`
- [x] T007 Create monthly agenda page in `app/admin/agenda/page.tsx`
- [x] T008 Create 5 placeholder pages (ia-chat, intelligence, logistics, grid, dispatch)

---

## Phase 2: Foundational (i18n Admin Translations)

**Purpose**: Add i18n translations for all admin pages before connecting real data

**⚠️ CRITICAL**: No admin page can show translated text until this phase is complete

- [ ] T009 [P] Add admin namespace to `lib/i18n/locales/en.ts` with all admin translations (nav labels, page titles, status names, priority names, button labels, placeholder text)
- [ ] T010 [P] Add admin namespace to `lib/i18n/locales/es.ts` with all admin translations
- [ ] T011 Update `app/admin/layout.tsx` to use `useI18n()` hook for sidebar navigation labels
- [ ] T012 Update `app/admin/page.tsx` to use translations for stats labels and table headers
- [ ] T013 Update `app/admin/orders/page.tsx` to use translations for status tabs, filters, and table
- [ ] T014 Update `app/admin/team/page.tsx` to use translations for role labels and status
- [ ] T015 Update `app/admin/agenda/page.tsx` to use translations for activity types and status
- [ ] T016 Update all 5 placeholder pages to use translations for titles and descriptions

**Checkpoint**: All admin pages display translated text when language toggle is clicked

---

## Phase 3: US1 + US5 - Dashboard & i18n (Priority: P1)

**Goal**: Dashboard shows real order statistics from Turso database with i18n support

**Independent Test**: Navigate to `/admin` — verify stats show real counts from database, toggle language works

### Implementation for US1 + US5

- [ ] T017 [US1] Create `app/api/admin/stats/route.ts` — GET endpoint returning order counts (total, new, in_progress, urgent) from Turso
- [ ] T018 [US1] Create `app/api/admin/orders/recent/route.ts` — GET endpoint returning 10 most recent orders from Turso
- [ ] T019 [US1] Update `app/admin/page.tsx` to fetch stats from `/api/admin/stats` instead of mock data
- [ ] T020 [US1] Update `app/admin/page.tsx` to fetch recent orders from `/api/admin/orders/recent` instead of mock data

**Checkpoint**: Dashboard shows real data from Turso database

---

## Phase 4: US2 - Order Queue (Priority: P1)

**Goal**: Order queue page fetches real data from Turso with working filters

**Independent Test**: Navigate to `/admin/orders` — verify orders load from database, search/filter work, status tabs show correct counts

### Implementation for US2

- [ ] T021 [US2] Create `app/api/admin/orders/route.ts` — GET endpoint with query params for status, priority, search; returns filtered orders from Turso
- [ ] T022 [US2] Create `app/api/admin/orders/[id]/route.ts` — GET/PUT endpoints for single order (view details, update status)
- [ ] T023 [US2] Create `app/api/admin/orders/[id]/status/route.ts` — PUT endpoint to change order status with audit trail
- [ ] T024 [US2] Update `app/admin/orders/page.tsx` to fetch orders from `/api/admin/orders` with query params
- [ ] T025 [US2] Update `app/admin/orders/page.tsx` to call `/api/admin/orders/[id]/status` when status changes
- [ ] T026 [US2] Add order status history recording in `/api/admin/orders/[id]/status` route

**Checkpoint**: Order queue works with real data, filtering, and status updates

---

## Phase 5: US3 - Team Management (Priority: P2)

**Goal**: Team page shows real user data from Turso

**Independent Test**: Navigate to `/admin/team` — verify team members load from database, role badges display correctly

### Implementation for US3

- [ ] T027 [US3] Create `app/api/admin/team/route.ts` — GET endpoint returning all users with their roles and assigned order counts
- [ ] T028 [US3] Update `app/admin/team/page.tsx` to fetch team members from `/api/admin/team` instead of mock data
- [ ] T029 [US3] Add assigned order count calculation in team API (join users with orders)

**Checkpoint**: Team page shows real user data from database

---

## Phase 6: US4 - Monthly Agenda (Priority: P2)

**Goal**: Agenda page shows scheduled activities based on real order arrival dates

**Independent Test**: Navigate to `/admin/agenda` — verify activities are generated from real order arrival dates

### Implementation for US4

- [ ] T030 [US4] Create `app/api/admin/agenda/route.ts` — GET endpoint with date param, returns orders with arrivals/departures for that date
- [ ] T031 [US4] Update `app/admin/agenda/page.tsx` to fetch activities from `/api/admin/agenda` with date param

**Checkpoint**: Agenda shows real activities from order arrival dates

---

## Phase 7: US6 - Placeholder Pages (Priority: P3)

**Goal**: All placeholder pages display correct i18n translations

**Independent Test**: Navigate to each placeholder page — verify translated titles and descriptions

### Implementation for US6

- [ ] T032 [US6] Verify all 5 placeholder pages render with correct i18n translations
- [ ] T033 [US6] Add LangToggle to admin header (already exists in layout, verify it works)

**Checkpoint**: All placeholder pages show translated content

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify quality, accessibility, and build integrity

- [ ] T034 Run `pnpm lint` — fix any new linting errors across all admin files
- [ ] T035 Run `pnpm next build` — verify 0 build errors with all new/modified files
- [ ] T036 Run `pnpm test` — verify all tests pass (existing + new)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Already complete — no action needed
- **Foundational (Phase 2)**: No dependencies — can start immediately
- **US1 + US5 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion — can run in parallel with Phase 3
- **US3 (Phase 5)**: Depends on Phase 2 completion — can run in parallel with Phase 3/4
- **US4 (Phase 6)**: Depends on Phase 2 completion — can run in parallel with Phase 3/4/5
- **US6 (Phase 7)**: Depends on Phase 2 completion — can run in parallel with Phase 3/4/5/6
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 + US5 (P1)**: After Foundational — dashboard stats + i18n
- **US2 (P1)**: After Foundational — order queue filtering + CRUD
- **US3 (P2)**: After Foundational — team management
- **US4 (P2)**: After Foundational — monthly agenda
- **US6 (P3)**: After Foundational — placeholder pages

### Within Each User Story

- API routes before UI integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T009 + T010 (i18n translations) can run in parallel
- T011-T016 (update pages for i18n) can run in parallel
- T017 + T018 (dashboard API routes) can run in parallel
- T021 + T022 + T023 (order API routes) can run in parallel
- Phase 3, 4, 5, 6 can all run in parallel after Phase 2

---

## Parallel Example: Phase 2 (i18n)

```bash
# Launch i18n translations together:
Task: "Add admin namespace to en.ts"
Task: "Add admin namespace to es.ts"

# Launch page updates together:
Task: "Update layout.tsx for i18n"
Task: "Update page.tsx for i18n"
Task: "Update orders/page.tsx for i18n"
Task: "Update team/page.tsx for i18n"
Task: "Update agenda/page.tsx for i18n"
```

---

## Implementation Strategy

### MVP First (Dashboard + i18n)

1. Complete Phase 2: i18n translations for admin pages
2. Complete Phase 3: Dashboard with real data + i18n
3. **STOP and VALIDATE**: Dashboard shows real stats, language toggle works
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 2 → i18n translations ready
2. Add Phase 3 (Dashboard) → Test independently → Deploy/Demo
3. Add Phase 4 (Order Queue) → Test independently → Deploy/Demo
4. Add Phase 5 (Team) → Test independently → Deploy/Demo
5. Add Phase 6 (Agenda) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Complete Phase 2 together (i18n translations)
2. Once Phase 2 is done:
   - Developer A: Phase 3 (Dashboard) + Phase 4 (Order Queue)
   - Developer B: Phase 5 (Team) + Phase 6 (Agenda)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
