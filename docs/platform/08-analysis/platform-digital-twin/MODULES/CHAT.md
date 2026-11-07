# Chat (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/conversation.ts`
  - **Responsibilities (real):** ✔ `Conversation` TypeScript interface only — the persisted shape (status `ai_active|human_active|closed`, channel `web|whatsapp|n8n`, `assigned_agent_id`, `ai_confidence`, `flagged`, `whatsapp_instance`, plus a `payment_record?` relation). Pure data contract.
  - **Problem (real):** None behaviorally; note many fields (`priority`, `user_phone`, `country_code`, `first_agent_response_at`) exist on the DB/type but are only partially populated by callers.

- **File:** `lib/services/chat-service.ts`
  - **Responsibilities (real):**
    - ✔ `takeOverConversation(conversationId, agentId, reason?)` — sets `human_active`, assigns agent, calls `incrementAgentLoad`.
    - ✔ `releaseToAIMode(conversationId, agentId, closedBy?)` — sets `ai_active`, clears assignment, `decrementAgentLoad`.
    - ✔ `closeConversation(conversationId, closedBy)` — sets `closed`, inserts system message, `decrementAgentLoad`; works from any status.
    - ✔ `getConversationById`, `getConversations(filters)` — read queries with optional `status/channel/search/limit/offset`.
    - ✔ Imports `incrementAgentLoad`/`decrementAgentLoad` from `agent-service`.
  - **Problem (real):** Conversation lifecycle + agent load bookkeeping are coupled here. The service writes SQL directly and reaches into `agent-service` for load counters, so conversation domain and agent-capacity domain are entangled in one module.

- **File:** `lib/services/agent-service.ts`
  - **Responsibilities (real):**
    - ✔ `findAvailableAgent(topic?)` — queries `support_agents` where `status='available'` and `current_conversations < max_conversations`, optionally filters by `specializations` JSON; picks least-loaded.
    - ✔ `incrementAgentLoad(agentId)` / `decrementAgentLoad(agentId)` — adjust `current_conversations` and flip `status` to `busy`/`available` with a CASE expression.
  - **Problem (real):** Agent capacity logic is also independently reimplemented inline in route handlers (see `escalate`/`request-escalate`), so there are two sources of truth for load changes.

- **File:** `app/api/chat/start/route.ts`
  - **Responsibilities (real):** ✔ `POST` — validates name/email/phone/country/countryCode, creates a `web` `ai_active` conversation, inserts a localized welcome AI message (`t('chatWidget.startMessage')`), triggers `triggerAiChatMessage` to n8n. Returns `conversationId` + `sessionId`.
  - **Problem (real):** Mixes conversation creation, i18n message insertion, and n8n AI trigger in one handler. Public (no Clerk auth per middleware).

- **File:** `app/api/chat/send/route.ts`
  - **Responsibilities (real):**
    - ✔ `POST` — accepts `senderType` `user|agent`. For `agent`: creates/uses conversation, stores agent message, tracks `first_agent_response_at`.
    - ✔ For `user`: blocked-topic check (`BLOCKED_TOPICS` regex) and fraud check (`FRAUD_PATTERNS` regex); on fraud flags conversation + `triggerFraudDetection`.
    - ✔ Stores user message, fetches profile/booking/last-10-history, calls `triggerAiChatMessage`; if n8n returns a message directly (non-system) stores it; else returns `pending` for polling.
    - ✔ Falls back to `generateOllamaResponse` (ollama-service), then to localized `t('chat.fallback')`.
    - ✔ On low confidence (`< 0.5`) flips conversation to `human_active`.
  - **Problem (real):** This single route is the richest in the chat domain: it owns fraud detection, topic blocking, AI orchestration across n8n AND ollama, and conversation-state side effects. It duplicates the AI-response storage logic that also lives in `ai-response` route and the n8n webhook.

- **File:** `app/api/chat/ai-response/route.ts`
  - **Responsibilities (real):** ✔ `POST` — stores an `ai` message for `conversationId`, sets `ai_confidence`, and on `confidence < 0.5` sets `human_active`. This is the n8n async callback target referenced by the chat `send` flow's "pending" path.
  - **Problem (real):** Nearly identical logic to `whatsapp-ai-response` in `app/api/webhooks/n8n/route.ts` and to the inline n8n-direct branch in `send` — three places persist an AI response + confidence escalation.

- **File:** `app/api/chat/request-escalate/route.ts`
  - **Responsibilities (real):** ✔ `POST` — finds available agent (`findAvailableAgent`, retries once after 2s), assigns conversation to `human_active`, increments load, logs assignment, and `triggerEscalation` to n8n. If no agent, marks `human_active` without assignment.
  - **Problem (real):** Reimplements agent-load increment that `agent-service` already exposes, and duplicates assignment/escalation messaging found in `escalate` route.

- **File:** `app/api/chat/escalate/route.ts`
  - **Responsibilities (real):** ✔ `POST` (admin take-over) — Clerk auth, resolves internal user via `clerk_id`, checks `role_id`, auto-creates a `support_agents` row if missing, calls `takeOverConversation`, then auto-assigns other unassigned `human_active` conversations (re-derives agent load inline instead of via `agent-service`).
  - **Problem (real):** Auth/role resolution is duplicated per-route (also in `conversations`, `messages`, `agents`, `close`). Auto-creates agent records inline, and re-implements assignment loop already partially in `chat-service`/`agent-service`.

