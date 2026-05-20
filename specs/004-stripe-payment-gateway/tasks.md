---

description: "Task list for Stripe Payment Gateway feature implementation"
---

# Tasks: Stripe Payment Gateway

**Input**: Design documents from `specs/004-stripe-payment-gateway/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/payment-api.md, contracts/webhook-contract.md

**Tests**: Tests are included per the implementation plan (Vitest + React Testing Library).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: `app/` at repository root for Next.js App Router
- API routes: `app/api/payments/`
- Components: `app/components/booking/`
- Lib: `app/components/booking/lib/`
- Tests: `app/components/booking/__tests__/`

---

## Phase 1: Setup

**Purpose**: Install Stripe SDK dependencies and configure environment variables

- [ ] T001 Install Stripe packages: `pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] T002 Create `.env.local.example` with Stripe key placeholders (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type definitions, Stripe helpers, and payment store that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Add `PaymentRecord`, `PaymentSession`, `CreatePaymentIntentRequest`, `CreatePaymentIntentResponse`, and `PaymentStatusResponse` interfaces to `app/components/booking/lib/types.ts`
- [ ] T004 [P] Create `app/components/booking/lib/stripe-server.ts` — Stripe server-side initialization with `STRIPE_SECRET_KEY`, helper to create PaymentIntent, and webhook signature verification utility
- [ ] T005 [P] Create `app/components/booking/lib/stripe-client.ts` — Stripe.js singleton initialization for frontend using `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` via `loadStripe()`
- [ ] T006 Create `app/components/booking/lib/payment-store.ts` — in-memory `Map<string, PaymentRecord>` keyed by `bookingReference`, with `get()`, `set()`, `has()`, `getByStatus()` methods, following the same pattern as `booking-store.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Complete VIP Package Payment (Priority: P1) 🎯 MVP

**Goal**: Guests can pay for their selected VIP package using an embedded Stripe Elements card form within the booking wizard. The system creates a PaymentIntent, confirms payment, waits for Stripe webhook, and shows success.

**Independent Test**: Complete the booking wizard, select a VIP package, proceed to payment, enter Stripe test card `4242 4242 4242 4242`, see processing state, and receive success confirmation with booking reference. Check payment store for a `completed` PaymentRecord.

### Tests for User Story 1 ⚠️

- [ ] T007 [P] [US1] Write unit tests for `payment-store.ts` in `app/components/booking/__tests__/payment-store.test.ts` (covers: create record, get by booking ref, duplicate detection, get by status, idempotency check)
- [ ] T008 [P] [US1] Write tests for `POST /api/payments/create-intent` in `app/components/booking/__tests__/payment-webhook.test.ts` (covers: successful intent creation, duplicate booking rejection, amount mismatch, missing parameters)

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create `app/api/payments/create-intent/route.ts` — validates booking reference, checks for existing payment (409 on duplicate), validates package ID and amount against hardcoded prices, creates Stripe PaymentIntent with metadata (`bookingReference`, `packageId`), returns `clientSecret` and `paymentIntentId`
- [ ] T010 [P] [US1] Create `app/api/payments/webhook/route.ts` with `export const config = { api: { bodyParser: false } }` — reads raw body via `req.text()`, verifies Stripe signature via `stripe.webhooks.constructEvent()`, handles `payment_intent.succeeded` (creates `completed` PaymentRecord) and `payment_intent.payment_failed` (creates `failed` PaymentRecord), uses Stripe event ID for idempotency
- [ ] T011 [P] [US1] Create `app/components/booking/payment-form.tsx` — Stripe Elements `PaymentElement` form wrapped in `Elements` provider with `clientSecret`, submit button with processing state, error display with `role="alert"`, `aria-live="polite"` for status announcements
- [ ] T012 [US1] Create `app/components/booking/step-payment.tsx` — payment step showing package summary (name, price), embedded `PaymentForm`, processing state with spinner, success confirmation with booking reference, and "View status" link
- [ ] T013 [US1] Integrate step-payment into the booking wizard by adding it as the final step after step-packages in the step progression, including `canProceed()` gate (payment must be completed) and Back button navigation
- [ ] T014 [US1] Create `app/components/booking/payment-confirmation.tsx` — post-payment success UI showing booking reference, package purchased, amount paid, and next steps for the guest

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — guests can complete a full payment via the booking flow

---

## Phase 4: User Story 2 - Handle Failed or Declined Payment (Priority: P1)

**Goal**: Guests who experience payment failures see clear error messages, no order is created, and they can retry with a different payment method.

**Independent Test**: Enter Stripe decline test card `4000 0000 0000 0002` — payment fails with clear error, no PaymentRecord created, user can retry. Set `localStorage.__mock_fail = 'true'` — webhook never arrives, show timeout message, no PaymentRecord created. Close browser during payment — webhook still processes correctly.

### Tests for User Story 2 ⚠️

- [ ] T015 [P] [US2] Write tests for payment failure scenarios in `app/components/booking/__tests__/payment-webhook.test.ts` (covers: `payment_intent.payment_failed` webhook, Stripe decline response, invalid signature rejection, duplicate event idempotency)

### Implementation for User Story 2

- [ ] T016 [P] [US2] Add error display and retry button in `app/components/booking/payment-form.tsx` — on Stripe confirmation failure, show Stripe error message below the card form with a "Try Again" button that resets the form; add `__mock_stripe_fail` toggle for development
- [ ] T017 [P] [US2] Add webhook timeout handling (60 seconds) in `app/components/booking/step-payment.tsx` — after 60s without webhook confirmation, show "Payment received — we're confirming it now" message with a link to check payment status; use `clearTimeout` on unmount
- [ ] T018 [US2] Add `__mock_fail` webhook simulation support in `app/components/booking/lib/stripe-server.ts` — when `__mock_fail` is set, skip Stripe API calls and return a simulated pending PaymentIntent; add `__mock_stripe_fail` to simulate Stripe API errors on intent creation
- [ ] T019 [US2] Update `app/components/booking/booking-form.tsx` to handle payment step errors gracefully — ensure navigation doesn't clear error state and failed payments return to step-payment for retry

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — successful payments complete, failed payments show errors without creating records

---

## Phase 5: User Story 3 - Track Payment Status (Priority: P2)

**Goal**: Guests and administrators can query payment status by booking reference via a dedicated API endpoint.

**Independent Test**: Complete a successful payment, then call `GET /api/payments/status?bookingRef=<uuid>` — returns full PaymentRecord JSON. Query a non-existent booking returns `{ status: 'no_payment' }`. Query a failed payment returns `status: 'failed'` with error message.

### Tests for User Story 3 ⚠️

- [ ] T020 [P] [US3] Write API contract tests for payment status endpoint in `app/components/booking/__tests__/payment-store.test.ts` (covers: existing payment record, no payment found, missing bookingRef parameter, pending/completed/failed status values)

### Implementation for User Story 3

- [ ] T021 [US3] Create `app/api/payments/status/route.ts` — accepts `bookingRef` query param, looks up payment store, returns PaymentRecord JSON if found or `{ status: 'no_payment', bookingReference }` if not, returns 400 if `bookingRef` missing
- [ ] T022 [US3] Update `app/components/booking/payment-confirmation.tsx` to include a "Check Payment Status" link that calls the status endpoint and displays current state

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify quality, accessibility, and build integrity

- [ ] T023 Run `pnpm lint` — fix any new linting errors across all new Stripe payment files
- [ ] T024 Run `pnpm next build` — verify 0 build errors with all new/modified files (ensure dynamic routes for payments work)
- [ ] T025 Run `pnpm test` — verify all tests pass (existing tests + new payment tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — creates core payment flow
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — modifies same components (`payment-form.tsx`, `step-payment.tsx`)
- **US3 (Phase 5)**: Depends on Foundational only — independent file set, can run in parallel with US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — creates `create-intent`, `webhook`, `payment-form.tsx`, `step-payment.tsx`
- **User Story 2 (P1)**: After US1 — modifies the same files as US1 (`payment-form.tsx`, `step-payment.tsx`, `booking-form.tsx`)
- **User Story 3 (P2)**: After Foundational — independent file set (no overlap with US1/US2)

### Within Each User Story

- Tests (when included) MUST be written and FAIL before implementation
- Models/services before UI integration
- Core implementation before integration

### Parallel Opportunities

- T003, T004, T005 (Foundational) can run in parallel
- T007+T008 and T009+T010+T011+T012+T013+T014 (US1) — tests and implementation can run in parallel
- T015 and T016+T017+T018+T019 (US2) — tests and implementation can run in parallel
- T020 and T021+T022 (US3) — tests and implementation can run in parallel
- T020+T021+T022 (US3) can run in parallel with US1 and US2 implementation (no file conflicts)

---

## Parallel Example: User Story 2

```bash
# Launch tests for User Story 2 together:
Task: "Write payment failure tests in __tests__/payment-webhook.test.ts"

# Launch all implementation for User Story 2 together:
Task: "Add error display and retry in payment-form.tsx"
Task: "Add webhook timeout handling in step-payment.tsx"
Task: "Add mock simulation toggles in stripe-server.ts"
Task: "Update booking-form.tsx for error handling"
```

## Parallel Example: User Story 3

```bash
# Launch tests + implementation together for US3:
Task: "Write API contract tests for payment status endpoint"
Task: "Create payment status route in api/payments/status/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (payment happy path)
4. **STOP and VALIDATE**: Guest can pay with test card and receive confirmation
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (payment flow) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (error handling) → Test independently → Deploy/Demo
4. Add US3 (status tracking) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (payment flow) → then US2 (error handling) — same files
   - Developer B: US3 (status tracking) — independent file set
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
