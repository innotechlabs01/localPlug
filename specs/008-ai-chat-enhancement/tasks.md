# Tasks: AI Chat Enhancement + Unified n8n Business Workflow + i18n Audit

**Input**: Design documents from `specs/008-ai-chat-enhancement/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Initial Project Setup)

**Purpose**: Project initialization — already completed

- [x] T001 Verify dev server runs with `pnpm dev` and chat routes respond
- [x] T002 [P] Confirm n8n webhook endpoint is reachable at `https://agent-ia.innotechlabssas.lat/webhook/ai-chat-message`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story — already completed

- [x] T003 Create server-side i18n helper at `lib/i18n/server.ts`
- [x] T004 Add chat API response locale keys in `lib/i18n/locales/en.ts` under `chat` section
- [x] T005 [P] Add chat API response locale keys in `lib/i18n/locales/es.ts` under `chat` section
- [x] T006 Update `ChatWidget.tsx` to pass `locale` field in send message request body

---

## Phase 3: User Story 1 — Real AI Response via n8n (Priority: P1) ✅ COMPLETED

**Goal**: Replace keyword-based mock AI with real AI responses via n8n webhook, with localized fallback when n8n is unavailable.

**Independent Test**: Open chat widget → send question → no mock response appears → n8n response arrives within 10s → verify response is stored and displayed. Kill n8n → send message → localized fallback appears.

### Implementation for User Story 1 (Completed)

- [x] T007 [US1] Remove `generateMockAiResponse()` from `app/api/chat/send/route.ts`
- [x] T008 [US1] Modify `send/route.ts` to return n8n webhook response via async polling pattern
- [x] T009 [US1] Handle n8n failure in `send/route.ts` with localized fallback via server-i18n helper
- [x] T010 [US1] Verify n8n `ai-chat-response` webhook handler correctly stores AI response

---

## Phase 4: User Story 2 — i18n Audit (Priority: P1) ✅ COMPLETED

**Goal**: All hardcoded Spanish text in chat API routes replaced by i18n locale keys.

**Independent Test**: Switch language to English → trigger blocked topic → see English response → switch to Spanish → trigger same → see Spanish response.

### Implementation for User Story 2 (Completed)

- [x] T011 [US2] Replace hardcoded blocked topic response with i18n key `chat.blockedTopic`
- [x] T012 [US2] Replace hardcoded fraud response with i18n key `chat.fraudDetected`
- [x] T013 [US2] Replace hardcoded escalation message with i18n key `chat.escalated`
- [x] T014 [US2] Replace hardcoded close message with i18n key `chat.closed`

---

## Phase 5: User Story 3 — n8n Workflow Integration Audit (Priority: P2) ✅ COMPLETED

**Goal**: Verify end-to-end n8n chat flow + add structured logging.

**Independent Test**: Send chat message → n8n processes it → response from n8n → verify stored as AI response.

### Implementation for User Story 3 (Completed)

- [x] T015 [US3] Add structured logging for n8n webhook call in `app/api/chat/send/route.ts`
- [x] T016 [US3] Add structured logging for n8n response in `app/api/webhooks/n8n/route.ts`

---

## Phase 6: User Story 4 — Chat Widget i18n Coverage (Priority: P2) ✅ COMPLETED

**Goal**: Full i18n coverage across chat widget and admin chat center.

**Independent Test**: Toggle language → widget + admin chat display fully localized.

### Implementation for User Story 4 (Completed)

- [x] T017 [US4] Audit `app/components/chat/ChatWidget.tsx` for hardcoded strings
- [x] T018 [US4] Audit `app/admin/ia-chat/page.tsx` for hardcoded strings

---

## Phase 7: User Story 5 — WhatsApp Payment & Delivery Notifications (Priority: P1) 🎯 NEW

**Goal**: Customers receive WhatsApp notifications at three post-payment milestones — payment confirmation, driver assignment with ETA, and delivery completion — via a single unified n8n workflow using Twilio.

**Independent Test**: Complete Stripe checkout → receive WhatsApp payment confirmation → admin assigns driver → receive WhatsApp with driver name/ETA → delivery marked complete → receive WhatsApp delivery confirmation.

### Data Model & Migration

- [x] T022 [P] [US5] Create DB migration `lib/db/migrations/008_whatsapp_phone.sql` adding `customer_phone TEXT` to `payments` table
- [x] T023 [P] [US5] Add `customerPhone: string` to `PaymentRecord` interface in `app/components/booking/lib/types.ts`
- [x] T024 [US5] Update `payment-store.ts` to read/write `customer_phone` column in `getPayment()` and `setPayment()` at `app/components/booking/lib/payment-store.ts`

### n8n Client — New Trigger Functions

- [x] T025 [P] [US5] Add `triggerDriverAssigned()` function in `lib/n8n/client.ts` sending `driver-assigned` event with booking + driver data + customerPhone
- [x] T026 [P] [US5] Add `triggerDeliveryCompleted()` function in `lib/n8n/client.ts` sending `delivery-completed` event with booking reference + customerPhone
- [x] T027 [US5] Update `triggerPaymentConfirmation()` in `lib/n8n/client.ts` to include `customerPhone` field in the n8n payload

### Stripe Webhook — Phone Forwarding

- [x] T028 [US5] Extract `customerPhone` from `intent.metadata.customerPhone` and pass to `triggerPaymentConfirmation()` in `app/api/payments/webhook/route.ts`

### Booking Event API Routes (App → n8n)

