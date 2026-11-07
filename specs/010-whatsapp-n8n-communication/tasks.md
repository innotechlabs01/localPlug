---
description: "Task list template for feature implementation"
---

# Tasks: WhatsApp n8n Communication

**Input**: Design documents from `/specs/010-whatsapp-n8n-communication/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
============================================================================
IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

The /speckit.tasks command MUST replace these with actual tasks based on:
- User stories from spec.md (with their priorities P1, P2, P3...)
- Feature requirements from plan.md
- Entities from data-model.md
- Endpoints from contracts/

Tasks MUST be organized by user story so each story can be:
- Implemented independently
- Tested independently
- Delivered as an MVP increment

DO NOT keep these sample tasks in the generated tasks.md file.
============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize Next.js project with React 18 and TypeScript dependencies
- [x] T003 [P] Configure ESLint and Prettier for code quality
- [x] T004 [P] Setup Tailwind CSS for styling
- [x] T005 [P] Configure Turso database connection

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Setup database schema and migrations framework
- [x] T007 [P] Implement authentication/authorization framework for admin routes
- [x] T008 [P] Setup API routing and middleware structure
- [x] T009 [P] Create base models for Conversation, Message, WhatsApp Event entities
- [x] T010 Configure error handling and logging infrastructure
- [x] T011 Setup environment configuration management
- [x] T012 [P] Implement webhook receiver infrastructure for Evolution API and n8n

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Post-Payment WhatsApp Confirmation (Priority: P1) 🎯 MVP

**Goal**: Send WhatsApp confirmation message after successful payment with booking details

**Independent Test**: Complete a test booking with Stripe payment → verify WhatsApp message is received within 30 seconds → verify message contains correct booking details → verify language matches user's booking language.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

### Implementation for User Story 1

- [x] T013 [P] [US1] Create Payment Record model extension in lib/payment-record.ts
- [x] T014 [P] [US1] Create Conversation model extension in lib/conversation.ts
- [x] T015 [US1] Implement sendWelcomeWhatsAppMessage service in lib/services/whatsapp-service.ts
- [x] T016 [US1] Create payment webhook handler in app/api/webhooks/stripe/route.ts
- [x] T017 [US1] Add phone number validation and normalization to E.164 format
- [x] T018 [US1] Add language detection from booking data
- [x] T019 [US1] Add logging for WhatsApp welcome message operations
- [x] T020 [US1] Test end-to-end flow with mock Stripe webhook

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Automated AI Responses via WhatsApp (Priority: P1)

**Goal**: Process incoming WhatsApp messages with AI agent and send contextual responses

**Independent Test**: Send a WhatsApp message to the business number → verify AI response is received within 5 seconds → verify response is in the correct language → verify response is contextually relevant to the booking.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

### Implementation for User Story 2

- [x] T021 [P] [US2] Create Message model extension in lib/message.ts
- [x] T022 [P] [US2] Create WhatsApp Event model in lib/whatsapp-event.ts
- [x] T023 [US2] Implement processIncomingWhatsAppMessage service in lib/services/whatsapp-service.ts
- [x] T024 [US2] Create n8n webhook handler in app/api/webhooks/n8n/route.ts
- [x] T025 [US2] Implement OpenAI GPT-4o integration for response generation
- [x] T026 [US2] Add language detection matching user's input language
- [x] T027 [US2] Add confidence scoring and fallback for low confidence responses
- [x] T028 [US2] Add logging for AI response operations
- [x] T029 [US2] Test end-to-end flow with mock n8n webhook

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Human Agent Takeover (Priority: P2)

**Goal**: Allow administrators to take manual control of WhatsApp conversations

**Independent Test**: Open admin panel → select a WhatsApp conversation → click "Take Over" → verify AI stops responding → send a manual message → verify user receives it → click "AI Mode" → verify AI resumes.

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

### Implementation for User Story 3

- [x] T030 [P] [US3] Extend Conversation model with human_active status and agent assignment fields
- [x] T031 [US3] Implement takeOverConversation service in lib/services/chat-service.ts
- [x] T032 [US3] Implement releaseToAIMode service in lib/services/chat-service.ts
- [x] T033 [US3] Create admin API endpoints for chat management in app/api/chat/[action]/route.ts
- [ ] T034 [US3] Add authorization checks for admin-only operations
- [ ] T035 [US3] Add logging for agent takeover operations
- [ ] T036 [US3] Update conversation status logic to prevent AI processing when human_active

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Automatic Escalation Detection (Priority: P2)

**Goal**: Detect escalation keywords and automatically route to human support

**Independent Test**: Send a WhatsApp message containing "quiero hablar con alguien" → verify conversation status changes to "escalated" → verify user receives escalation confirmation message → verify conversation appears in admin escalated filter.

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

### Implementation for User Story 4

- [ ] T037 [P] [US4] Implement escalation keyword detection service in lib/services/escalation-service.ts
- [ ] T038 [US4] Integrate escalation detection into message processing flow
- [ ] T039 [US4] Create sendEscalationNotification service in lib/services/whatsapp-service.ts
- [ ] T040 [US4] Update conversation status logic to handle escalated state
- [ ] T041 [US4] Add logging for escalation detection operations
- [ ] T042 [US4] Test escalation detection with various keyword combinations

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Admin Dashboard Visibility (Priority: P2)

**Goal**: Display WhatsApp conversations in admin IA Chat Center with channel indicators

**Independent Test**: Open admin IA Chat Center → verify WhatsApp conversations show with a WhatsApp badge → filter by WhatsApp channel → verify only WhatsApp conversations appear → view message history → verify AI and user messages are distinguishable.

### Tests for User Story 5 (OPTIONAL - only if tests requested) ⚠️

### Implementation for User Story 5

- [ ] T043 [P] [US5] Enhance conversation listing to include channel badges in lib/services/chat-service.ts
- [ ] T044 [US5] Implement channel filtering functionality in app/api/chat/conversations/route.ts
- [ ] T045 [US5] Enhance message retrieval to show source indicators in lib/services/chat-service.ts
- [ ] T046 [US5] Create/update admin chat UI components in components/admin/chat/
- [ ] T047 [US5] Add WhatsApp badge styling and channel indicator components
- [ ] T048 [US5] Test admin dashboard visibility with mixed channel conversations

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, AND 5 should all work independently

---

## Phase 8: User Story 6 - WhatsApp Delivery Status Tracking (Priority: P3)

**Goal**: Track delivery status of WhatsApp messages and show in admin interface

**Independent Test**: Send a WhatsApp message → verify delivery status is tracked in database → verify admin can see delivery status in conversation view.

### Tests for User Story 6 (OPTIONAL - only if tests requested) ⚠️

### Implementation for User Story 6

- [ ] T049 [P] [US6] Enhance WhatsApp Event model with delivery status tracking
- [ ] T050 [US6] Implement delivery status update service in lib/services/whatsapp-service.ts
- [ ] T051 [US6] Integrate delivery status tracking into message-receipt webhook processing
- [ ] T052 [US6] Enhance message display to show delivery indicators in lib/services/chat-service.ts
- [ ] T053 [US6] Add logging for delivery status tracking operations
- [ ] T054 [US6] Test delivery status tracking with various message types

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T055 [P] Documentation updates in docs/
- [ ] T056 [P] Code cleanup and refactoring
- [ ] T057 [P] Performance optimization across all stories
- [ ] T058 [P] Additional unit tests in lib/services/
- [ ] T059 [P] Security hardening for webhook endpoints
- [ ] T060 [P] Run quickstart.md validation
- [ ] T061 [P] Implement message retention cleanup (30-day auto-delete for raw payloads)
- [ ] T062 [P] Add rate limiting and anti-baneo protection for Evolution API calls

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2/US3 but should be independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1-US4 but should be independently testable
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1-US5 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for payment webhook in tests/contract/test-stripe-webhook.ts"
Task: "Integration test for payment → WhatsApp flow in tests/integration/test-payment-whatsapp.ts"

# Launch all models for User Story 1 together:
Task: "Create Payment Record model extension in lib/payment-record.ts"
Task: "Create Conversation model extension in lib/conversation.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
   - Developer E: User Story 5
   - Developer F: User Story 6
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