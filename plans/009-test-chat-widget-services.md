# Plan 009: Add Test Coverage for Chat Widget, Chat Service, and Chat Routes

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/components/chat/ lib/services/chat-service.ts lib/services/ollama-service.ts lib/moderation/ app/api/chat/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plan 005 (chat SQL arg fix) — tests verify the fix
- **Category**: tests
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The ChatWidget (890 lines) is a complex 4-screen state machine with polling (5s interval), inactivity timers (60s warning, 90s close), 5 API calls, localStorage persistence, and message deduplication — all with zero tests. The chat service (209 lines) and Ollama service (104 lines) handle SQL queries and AI fallback logic — also untested. The comment filter (52 lines) has profanity/spam filtering with zero tests. The `releaseToAIMode` args bug (Plan 005) was discovered during audit; tests would have caught it.

## Current state

**Files to test**:

| File | Lines | Role |
|------|-------|------|
| `app/components/chat/ChatWidget.tsx` | ~890 | Full chat widget: form → chat → survey → closed screens, polling, timers, fetch calls, localStorage |
| `lib/services/chat-service.ts` | ~209 | `takeOverConversation`, `releaseToAIMode`, `getConversationById`, `getConversations` with SQL filter building |
| `lib/services/ollama-service.ts` | ~104 | `generateOllamaResponse`, escalation detection, history management |
| `lib/moderation/comment-filter.ts` | ~52 | Profanity filter, URL detection, spam pattern matching |
| `app/api/chat/send/route.ts` | ~364 | Chat send endpoint with n8n + Ollama fallback (some tests exist at integration level) |
| `app/api/chat/start/route.ts` | ~80 | Chat start endpoint |
| `app/api/chat/messages/route.ts` | ~60 | Chat messages endpoint |

**Existing test pattern**: `app/components/booking/__tests__/booking-form.test.tsx` uses `@testing-library/react` with `render`, `screen`, `fireEvent`. Use as the pattern for ChatWidget tests.

**Convention**: Component tests live in `app/components/<name>/__tests__/`. API route tests live in `tests/app/api/`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Run specific | `pnpm test -- app/components/chat/` | chat component tests pass |

## Scope

**In scope**:
- Create `app/components/chat/__tests__/ChatWidget.test.tsx`
- Create `app/components/chat/__tests__/chat-service.test.ts`
- Create `app/components/chat/__tests__/ollama-service.test.ts`
- Create `app/components/chat/__tests__/comment-filter.test.ts`
- Create `tests/app/api/chat/send/route.test.ts`
- Create `tests/app/api/chat/start/route.test.ts`
- Create `tests/app/api/chat/messages/route.test.ts`

**Out of scope**:
- ChatWidget.backup file (leave untouched)
- E2E tests for chat
- Modifications to production chat code

## Git workflow

- Branch: `tests/009-chat-widget-services`
- Commit per logical unit: `test: add ChatWidget component tests`, `test: add chat service tests`, etc.
- Do NOT push or open a PR

## Steps

### Step 1: Test comment-filter (pure function, no mocks needed)

Create `app/components/chat/__tests__/comment-filter.test.ts`.

Test cases for `lib/moderation/comment-filter.ts`:
1. Clean text passes filter unchanged
2. Profanity is blocked or redacted
3. URLs are detected/blocked
4. Spam patterns (repeated characters, excessive caps) are flagged
5. Edge cases: empty string, special characters, mixed languages

**Verify**: `pnpm test -- comment-filter` → all pass

### Step 2: Test chat-service functions

Create `app/components/chat/__tests__/chat-service.test.ts`. Mock `@/lib/db`:
```ts
vi.mock('@/lib/db', () => ({ getDb: vi.fn() }))
```

Test cases:
1. `getConversations` with status filter → correct SQL WHERE clause built
2. `getConversations` without filter → no WHERE clause
3. `getConversationById` found → returns conversation
4. `getConversationById` not found → returns null
5. `takeOverConversation` success → updates status, returns conversation
6. `releaseToAIMode` with correct args order (Plan 005 fix) → updates correctly
7. `releaseToAIMode` rowsAffected === 0 → returns null (no-op)

