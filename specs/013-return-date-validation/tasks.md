# Tasks: Return Date Validation

**Input**: Design documents from `specs/013-return-date-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/` at repository root
- Single file change in `app/components/booking/step-flight-logistics.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — no setup needed. Project is already initialized.

No setup tasks required. The feature is a single-file change in an existing project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks needed. The existing booking form component and flight data state already exist.

---

## Phase 3: User Story 1 - Return date defaults to arrival date (Priority: P1) 🎯 MVP

**Goal**: When the user checks "I also need return transportation", the return date picker's minimum date becomes the arrival date. If arrival date changes past an already-set return date, the return date is cleared.

**Independent Test**: Open `/booking`, fill arrival date, check return checkbox — verify the return date `<input>` has `min` set to the arrival date value.

### Implementation for User Story 1

- [x] T001 [US1] Change return date `min` attribute in `app/components/booking/step-flight-logistics.tsx`: replace `min={minDate}` with `min={data.arrivalDate || minDate}` on the return date `<input>` at line 190
- [x] T002 [US1] Add a `useEffect` in `app/components/booking/step-flight-logistics.tsx` that clears `returnDate` (sets to `''`) when `arrivalDate` changes and `needReturn` is true and `returnDate < arrivalDate`
- [x] T003 [US1] Remove the unused `// Return transportation toggle` comment and clean up any stale console.log statements in `app/components/booking/step-flight-logistics.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional. The return date cannot be before the arrival date, and changing arrival date past the return date clears it.

---

## Phase 4: User Story 2 - Booking captures accurate stay duration (Priority: P2)

**Goal**: As a business operator, accurate stay duration data is available because the validation prevents invalid date ranges.

**Independent Test**: Submit a booking with both arrival and return dates where return >= arrival, verify the `return_date` stored in the database is correct.

### Implementation for User Story 2

User Story 2 has no implementation tasks — it is automatically satisfied by User Story 1's validation. If the return date can never be before the arrival date, the stored data is inherently accurate.

**Checkpoint**: All user stories complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification that all scenarios work

- [x] T004 Run `pnpm lint` on `app/components/booking/step-flight-logistics.tsx` to ensure no TypeScript or formatting errors
- [x] T005 Run `npx tsc --noEmit` to verify TypeScript compilation passes
- [x] T006 Manual verification: open `/booking`, fill arrival date, check return — confirm return date picker only shows dates >= arrival date; change arrival to later date — confirm return date clears

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (P1)**: No dependencies — can start immediately (single file change)
- **User Story 2 (P2)**: Depends on US1 completion — no additional implementation needed
- **Polish (Final)**: Depends on US1 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories
- **User Story 2 (P2)**: Automatically satisfied by US1 — no separate tasks needed

### Within User Story 1

- T001 before T002 (the min attribute is primary; the useEffect is secondary cleanup)
- T003 last (cosmetic cleanup after functional changes)

### Parallel Opportunities

- T001 and T002 could be done together in the same edit
- T004, T005, T006 (polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Edit the return date min attribute and add the useEffect in one pass:
Task: "Edit app/components/booking/step-flight-logistics.tsx — change min={minDate} to min={data.arrivalDate || minDate} on the returnDate input, and add useEffect to clear returnDate when arrivalDate moves past it"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001 + T002 + T003)
2. **STOP and VALIDATE**: Test User Story 1 independently
3. Run polish tasks (T004, T005, T006)
4. Deploy/demo if ready

### Incremental Delivery

1. Implement User Story 1 → Test independently → Deploy (MVP done!)
2. User Story 2 has no additional implementation — already covered

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All tasks are in a single file: `app/components/booking/step-flight-logistics.tsx`
- No new files, no new dependencies, no server-side changes
