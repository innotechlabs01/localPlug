# Tasks: WhatsApp n8n Communication

**Input**: Design documents from `specs/010-whatsapp-n8n-communication/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification. Test tasks excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration, environment variables, and base configuration

- [x] T001 Create DB migration `lib/db/migrations/009_whatsapp_events.sql` with whatsapp_events table and conversations columns
- [x] T002 [P] Update `.env.local.example` with Evolution API, n8n, and OpenAI environment variables
- [x] T003 [P] Update `next.config.js` to add `output: 'standalone'` for Docker deployment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Fix `app/components/booking/lib/payment-store.ts` to read/write `customer_phone` column in `getPayment()` and `setPayment()`
- [x] T005 Fix `app/components/booking/lib/stripe-server.ts` to include `customerPhone` in `buildPaymentRecordFromWebhook()`
- [x] T006 Create `app/api/webhooks/evolution/route.ts` — Evolution API webhook handler for messages.upsert, message-receipt.update, instance.status, connection.update
- [x] T007 Update `lib/n8n/client.ts` — add `sendWhatsAppDirect()`, `sendWhatsAppButtons()`, update `triggerPaymentConfirmation()` payload with Evolution API config
- [x] T008 Update `app/api/webhooks/n8n/route.ts` — add handlers for whatsapp-sent, whatsapp-escalation, whatsapp-ai-response events

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Post-Payment WhatsApp Confirmation (Priority: P1) 🎯 MVP

**Goal**: User receives WhatsApp confirmation within 30 seconds of payment with booking details

**Independent Test**: Complete test booking with Stripe payment → verify WhatsApp message received → verify message contains correct booking details → verify language matches

### Implementation for User Story 1

- [x] T009 [US1] Update `app/components/booking/step-payment.tsx` to pass `flightNumber`, `airline`, `arrivalDate`, `arrivalTime` to create-intent API
- [x] T010 [US1] Update `app/api/payments/create-intent/route.ts` to accept and forward flight data to `createPaymentIntent()`
- [x] T011 [US1] Update `app/components/booking/lib/stripe-server.ts` `createPaymentIntent()` to include `flightNumber`, `airline`, `arrivalDate`, `arrivalTime` in Stripe metadata
- [x] T012 [US1] Update `app/api/payments/webhook/route.ts` to extract flight data from `intent.metadata` and pass to `triggerPaymentConfirmation()`
- [x] T013 [US1] Add phone number E.164 validation helper in `app/components/booking/lib/` (new utility file)
- [x] T014 [US1] Update `app/components/booking/step-traveler-profile.tsx` to collect phone number in E.164 format
- [x] T015 [US1] Create n8n workflow configuration doc for "Payment → WhatsApp Welcome" in `specs/010-whatsapp-n8n-communication/n8n-workflows/payment-welcome.md`

**Checkpoint**: Payment triggers WhatsApp confirmation within 30 seconds

---

## Phase 4: User Story 2 - Automated AI Responses via WhatsApp (Priority: P1)

**Goal**: AI responds to incoming WhatsApp messages within 5 seconds in correct language

**Independent Test**: Send WhatsApp message → verify AI response received within 5 seconds → verify correct language → verify contextually relevant

### Implementation for User Story 2

- [x] T016 [P] [US2] Update `app/api/webhooks/evolution/route.ts` to process messages.upsert events, find/create conversations, store incoming messages
- [x] T017 [P] [US2] Update `lib/n8n/client.ts` `triggerAiChatMessage()` to include WhatsApp source metadata
- [x] T018 [US2] Update `app/api/chat/send/route.ts` to detect WhatsApp channel and send via Evolution API when channel is whatsapp
- [x] T019 [US2] Create n8n workflow configuration doc for "WhatsApp → AI Agent" in `specs/010-whatsapp-n8n-communication/n8n-workflows/whatsapp-ai-agent.md`
- [x] T020 [US2] Create OpenAI system prompt document in `specs/010-whatsapp-n8n-communication/n8n-workflows/ai-system-prompt.md`

**Checkpoint**: WhatsApp messages receive AI responses within 5 seconds

---

## Phase 5: User Story 3 - Human Agent Takeover (Priority: P2)

**Goal**: Admin can take manual control of WhatsApp conversations and release back to AI

**Independent Test**: Open admin → select WhatsApp conversation → click "Take Over" → verify AI stops → send message → verify user receives → click "AI Mode" → verify AI resumes

### Implementation for User Story 3

- [x] T021 [P] [US3] Update `app/admin/ia-chat/page.tsx` — add Take Over button, AI Mode button, handleTakeOver() and handleReleaseToAI() handlers
- [x] T022 [P] [US3] Update `app/api/webhooks/evolution/route.ts` to check conversation status before triggering AI (skip if human_active)
- [x] T023 [US3] Update `app/api/chat/escalate/route.ts` to support admin takeover (set status to human_active)
- [x] T024 [US3] Update `app/api/chat/close/route.ts` to support releasing back to AI mode (set status to ai_active)
- [x] T025 [US3] Add i18n keys for Take Over, AI Mode, Taking Over in `lib/i18n/locales/en.ts` and `lib/i18n/locales/es.ts`

**Checkpoint**: Admin can take over and release WhatsApp conversations

---

## Phase 6: User Story 4 - Automatic Escalation Detection (Priority: P2)

**Goal**: AI detects escalation keywords and routes to human support automatically

**Independent Test**: Send "hablar con alguien" → verify status changes to "escalated" → verify user receives confirmation → verify appears in admin escalated filter

### Implementation for User Story 4

- [x] T026 [P] [US4] Create escalation keyword detection utility in `app/api/webhooks/evolution/route.ts` (or shared lib)
- [x] T027 [US4] Update `app/api/webhooks/n8n/route.ts` handler for whatsapp-escalation event to update conversation status
- [x] T028 [US4] Add escalation message templates (EN/ES) in i18n locales
- [x] T029 [US4] Update `app/api/chat/conversations/route.ts` to support filtering by escalated status for WhatsApp conversations

**Checkpoint**: Escalation keywords automatically route to human support

---

## Phase 7: User Story 5 - Admin Dashboard Visibility (Priority: P2)

**Goal**: All WhatsApp conversations visible with channel indicators, filterable by channel

**Independent Test**: Open admin → verify WhatsApp badge on conversations → filter by WhatsApp → verify only WhatsApp shown → view message history with source labels

### Implementation for User Story 5

- [x] T030 [P] [US5] Update `app/admin/ia-chat/page.tsx` — add ChannelFilter type, channelFilter state, WhatsApp/Web badges in conversation list
- [x] T031 [P] [US5] Update `app/admin/ia-chat/page.tsx` — add channel filter UI (All/WhatsApp/Web buttons)
- [x] T032 [US5] Update `app/admin/ia-chat/page.tsx` — update Message interface to include metadata field, display WA indicator on WhatsApp messages
- [x] T033 [US5] Update `app/api/chat/conversations/route.ts` to support channel filter parameter
- [x] T034 [US5] Add i18n keys for channelFilter (All, WhatsApp, Web) in en.ts and es.ts

**Checkpoint**: Admin dashboard shows all WhatsApp conversations with proper indicators

---

## Phase 8: User Story 6 - WhatsApp Delivery Status Tracking (Priority: P3)

**Goal**: Track delivery status of all WhatsApp messages (sent, delivered, read)

**Independent Test**: Send WhatsApp message → verify delivery status tracked in DB → verify admin can see status

### Implementation for User Story 6

- [x] T035 [P] [US6] Update `app/api/webhooks/evolution/route.ts` to process message-receipt.update events and store in whatsapp_events
- [x] T036 [P] [US6] Update `app/api/webhooks/evolution/route.ts` to process instance.status and connection.update events
- [x] T037 [US6] Create n8n workflow configuration doc for "Status Tracking" in `specs/010-whatsapp-n8n-communication/n8n-workflows/status-tracking.md`
- [x] T038 [US6] Add WhatsApp event cleanup cron job documentation (30-day retention) in `specs/010-whatsapp-n8n-communication/ops/event-cleanup.md`

**Checkpoint**: WhatsApp delivery status fully tracked and auditable

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T039 [P] Create Docker deployment documentation in `specs/010-whatsapp-evolution-api/DEPLOY-GUIDE.md`
- [x] T040 [P] Create anti-baneo configuration guide in `specs/010-whatsapp-evolution-api/ANTI-BANEO.md`
- [x] T041 Run `pnpm lint` and `npx tsc --noEmit` to verify no errors
- [x] T042 Update `AGENTS.md` to reference all new spec documents
- [x] T043 Create end-to-end testing checklist in `specs/010-whatsapp-n8n-communication/testing/checklist.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) can proceed in parallel after Foundational
  - US3 (P2) depends on US1 + US2 (needs WhatsApp channel working)
  - US4 (P2) depends on US2 (needs AI processing working)
  - US5 (P2) depends on US1 + US2 (needs conversations and messages)
  - US6 (P3) depends on US1 (needs WhatsApp events being created)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 + US2 (needs WhatsApp channel and AI processing)