- **File:** `app/api/chat/conversations/route.ts`
  - **Responsibilities (real):** ✔ `GET` — Clerk auth, lists `conversations` with joins to `support_agents`, filters `status/flagged/agentId/dateFrom/dateTo`, returns message counts + last message, paginates with total count.
  - **Problem (real):** Admin read surface lives in a chat route; duplicates Clerk→internal-user + role check pattern.

- **File:** `app/api/chat/messages/route.ts`
  - **Responsibilities (real):** ✔ `GET` — fetches messages for a `conversationId` with agent-name join; web-channel conversations are public, others require Clerk auth + role check (`role_id === null` → 403).
  - **Problem (real):** The polling endpoint for the widget; auth branch duplicates the Clerk→user→role resolution seen elsewhere.

- **File:** `app/api/chat/agents/route.ts`
  - **Responsibilities (real):** ✔ `GET` list agents; ✔ `POST` create/update agent (role check); ✔ `PATCH` update agent status (role check). All do inline Clerk→internal-user→`role_id` resolution.
  - **Problem (real):** Agent CRUD + status management lives in a chat route; auth pattern duplicated.

- **File:** `app/api/chat/agents/available/route.ts`
  - **Responsibilities (real):** ✔ `GET` — calls `findAvailableAgent(topic)` and returns `{ available, agent }`. No auth.
  - **Problem (real):** Thin wrapper; fine, but the agent-capacity model is shared with `request-escalate` and `escalate`.

- **File:** `app/api/chat/agent-me/route.ts`
  - **Responsibilities (real):** ✔ `GET` — Clerk auth, resolves internal user, returns linked `support_agents.id` (or null).
  - **Problem (real):** Auth resolution duplicated.

- **File:** `app/api/chat/close/route.ts`
  - **Responsibilities (real):** ✔ `POST` — supports `releaseToAi`, agent-close, and user-close; dispatches to `closeConversation`/`releaseToAIMode`. Some branches re-resolve the Clerk user inline.
  - **Problem (real):** Mixed close/release paths; partial inline auth.

- **File:** `app/api/chat/rating/route.ts`
  - **Responsibilities (real):** ✔ `POST` — inserts a `conversation_ratings` row. Public (per middleware).
  - **Problem (real):** Rating is a sub-domain (feedback) embedded in chat routes; no auth but tied to `conversationId` only.

- **File:** `app/components/chat/ChatWidget.tsx`
  - **Responsibilities (real):** ✔ Client widget with form/chat/survey/closed screens; starts conversation (`/api/chat/start`), sends (`/api/chat/send`), closes (`/api/chat/close`), escalates (`/api/chat/request-escalate`); **polls** `/api/chat/messages` every 5s (no socket/EventSource); inactivity timeout (60s warn / 90s close); persists `conversationId`/`chat_user_id`/`rated_*` in `localStorage`.
  - **Problem (real):** The UI owns polling cadence and dedup logic; "realtime" of the chat experience depends entirely on this 5s poll, duplicating the admin polling pattern in `realtime-context.tsx`.

## Module-level real responsibilities

- ✔ Conversation lifecycle: create (web/whatsapp), take-over, release-to-AI, close.
- ✔ Agent capacity: find-available, load increment/decrement, assignment.
- ✔ Message ingestion (store) and AI response persistence (n8n direct, n8n async callback, ollama fallback, localized fallback).
- ✔ Fraud detection (regex) + topic blocking + auto-escalation on low confidence.
- ✔ Client widget with 5s polling and inactivity handling.

## Proposed split (target per Blueprint domains/packages)

- `packages/domains/chat` → `ConversationService` (lifecycle: start/takeover/release/close), `MessageRepository`, `AgentService`/`AgentCapacity` (find-available + load counters as the single source of truth), `EscalationService`.
- `packages/domains/ai` → `AiOrchestrator` that owns the n8n→ollama→fallback chain and the confidence→escalate rule (currently smeared across `send` + `ai-response` + n8n webhook).
- `packages/domains/safety` → `FraudDetector` + `TopicBlocklist` (the regex sets) as a real validator, not inline arrays in a route.
- `packages/infra/auth` (shared) → a single `requireAgent`/`resolveInternalUser` used by every admin route instead of duplicated Clerk→`clerk_id`→`role_id` lookups.
- `packages/infra/realtime` → the client-side polling should be a shared hook/port; `ChatWidget` stays a thin view.

## Dependency observations (real)

- The chat domain calls into `lib/n8n/client` (`triggerAiChatMessage`, `triggerFraudDetection`, `triggerEscalation`) and `lib/services/ollama-service` directly from route handlers — AI orchestration is embedded in the transport layer.
- Auth/role resolution (`auth()` → `users.clerk_id` → `role_id`) is copy-pasted across `escalate`, `conversations`, `messages`, `agents`, `close`, `agent-me` rather than centralized.
- AI-response persistence is implemented in three places with slight divergence: `app/api/chat/ai-response/route.ts`, the `whatsapp-ai-response` case in `app/api/webhooks/n8n/route.ts`, and the inline n8n-direct branch in `app/api/chat/send/route.ts`.
- No circular dependency was found within the chat domain itself, but it participates in the broader `lib/queue ↔ lib/n8n` cycle indirectly via the n8n triggers it calls (those live in the Notifications module).