**Verify**: `pnpm test -- chat-service` → all pass

### Step 3: Test Ollama service

Create `app/components/chat/__tests__/ollama-service.test.ts`. Mock `@/lib/db` and the external fetch to Ollama.

Test cases:
1. Ollama API returns valid response → message extracted correctly
2. Ollama API returns error → fallback or error handled
3. Low confidence response → escalation flag set
4. Empty history → handled gracefully

**Verify**: `pnpm test -- ollama-service` → all pass

### Step 4: Test ChatWidget component (most complex)

Create `app/components/chat/__tests__/ChatWidget.test.tsx`. Use `@testing-library/react` with mocked `fetch` and timers.

Critical test cases (select most important — do NOT test every UI permutation):
1. **Initial render** shows FormScreen with name/email/phone/country fields
2. **Form submission** with valid data calls POST /api/chat/start and transitions to ChatScreen
3. **Form submission** with missing name shows validation error
4. **Message sending** calls POST /api/chat/send with correct payload
5. **Polling** fetches messages every 5 seconds
6. **Inactivity timer** shows warning after 60s, closes after 90s
7. **Close conversation** transitions to SurveyScreen
8. **Survey submission** calls rating endpoint

Mock strategy for ChatWidget:
- Mock `global.fetch` to return controlled responses
- Use `vi.useFakeTimers()` for polling and inactivity timer tests
- Mock `localStorage` (already mocked globally in `tests/setup.ts`)

**Verify**: `pnpm test -- ChatWidget` → all pass

### Step 5: Test chat API routes

Create `tests/app/api/chat/send/route.test.ts`, `tests/app/api/chat/start/route.test.ts`, and `tests/app/api/chat/messages/route.test.ts`. Mock `@/lib/db`, `@/lib/n8n/client`, and `@/lib/services/ollama-service`.

Test send route (critical path — verify Plan 005 fix):
1. POST with valid message → n8n triggered, AI response returned
2. POST with valid message, n8n confidence < 0.5 → conversation escalated (verify `args` have 1 element)
3. n8n API fails → Ollama fallback invoked
4. Both n8n and Ollama fail → error response
5. Missing message → 400
6. Missing conversationId → 400

Test start route:
1. POST with valid user data → conversation created, 200 returned
2. Missing required fields → 400

Test messages route:
1. GET with conversationId → messages returned
2. Missing conversationId → 400
3. Conversation not found → 404

**Verify**: `pnpm test` → all 57+ old + ~50-70 new tests pass

## Test plan

- ~50-70 new tests across 7 test files
- Pure function tests (comment-filter) need no mocking
- Service tests mock `getDb()` at module level
- ChatWidget tests mock `fetch` and use fake timers
- API route tests mock DB, n8n client, and auth

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 with increased test count
- [ ] ChatWidget tests verify form → chat → survey → closed transitions
- [ ] Chat service tests verify SQL arg order (Plan 005 fix) is correct
- [ ] Comment-filter tests cover profanity, URLs, spam patterns
- [ ] Chat API route tests verify escalation endpoint has correct args (1 element, not 2)
- [ ] No production code files are modified

## STOP conditions

Stop and report back if:
- ChatWidget.tsx has been significantly refactored (it has a `.backup` file suggesting recent changes).
- Mocking the complex ChatWidget component proves impractical — focus on service-layer and API tests instead, and note the limitation.
- The polling mechanism uses `setInterval` that's hard to control with fake timers — use `vi.advanceTimersByTime()`.
- A test file exceeds 400 lines — split by screen (FormScreen, ChatScreen, SurveyScreen).
- A verification fails twice.

## Maintenance notes

- These tests guard the highest-churn feature area. Run them before any chat-related changes.
- The comment-filter is a pure function — any new moderation rules should follow the test pattern established here.
- Reviewer: pay special attention to the polling deduplication logic tests — it's the most error-prone code in ChatWidget.
