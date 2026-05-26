---
description: "Task list for Admin UI Alignment with HTML Reference"
---

# Tasks: Admin UI Alignment with HTML Reference

**Input**: Design documents from `/specs/016-admin-ui-alignment/`

**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Not requested — visual verification against HTML reference per spec.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=visual match, US2=routing, US3=missing components)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization — already complete. All dependencies installed, Next.js project exists.

No setup tasks required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CSS audit and routing fixes that MUST be complete before UI alignment starts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Audit CSS design tokens — verify all admin-shared.css variables (--bg, --surface, --accent, etc.) exist in app/globals.css, add any missing ones
- [X] T002 [P] [US2] Fix fleet sidebar link from /admin/logistics to /admin/fleet in app/admin/layout.tsx
- [X] T003 [P] [US2] Fix payments sidebar link from /admin/grid to /admin/payments in app/admin/layout.tsx
- [X] T004 [P] [US2] Fix employees sidebar link from /admin/team to /admin/employees in app/admin/layout.tsx
- [X] T005 [P] [US2] Add redirect from /admin/logistics to /admin/fleet in next.config.js
- [X] T006 [P] [US2] Add redirect from /admin/grid to /admin/payments in next.config.js

**Checkpoint**: Foundation ready — CSS variables available, sidebar routes pointing to correct pages.

---

## Phase 3: User Story 1 — Match Visual Design of All Admin Pages (Priority: P1) 🎯 MVP

**Goal**: Every admin page uses CSS custom properties for colors/typography and matches the HTML reference layout — cards, buttons, badges, tables, modals all styled identically.

**Independent Test**: Navigate to each admin page and compare against corresponding HTML file in `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/`. All visual elements must match.

### Implementation for User Story 1

The inline style refactor (T007) can run in parallel across all files. Page-specific alignment (T008-T016) depends on T007 completing for that file.

- [X] T007 [P] [US1] Replace hardcoded hex colors with CSS var(--*) across ALL admin pages — app/admin/*/page.tsx and component files
- [X] T008 [US1] Align Reservations page — KPI grid (6-col with colored top bars), filter pills, table+timeline layout, detail modal tabs in app/admin/reservations/components/*
- [X] T009 [P] [US1] Align Analytics page — KPI cards with top accent bars, chart area layout, top drivers table in app/admin/analytics/page.tsx
- [X] T010 [P] [US1] Align Customers page — slide-in panel styling matching HTML reference in app/admin/customers/page.tsx
- [X] T011 [P] [US1] Align Dispatch page — 3-column layout matching HTML reference in app/admin/dispatch/page.tsx
- [X] T012 [P] [US1] Align Drivers page — driver cards and side panel styling in app/admin/drivers/page.tsx
- [X] T013 [P] [US1] Align Fleet page — vehicle card styling and layout structure in app/admin/fleet/page.tsx
- [X] T014 [P] [US1] Align remaining pages — Employees, Inventory, Payments, Promotions, Settings, Support UI in app/admin/*/page.tsx

**Checkpoint**: All admin pages visually match the HTML reference in colors, spacing, typography, and layout. Sidebar routes work correctly.

---

## Phase 4: User Story 3 — Implement Missing UI Components (Priority: P2)

**Goal**: All UI components present in the HTML reference but missing from the project are implemented: date-nav bar, analytics charts/funnel, fleet analytics, vehicle modal, driver score ring, referral sources, search bar.

**Independent Test**: Navigate to each relevant page and verify the new component renders and matches the HTML reference design.

### Implementation for User Story 3

These tasks depend on US1 completion for their respective page files (the visual structure must be aligned before adding new components).