- [x] T029 [P] [US5] Create `POST /api/bookings/driver-assigned/route.ts` — validates input (bookingReference, driver data, customerPhone), calls `triggerDriverAssigned()`, returns 200
- [x] T030 [P] [US5] Create `POST /api/bookings/delivery-completed/route.ts` — validates input (bookingReference, customerPhone), calls `triggerDeliveryCompleted()`, returns 200

### n8n Webhook Callback Handlers (n8n → App)

- [x] T031 [US5] Add `driver-assigned` callback handler in `app/api/webhooks/n8n/route.ts` — logs WhatsApp message ID and status
- [x] T032 [US5] Add `delivery-completed` callback handler in `app/api/webhooks/n8n/route.ts` — logs WhatsApp message ID and status

### n8n Workflow Configuration (n8n UI — external)

- [ ] T033 [US5] Configure Twilio credential (Account SID + Auth Token) in n8n instance at `https://agent-ia.innotechlabssas.lat`
- [ ] T034 [US5] Create single unified n8n workflow with 3 webhook triggers (`payment-confirmed`, `driver-assigned`, `delivery-completed`) each routing through a Twilio WhatsApp node with the correct template
- [ ] T035 [US5] Create 3 WhatsApp message templates (`payment_confirmed`, `driver_assigned`, `delivery_completed`) with EN + ES variants in Twilio Content Template Builder

**Checkpoint**: At this point, User Story 5 should be fully functional — end-to-end WhatsApp notification flow working for all three milestones.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup for the complete broadened scope

- [x] T036 [P] Run `pnpm build` to verify no TypeScript errors
- [x] T037 [P] Run `rg -n 'reserva|vuelo|concierge|ayudarte|conversación|escalada|cerrado' app/api/` to verify zero hardcoded Spanish text
- [x] T038 [P] Verify all new WhatsApp-related locale keys have matching entries in both `en.ts` and `es.ts`
- [ ] T039 End-to-end validation: trigger Stripe `payment_intent.succeeded` → app calls n8n → WhatsApp received → trigger driver-assigned event → WhatsApp received → trigger delivery-completed event → WhatsApp received (requires n8n workflow + Twilio setup from T033-T035)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phases 1-6**: ✅ COMPLETED — no action needed
- **Phase 7 (US5)**: Can be worked on independently — no code dependencies on Phases 3-6
- **Phase 8 (Polish)**: Depends on Phase 7 completion

### User Story Dependencies

- **User Story 5 (P1)**: No code dependencies on US1-US4 — standalone feature
  - T022-T024 (data model) must complete before T028 (stripe webhook)
  - T025-T026 (n8n client) must complete before T029-T030 (API routes)
  - T033-T035 (n8n workflow) depends on T022-T028 for contract alignment, but n8n work can proceed in parallel with app code since contracts are defined

### Parallel Opportunities

- T022 + T023 can run in parallel (migration + types)
- T024 depends on T022 + T023 being done
- T025 + T026 can run in parallel (different client functions)
- T027 depends on T022 + T023 (needs customerPhone in types)
- T029 + T030 can run in parallel (different API routes)
- T031 + T032 can run in parallel (different callback handlers)
- T033 + T034 + T035 (n8n side) can run fully in parallel with all app code tasks

---

## Parallel Example: User Story 5

```bash
# Launch data model tasks together:
Task: "Create DB migration in lib/db/migrations/008_whatsapp_phone.sql"
Task: "Add customerPhone to PaymentRecord in types.ts"

# Launch n8n client functions together:
Task: "Add triggerDriverAssigned() to lib/n8n/client.ts"
Task: "Add triggerDeliveryCompleted() to lib/n8n/client.ts"

# Launch API routes together:
Task: "Create driver-assigned route"
Task: "Create delivery-completed route"

# All n8n-side tasks can run in parallel with app code:
Task: "Configure Twilio credential in n8n"
Task: "Create unified n8n workflow"
Task: "Create WhatsApp message templates"
```

---

## Implementation Strategy

### MVP (User Story 5 Only)

1. Complete T022-T024: Data model (migration + types + store)
2. Complete T025-T027: n8n client functions
3. Complete T028: Stripe webhook phone forwarding
4. Complete T029-T030: Booking event API routes
5. Complete T031-T032: Webhook callback handlers
6. Complete T033-T035: n8n workflow configuration (external)
7. **STOP and VALIDATE**: End-to-end WhatsApp notification flow
8. Deploy

### Incremental Delivery

1. T022-T028 (app data plumbing) → Test: payment webhook includes phone
2. T029-T032 (event API routes) → Test: driver-assigned + delivery-completed emit n8n events
3. T033-T035 (n8n workflow config) → Test: WhatsApp messages received at all 3 milestones
4. T036-T039 (Polish) → Final verification and deploy

### Parallel Team Strategy

- **Developer A**: T022-T028 (app data plumbing: migration, types, store, n8n client, Stripe webhook)
- **Developer B**: T029-T032 (API routes + callback handlers)
- **Developer C**: T033-T035 (n8n workflow: Twilio credential, workflow design, templates)
- **All**: T036-T039 (Polish together after all complete)

---

## Notes

- [P] tasks = different files, no dependencies
- [US5] label maps task to User Story 5
- Each phase should be independently completable and testable
- Commit after each task or logical group
- Tasks T033-T035 are external (n8n UI and Twilio Console) — marked separately
- Refer to `contracts/n8n-trigger-events.md` for exact payload shapes when implementing T025-T030
- Refer to `contracts/n8n-webhook-responses.md` for callback shapes when implementing T031-T032
- Refer to `quickstart.md` for Twilio sandbox and n8n workflow setup steps