- **User Story 4 (P2)**: Depends on US2 (needs AI processing and escalation detection)
- **User Story 5 (P2)**: Depends on US1 + US2 (needs conversations and messages in DB)
- **User Story 6 (P3)**: Depends on US1 (needs WhatsApp events being created)

### Within Each User Story

- Models/entities before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 + T003 can run in parallel (different config files)
- T009 + T010 + T011 + T012 can run in parallel (different files in payment chain)
- T016 + T017 can run in parallel (different webhook/client files)
- T021 + T022 can run in parallel (different files)
- T026 can run in parallel with T027 (different files)
- T030 + T031 can run in parallel (same file but different sections)
- T035 + T036 can run in parallel (same file but different event handlers)
- T039 + T040 can run in parallel (different doc files)

---

## Parallel Example: User Story 1

```bash
# Launch payment chain tasks together:
Task: "Update step-payment.tsx to pass flight data"
Task: "Update create-intent/route.ts to accept flight data"
Task: "Update stripe-server.ts to include flight data in metadata"
Task: "Update webhook/route.ts to extract flight data"

# Launch phone validation + profile collection together:
Task: "Create E.164 phone validation utility"
Task: "Update step-traveler-profile.tsx to collect phone number"
```

---

## Implementation Strategy

### MVP First (User Story 1 + US2)

1. Complete Phase 1: Setup (DB migration, env vars)
2. Complete Phase 2: Foundational (Evolution API webhook, n8n client)
3. Complete Phase 3: User Story 1 (Payment → WhatsApp)
4. Complete Phase 4: User Story 2 (WhatsApp → AI)
5. **STOP and VALIDATE**: Test full bidirectional flow
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Test bidirectional WhatsApp → Deploy/Demo (MVP!)
3. US3 → Admin takeover → Test independently → Deploy/Demo
4. US4 → Escalation detection → Test independently → Deploy/Demo
5. US5 → Admin dashboard → Test independently → Deploy/Demo
6. US6 → Status tracking → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Payment → WhatsApp)
   - Developer B: US2 (WhatsApp → AI)
3. Once US1 + US2 complete:
   - Developer A: US3 (Takeover) + US4 (Escalation)
   - Developer B: US5 (Dashboard) + US6 (Status)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- n8n workflows are configured externally (in n8n UI) — tasks here document the configuration
- Evolution API deployment is external (EasyPanel) — tasks here document the setup
