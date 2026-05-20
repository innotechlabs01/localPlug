---

description: "Task list for booking persistence, toast notifications, and UI polish"
---

# Tasks: Booking Data Persistence & UI Polish

**Input**: Design documents from `/specs/002-booking-persistence-mock/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/persistence-api.md

**Tests**: Test tasks ARE included as specified in plan.md (Vitest + React Testing Library for persistence, toast, and form behavior).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory scaffolding and verifying toolchain

- [ ] T001 Create `app/components/booking/lib/` directory structure
- [ ] T002 [P] Verify Vitest config can discover `app/components/booking/__tests__/*.test.{ts,tsx}`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared TypeScript types and interfaces that both US1 and US2 depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create shared booking types in `app/components/booking/lib/types.ts` (Booking, FlightData, DestinationData, PersistenceQueueEntry, ToastNotification)
- [ ] T004 [P] Create `Booking` entity type with fields: id, flight, profile, destination, package, status, createdAt, submittedAt
- [ ] T005 [P] Create `PersistenceQueueEntry` type with fields: id, booking, timestamp, retryCount, lastError
- [ ] T006 [P] Create `ToastNotification` type with fields: id, type (success|error|warning|info), message, action?, createdAt, duration?

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Error Handling with Toast Notifications (Priority: P1)

**Goal**: Provide clear, non-blocking feedback for every action through toast notifications. Errors never break the page.

**Independent Test**: Trigger a simulated error and verify a toast appears with the correct message and dismiss action while the form stays interactive.

### Tests for User Story 2 ⚠️

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T007 [P] [US2] Test toast context renders children and provides showToast/dismissToast via `app/components/booking/__tests__/toast.test.tsx`
- [ ] T008 [P] [US2] Test toast auto-dismiss (success 5s, warning 8s) in `app/components/booking/__tests__/toast.test.tsx`
- [ ] T009 [P] [US2] Test toast manual dismiss for errors in `app/components/booking/__tests__/toast.test.tsx`
- [ ] T010 [P] [US2] Test max 3 concurrent toasts with overflow queuing in `app/components/booking/__tests__/toast.test.tsx`

### Implementation for User Story 2

- [ ] T011 [US2] Implement ToastContext and ToastProvider in `app/components/booking/lib/toast.tsx` with reducer pattern (addToast, dismissToast)
- [ ] T012 [P] [US2] Implement ToastContainer component with fixed positioning (bottom-right desktop, bottom-center mobile) in `app/components/booking/lib/toast.tsx`
- [ ] T013 [P] [US2] Implement ToastItem component with enter/exit animations (CSS translate + opacity) in `app/components/booking/lib/toast.tsx`
- [ ] T014 [US2] Add error boundary component that catches render errors and shows inline fallback with "Try Again" in `app/components/booking/lib/error-boundary.tsx`
- [ ] T015 [US2] Add console logging wrapper in `app/components/booking/lib/logger.ts` for FR-010 (log all submissions to browser console)

**Checkpoint**: Toast notifications working independently — can manually trigger toasts with useToast() hook

---

## Phase 4: User Story 1 - Complete Booking Flow with Data Persistence (Priority: P1)

**Goal**: All booking form data persists locally on each step so users never lose progress, even on page refresh or network failure. Failed submissions are queued for retry.

**Independent Test**: Fill all 4 steps, refresh the page, verify data is restored. Submit and verify data appears in localStorage. Set `__mock_fail` and verify toast + queue.

### Tests for User Story 1 ⚠️

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T016 [P] [US1] Test saveDraft persists to localStorage in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T017 [P] [US1] Test loadDraft restores from localStorage in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T018 [P] [US1] Test loadDraft returns null for expired drafts (>24h) in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T019 [P] [US1] Test enqueueRetry and dequeueRetry in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T020 [P] [US1] Test queue max 10 entries with LRU eviction in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T021 [P] [US1] Test submit calls /api/booking endpoint in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T022 [P] [US1] Test submit falls back to queue when API fails in `app/components/booking/__tests__/persistence.test.ts`
- [ ] T023 [US1] Test booking form restoration from localStorage on mount in `app/components/booking/__tests__/booking-form.test.tsx`
- [ ] T024 [US1] Test booking form step persistence on every change in `app/components/booking/__tests__/booking-form.test.tsx`

### Implementation for User Story 1

- [ ] T025 [US1] Implement PersistenceAPI wrapper in `app/components/booking/lib/persistence.ts` with all methods per contracts/persistence-api.md
- [ ] T026 [P] [US1] Implement `saveDraft(booking: Partial<Booking>)` with async delay and localStorage write in `app/components/booking/lib/persistence.ts`
- [ ] T027 [P] [US1] Implement `loadDraft()` with TTL check (24h expiry) in `app/components/booking/lib/persistence.ts`
- [ ] T028 [P] [US1] Implement `enqueueRetry` / `dequeueRetry` / `getRetryQueue` / `removeRetry` with LRU eviction in `app/components/booking/lib/persistence.ts`
- [ ] T029 [P] [US1] Implement `submit(booking: Booking)` that POSTs to `/api/booking` in `app/components/booking/lib/persistence.ts`
- [ ] T030 [US1] Implement `clear()` to wipe all localStorage keys in `app/components/booking/lib/persistence.ts`
- [ ] T031 [US1] Integrate ToastProvider into booking-form.tsx (wrap in provider)
- [ ] T032 [US1] Integrate ErrorBoundary wrapper into booking-form.tsx
- [ ] T033 [US1] Add persistence save call on every form state change (debounced 300ms) in booking-form.tsx
- [ ] T034 [US1] Add draft restoration on mount in booking-form.tsx (loadDraft → pre-fill state)
- [ ] T035 [US1] Update handleConfirm to use persistence.submit() with retry queue fallback in booking-form.tsx
- [ ] T036 [US1] Integrate toast calls in booking-form.tsx (success toast on confirm, error toast on failure, warning toast on date validation)

**Checkpoint**: Full booking flow works end-to-end with persistence, toast feedback, and offline resilience

---

## Phase 5: User Story 3 - Clean UI & Responsive Polish (Priority: P2)

**Goal**: Booking form interface is visually polished, responsive across mobile/desktop, and follows accessible design patterns.

**Independent Test**: Visually verify form at 390px, 768px, and 1280px — all elements properly sized, touch targets ≥44px, no overflow.

### Implementation for User Story 3

- [ ] T037 [P] [US3] Add `role="progressbar"` with `aria-valuenow` to StepProgress in `app/components/booking/step-progress.tsx`
- [ ] T038 [P] [US3] Add `aria-current="step"` to active step indicator in `app/components/booking/step-progress.tsx`
- [ ] T039 [P] [US3] Add / verify 44px minimum touch targets on all Back/Continue buttons in `app/components/booking/booking-form.tsx`
- [ ] T040 [P] [US3] Add / verify 44px minimum touch targets on package selection cards in `app/components/booking/step-packages.tsx`
- [ ] T041 [P] [US3] Add / verify 44px minimum touch targets on profile selection cards in `app/components/booking/step-traveler-profile.tsx`
- [ ] T042 [P] [US3] Verify Emerald glow focus rings (2px offset) on all form inputs across all step components
- [ ] T043 [P] [US3] Add `role="alert"` and `aria-live="polite"` to toast notifications in `app/components/booking/lib/toast.tsx`
- [ ] T044 [P] [US3] Verify responsive layout at 390px (full-width inputs, no horizontal scroll) in `app/components/booking/booking-form.tsx`
- [ ] T045 [P] [US3] Verify WhatsApp callout readability on confirmation screen mobile in `app/components/booking/booking-confirmation.tsx`

**Checkpoint**: All UI polish items complete — focus rings, touch targets, ARIA attributes, responsive verified

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of build, lint, and accessibility

- [ ] T046 [P] Run `pnpm lint` and fix any warnings/errors
- [ ] T047 [P] Run `pnpm next build` and verify all 7+ routes build successfully
- [ ] T048 [P] Run `pnpm test` and verify all new tests pass
- [ ] T049 Verify quickstart.md validation (manual localStorage mock_fail toggle test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US2 (Phase 3)**: Depends on Foundational — CAN proceed independently of US1
- **US1 (Phase 4)**: Depends on Foundational + US2 (Phase 3) — US1's error UX requires toast system
- **US3 (Phase 5)**: Depends on US1 (Phase 4) — polish is applied to integrated form
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational — No dependencies on other stories (toast is standalone)
- **User Story 1 (P1)**: Depends on US2 (toast system) — but core persistence (T025-T030) can start in parallel with US2
- **User Story 3 (P2)**: Depends on US1 being integrated into the form — UI polish applied to final form

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/types before services
- Core logic before integration into booking-form.tsx
- Each story complete before moving to next

### Parallel Opportunities

- T002, T004, T005, T006 can run in parallel (all in Foundational)
- T007-T010 (US2 tests) can run in parallel
- T011-T015 (US2 implementation) can run sequentially (T011 must come first)
- T016-T024 (US1 tests) can run in parallel
- T025 (PersistenceAPI) and US2 implementation can run in parallel
- T026-T030 (persistence sub-tasks) can run in parallel within the file
- T037-T045 (US3 polish) can all run in parallel
- T046-T048 (polish) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all tests for US2 together:
Task: "Test toast context in app/components/booking/__tests__/toast.test.tsx"
Task: "Test toast auto-dismiss in app/components/booking/__tests__/toast.test.tsx"
Task: "Test toast manual dismiss in app/components/booking/__tests__/toast.test.tsx"
Task: "Test max concurrent toasts in app/components/booking/__tests__/toast.test.tsx"
```

```bash
# Launch toast + error boundary + logger in parallel:
Task: "Implement ToastContext in app/components/booking/lib/toast.tsx"
Task: "Implement ErrorBoundary in app/components/booking/lib/error-boundary.tsx"
Task: "Implement logger in app/components/booking/lib/logger.ts"
```

---

## Implementation Strategy

### MVP First (User Story 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (types)
3. Complete Phase 3: User Story 2 (toast system)
4. **STOP and VALIDATE**: Toast notifications can be triggered manually via useToast() hook
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 2 (Toast) → Test independently → Demo
3. Add User Story 1 (Persistence) → Test independently → Deploy (core form with all feedback!)
4. Add User Story 3 (UI Polish) → Test independently → Final polish
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (toast system)
   - Developer B: User Story 1 persistence core (T025-T030 — the PersistenceAPI functions)
3. Developer A completes US2, then both work on US1 integration (T031-T036)
4. Both work on US3 polish tasks (T037-T045 — all parallel)
5. Polish + verification phase (T046-T049)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Emoji-free per project convention
