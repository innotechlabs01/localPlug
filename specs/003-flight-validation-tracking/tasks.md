---

description: "Task list for Flight Validation & User Tracking feature implementation"
---

# Tasks: Flight Validation & User Tracking

**Input**: Design documents from `specs/003-flight-validation-tracking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/flight-validation-api.md

**Tests**: Tests are included per the implementation plan (Vitest + React Testing Library).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: `app/` at repository root for Next.js App Router
- Tests: `app/components/booking/__tests__/`

---

## Phase 1: Setup

**Purpose**: Create feature branch and verify baseline

- [x] T001 Create feature branch `003-flight-validation-tracking` from `001-professional-landing-page`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type extensions and mock data that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Add `FlightValidationResult` interface and `flightValidationStatus` field to `Booking` in `app/components/booking/lib/types.ts`
- [x] T003 [P] Create mock flight reference data for 10+ airlines serving Medellín (MDE) in `app/components/booking/lib/flight-data.ts` (each airline: `airlineName`, `iataCode`, `flightNumbers[]`)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - 15-Day Minimum Booking Window Enforcement (Priority: P1) 🎯 MVP

**Goal**: Prevent selection of arrival dates within 15 days of today via HTML5 `min` attribute and step-gate validation.

**Independent Test**: Open the booking form — dates less than 15 days from today are disabled in the date picker. Attempting to proceed with an invalid date shows an error and blocks advancement.

### Tests for User Story 1 ⚠️

- [x] T004 [P] [US1] Write Vitest tests for 15-day min date calculation in `app/components/booking/__tests__/date-enforcement.test.ts` (covers: midnight boundary, month rollover, Colombia timezone, `min` attribute computation)

### Implementation for User Story 1

- [x] T005 [US1] Add `min` attribute computed from current date + 15 days (Colombia Time UTC-5) to arrival date input in `app/components/booking/step-flight-logistics.tsx`
- [x] T006 [US1] Add step-gate validation in `app/components/booking/booking-form.tsx`: disable "Continue" button and show tooltip when `arrivalDate` is less than 15 days from today

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Flight Data Validation via Mock Service (Priority: P1)

**Goal**: Validate airline + flight number against a mock flight reference data set, showing success checkmark or warning banner without blocking form advancement.

**Independent Test**: Enter "American Airlines" + "AA1123" — validation succeeds with green checkmark and "American Airlines" confirmation. Enter "American Airlines" + "AA9999" — validation fails with amber warning and "will be flagged" message. Set `localStorage.__mock_fail = 'true'` — validation shows service error warning.

### Tests for User Story 2 ⚠️

- [x] T007 [P] [US2] Write Vitest tests for flight validation service in `app/components/booking/__tests__/flight-validation.test.ts` (covers: valid match, no match, service failure simulation, empty input, edge-case flight numbers, whitespace normalization)

### Implementation for User Story 2

- [x] T008 [US2] Create mock flight validation service in `app/components/booking/lib/flight-validation.ts` (async function, configurable latency, `__mock_fail` toggle, matching algorithm per contract)
- [x] T009 [US2] Add validation status UI in `app/components/booking/step-flight-logistics.tsx`: spinner during validation, green checkmark on success, amber warning on failure/unverified, `aria-live="polite"` region
- [x] T010 [US2] Integrate flight validation call (debounced 500ms on flight number/airline change) in `app/components/booking/booking-form.tsx`
- [x] T011 [US2] Add flight validation integration tests in `app/components/booking/__tests__/booking-form.test.tsx` (validation fires on input change, flagged bookings can still submit, `__mock_fail` graceful degradation)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Flight-Based User Tracking (Priority: P2)

**Goal**: Expose a server-side API endpoint for the concierge team to search bookings by flight number + airline.

**Independent Test**: Submit a booking with flight "AA1123". Then call `GET /api/bookings/search?flightNumber=AA1123&airline=American+Airlines` — returns the booking with traveler details and status. Search for a non-existent flight returns `{ results: [], count: 0 }`.

### Tests for User Story 3 ⚠️

- [x] T012 [P] [US3] Write API contract tests for concierge search endpoint (covers: exact match, partial match, no match, multiple results, missing parameters, case insensitivity)

### Implementation for User Story 3

- [x] T013 [US3] Create server-side in-memory booking store in `app/components/booking/lib/booking-store.ts` (keyed by normalized `airline:flightNumber`)
- [x] T014 [US3] Update `app/api/booking/route.ts` to push successful submissions into the booking store
- [x] T015 [US3] Create `app/api/bookings/search/route.ts` with concierge search: accepts `flightNumber` and `airline` query params, returns matching bookings

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify quality, accessibility, and build integrity

- [x] T016 Run `pnpm lint` — fix any new linting errors
- [x] T017 Run `pnpm next build` — verify 0 build errors with all new/modified files
- [x] T018 Run `pnpm test` — verify all tests pass (existing 23 + new tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) share files (`step-flight-logistics.tsx`, `booking-form.tsx`) — must be done sequentially
  - US3 (Phase 5) is fully independent — can be done in parallel with US1/US2 if separate files are handled
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — modifies `step-flight-logistics.tsx`, `booking-form.tsx`
- **User Story 2 (P1)**: After Foundational — modifies the same files as US1 + creates new files
- **User Story 3 (P2)**: After Foundational — independent file set (no overlap with US1/US2)

### Within Each User Story

- Tests (when included) MUST be written and FAIL before implementation
- Models/services before UI integration
- Core implementation before integration

### Parallel Opportunities

- T002 and T003 (Foundational) can run in parallel
- T004 and T005+T006 can run in parallel (test + implementation)
- T007 and T008+T009+T010+T011 can run in parallel (test + implementation)
- T012 and T013+T014+T015 can run in parallel (test + implementation)
- T012+T013+T014+T015 (US3) can run in parallel with US1 and US2 implementation (no file conflicts)

---

## Parallel Example: User Story 2

```bash
# Launch tests for User Story 2 together:
Task: "Write flight validation tests in __tests__/flight-validation.test.ts"

# Launch all implementation for User Story 2 together (no cross-file deps):
Task: "Create flight validation service in lib/flight-validation.ts"
Task: "Add validation status UI in step-flight-logistics.tsx"
Task: "Integrate flight validation in booking-form.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch tests + implementation together for US3:
Task: "Write API contract tests for concierge search"
Task: "Create booking store in lib/booking-store.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (15-day min date enforcement)
4. **STOP and VALIDATE**: Date picker blocks dates < 15 days; step gate blocks advancement
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (15-day enforcement) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Flight validation) → Test independently → Deploy/Demo
4. Add US3 (Concierge search) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (date enforcement) → then US2 (flight validation) — same files
   - Developer B: US3 (concierge search) — independent file set
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