- [ ] T015 [US3] Add date navigation bar to admin layout — prev/next arrows, Today button, date range label, Day/Week/Month/Year toggle in app/admin/layout.tsx
- [ ] T016 [US3] Implement SVG line charts and bar charts with gradients in app/admin/analytics/page.tsx
- [ ] T017 [US3] Implement 5-step conversion funnel visualization in app/admin/analytics/page.tsx
- [ ] T018 [P] [US3] Implement fleet analytics section — utilization gauge ring, fuel efficiency bars, maintenance schedule in app/admin/fleet/page.tsx
- [ ] T019 [P] [US3] Implement vehicle detail modal with document check and health indicators in app/admin/fleet/page.tsx
- [ ] T020 [US3] Implement driver condition score ring using conic gradient SVG in app/admin/drivers/page.tsx
- [ ] T021 [P] [US3] Add referral sources section to app/admin/promotions/page.tsx
- [ ] T022 [P] [US3] Add search bar to inventory table in app/admin/inventory/page.tsx

**Checkpoint**: All missing components from the HTML reference are now implemented and rendering correctly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification — UI matches, functionality preserved, no regressions.

- [ ] T023 Verify each admin page visually matches its HTML reference — side-by-side comparison
- [ ] T024 Verify all existing functionality preserved (data fetching, modals, filters, CRUD)
- [ ] T025 [P] Verify responsive design at 3 breakpoints: mobile (390px), tablet (768px), desktop (1280px)
- [ ] T026 [P] Verify no hardcoded hex colors remain in any app/admin/*.tsx file
- [ ] T027 [P] Run type checking: `npx tsc --noEmit`
- [ ] T028 [P] Run linting: `npm run lint`
- [ ] T029 Run `pnpm dev` and manually verify top 3 pages load without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Blocks ALL user stories
- **US1 (Phase 3)**: Depends on Foundational (T001-T006)
- **US3 (Phase 4)**: Depends on US1 for shared page files (analytics, fleet, drivers, promotions, inventory must be visually aligned before adding components)
- **Polish (Phase 5)**: Depends on US1 and US3 completion

### User Story Dependencies

- **US1 (P1) — Visual Match**: Can start after Foundational — No dependency on US2/US3
- **US2 (P1) — Routing**: Inside Foundational phase — independent of US1/US3
- **US3 (P2) — Missing Components**: Depends on US1 for shared file updates — otherwise independent

### Within Each User Story

- CSS refactor (T007) runs before page-specific alignment (T008-T014)
- Page alignment completes before adding new components to same page (US3)
- Verification tasks run last

### Parallel Opportunities

| Tasks | Why Parallel |
|-------|-------------|
| T002-T006 | All routing fixes, different files |
| T007 | Can run across all files simultaneously (grep+replace sweep) |
| T009-T014 | All distinct page files, no overlaps |
| T018-T022 | All distinct page files/components |
| T025-T028 | All independent checks |

---

## Parallel Example: User Story 1

```bash
# Launch inline style refactor across all pages simultaneously:
Task: T007 Replace hardcoded hex colors with CSS var(--*) in all admin pages

# Launch per-page alignment simultaneously:
Task: T008 Align Reservations page UI
Task: T009 Align Analytics page UI
Task: T010 Align Customers page UI
Task: T012 Align Drivers page UI
```

## Parallel Example: User Story 3

```bash
# Launch missing components simultaneously (different pages):
Task: T018 Fleet analytics section
Task: T019 Vehicle detail modal
Task: T021 Referral sources section
Task: T022 Search bar on inventory
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CSS audit + routing fixes)
2. Complete Phase 3: User Story 1 (Visual alignment of all pages)
3. **STOP and VALIDATE**: Compare each page against HTML reference
4. Deploy/demo if ready — all pages visually matched, sidebar routes correct

### Incremental Delivery

1. **Foundation**: CSS tokens ready, routes fixed → commit
2. **MVP (US1)**: All pages visually match HTML reference → commit
3. **US3**: Missing components added per page → commit
4. **Polish**: Verification, type check, lint → commit

### Parallel Team Strategy

With multiple developers:
1. Developer A: Foundational (CSS audit + routing) + US1 visual alignment
2. Once US1 complete: Developer B handles US3 missing components
3. Any developer handles Polish verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable (US1: visual comparison, US3: verify new component renders)
- Commit after each task or logical group
- HTML references in `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/`
- CSS variable reference in `app/globals.css` and `admin-shared.css`
