# Notifications (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/services/whatsapp-service.ts`
  - **Responsibilities (real):**
    - ✔ `sendWelcomeWhatsAppMessage(paymentRecord)` — finds/creates a `conversations` row for a booking reference, builds a welcome message, inserts a `messages` row, updates `last_message_at`. Comment states the actual WhatsApp send is "done by n8n workflows" but the code never triggers n8n here.
    - ✔ `processIncomingWhatsAppMessage(eventData)` — normalizes phone (E.164-ish), finds/creates a `conversations` row by `user_identifier`, stores inbound `messages` row, updates `last_message_at`. Comment states AI processing is "done by n8n" but code never triggers n8n here.
    - ✔ `generateAIResponse(conversation, userMessage)` — detects language (`detectLanguage`) and calls OpenAI `gpt-4o-mini` DIRECTLY via `generateOpenAIResponse`, with a hardcoded ES/EN system prompt and a fallback string.
    - ✔ `generateOpenAIResponse(...)` — raw `fetch` to `https://api.openai.com/v1/chat/completions` with `OPENAI_API_KEY`.
    - ✔ `generateWelcomeMessage(paymentRecord)` — inline EN/ES templating using `detectLanguage(customer_name)`.
    - ✔ Re-exports `normalizeToE164`, `isValidE164` (from `phone-utils`) and `detectLanguage` (from `language-utils`).
  - **Problem (real):** Named "whatsapp-service" but it owns conversation lifecycle, message persistence, E.164 normalization, language detection, AND direct OpenAI calls. Comments claim WhatsApp sending is delegated to n8n, yet `generateAIResponse` calls OpenAI directly — the real AI path diverges from the documented intent. No actual Evolution/WhatsApp send occurs in this file (only DB writes + OpenAI).

- **File:** `lib/n8n/client.ts`
  - **Responsibilities (real):**
    - ✔ `sendN8nWebhook(event, data)` — POST to `${N8N_BASE_URL}/webhook/${event}` with circuit breaker (`N8N_CIRCUIT`); on open circuit delegates to `enqueueMessage` (channel `n8n`).
    - ✔ `triggerPaymentConfirmation`, `triggerDriverAssigned`, `triggerDeliveryCompleted`, `triggerAiChatMessage`, `triggerEscalation`, `triggerFraudDetection`, `triggerManagerCreated`, `triggerDriverNewAssignment`, `triggerClientDriverConfirmed` — each builds a payload and calls `sendN8nWebhook`; several inline-build WhatsApp text first (ES/EN regex on name) and call `sendOrQueueWhatsApp`.
    - ✔ `sendOrQueueWhatsApp({number, message})` — WhatsApp rate limit (50/hr) + circuit breaker (`evolution-whatsapp`) + `enqueueMessage` fallback.
    - ✔ `sendWhatsAppDirect({number, message})` — DIRECT Evolution API `message/sendText` fetch.
    - ✔ `sendWhatsAppButtons({...})` — DIRECT Evolution API `message/sendButtons` fetch.
    - ✔ Inline templating of all WhatsApp copy (Spanish detection via regex `/[áéíóúñ¿¡]/` + name heuristics).
    - ✔ Imports `enqueueMessage` from `@/lib/queue/message-queue` (this is one side of the `lib/queue ↔ lib/n8n` circular dependency).
  - **Problem (real):** A single client module combines n8n orchestration, Evolution/WhatsApp sending, WhatsApp message templating, rate limiting, and queueing. It depends on the queue package (cycle) and embeds presentation/templating logic. Per-trigger regex Spanish detection is duplicated across triggers.

- **File:** `lib/queue/message-queue.ts`
  - **Responsibilities (real):**
    - ✔ `QueuedMessage` interface (channel `whatsapp | n8n | email`).
    - ✔ `enqueueMessage(...)` — INSERT into `outgoing_messages` table (the outbox).
    - ✔ `dequeuePendingMessages(limit)` — atomically claim `pending|failed` rows (`status='processing'`), apply `next_retry_at` filter and `attempts < max_attempts`.
    - ✔ `markMessageSent`, `markMessageFailed` (exponential backoff `min(1000*2^(n-1),120000)`), `requeueDeadMessages` (resets `dead` < 24h old), `getQueueStats`.
  - **Problem (real):** This is a generic DB-backed outbox, but its `channel` typing and consumer coupling make it a shared cross-cutting dependency that the n8n client reaches into. It is the anchor of the circular dependency.

- **File:** `lib/queue/whatsapp-worker.ts`
  - **Responsibilities (real):**
    - ✔ `processQueue(batchSize)` — dequeues, dispatches by `channel`: `whatsapp` → `sendWhatsAppDirect`/`sendWhatsAppButtons`; `n8n` → `sendN8nWebhook` (parses JSON content). Re-checks circuit `evolution-whatsapp`. Applies random 3–8s delay between sends.
    - ✔ Imports `sendWhatsAppDirect, sendWhatsAppButtons, sendN8nWebhook` from `@/lib/n8n/client` (this is the other side of the `lib/queue ↔ lib/n8n` circular dependency).
  - **Problem (real):** The queue consumer (in `lib/queue`) depends on `lib/n8n/client`, closing the cycle with `client.ts`'s dependency on `message-queue`. The worker also hard-codes WhatsApp-specific circuit logic that belongs with the publisher.

- **File:** `lib/whatsapp-event.ts`
  - **Responsibilities (real):** ✔ `WhatsAppEvent` interface only — pure data contract for the `whatsapp_events` table (no behavior).
  - **Problem (real):** None (passive type module); note it is not actually imported by the webhook handlers (those inline the same shape).

- **File:** `app/api/webhooks/evolution/route.ts`
  - **Responsibilities (real):**
    - ✔ `POST` — verifies `x-evolution-signature` via `timingSafeEqual` against `EVOLUTION_WEBHOOK_SECRET`; validates instance name regex.
    - ✔ `messages.upsert` — normalizes phone, logs to `whatsapp_events`, find/create `conversations` (skips AI trigger when `human_active`), stores inbound `messages`, and `triggerAiChatMessage` when `ai_active`.
    - ✔ `message-receipt.update`, `instance.status`, `connection.update` — log to `whatsapp_events`.
  - **Problem (real):** Webhook handler performs business orchestration (conversation creation, AI trigger) inline with auth. Duplicates conversation/message creation logic already present in `whatsapp-service.ts` (`processIncomingWhatsAppMessage`).

- **File:** `app/api/webhooks/n8n/route.ts`
  - **Responsibilities (real):**
    - ✔ `POST` — verifies `x-n8n-signature` via `timingSafeEqual` against `N8N_WEBHOOK_SECRET`.
    - ✔ Large `switch` over events: `ai-chat-response`, `payment-confirmed`, `escalation-complete`, `fraud-alert`, `driver-assigned`, `delivery-completed`, `whatsapp-escalation`, `whatsapp-ai-response`, `whatsapp-sent` — each inserts `messages`, updates `conversations` status / `ai_confidence` / `flagged`, or logs `whatsapp_events`.
  - **Problem (real):** One ~290-line handler owns notification callbacks, conversation state transitions, fraud flags, and escalation — i.e. it is the inbound side of three different domains (notifications, chat, fraud) in a single route.

- **File:** `app/api/cron/process-queue/route.ts`
  - **Responsibilities (real):**
    - ✔ `GET` — `verifyAuth` accepts `x-vercel-cron: 1` or `?secret=CRON_SECRET`; calls `processQueue(10)`, `getQueueStats`; every 12th call runs `requeueDeadMessages`.
  - **Problem (real):** Cron driver is coupled to the queue worker and circuit-breaker stats; it is the only real "scheduler" for outbound delivery.

## Module-level real responsibilities

- ✔ Inbound WhatsApp ingestion (Evolution webhook → conversation + message persistence, AI trigger).
- ✔ Outbound message fan-out to n8n workflows and directly to Evolution API (text + buttons).
- ✔ Outbox/queue persistence, retry with backoff, dead-letter requeue, stats.
- ✔ Cron-driven queue worker.
- ✔ Inbound n8n callbacks that mutate conversation state and persist AI responses.
- ✔ Inline WhatsApp copy templating (ES/EN) duplicated across triggers and `whatsapp-service.ts`.

## Proposed split (target per Blueprint domains/packages)

- `packages/domains/notifications` → `WhatsAppPublisher` (Evolution sendText/sendButtons), `N8nClient` (webhook trigger only), `TemplateEngine` (ES/EN WhatsApp copy, single source), `NotificationRepository` (conversation/message/whatsapp_events reads & writes), `OutboxWriter` (enqueue) and `OutboxWorker`/`QueueWorker` (consume) moved to `packages/infra/queue`.
- `packages/infra/realtime` or `packages/infra/queue` → the outbox (`enqueueMessage`/`dequeuePendingMessages`/`markMessageFailed`/`requeueDeadMessages`) as a generic infra service, decoupled from notification channel semantics.
- `packages/domains/ai` → the OpenAI `generateAIResponse`/`generateOpenAIResponse` logic currently buried in `whatsapp-service.ts` should live in the AI domain, not a "whatsapp" service.
- `app/api/webhooks/evolution` and `app/api/webhooks/n8n` → thin adapters that only verify signature + hand a typed event to `NotificationRepository`/`ConversationService` (move business logic out of the route).
- `app/api/cron/process-queue` → scheduler that calls `QueueWorker.process()` from infra.

## Dependency observations (real)

- **CONFIRMED circular dependency `lib/queue ↔ lib/n8n`:**
  - `lib/n8n/client.ts:4` → `import { enqueueMessage } from '@/lib/queue/message-queue'` (notifications depends on queue outbox).
  - `lib/queue/whatsapp-worker.ts:2` → `import { sendWhatsAppDirect, sendWhatsAppButtons, sendN8nWebhook } from '@/lib/n8n/client'` (queue consumer depends on notifications/n8n).
  - `lib/queue/message-queue.ts` itself imports ONLY `@/lib/db` and `@/lib/logger` — it does not import n8n, so the cycle is exactly: `n8n/client` → `queue/message-queue` (one hop) and `queue/whatsapp-worker` → `n8n/client` (closing the loop through the `lib/queue` directory).
  - **How to break it:** Move `enqueueMessage` (and the `QueuedMessage` contract) into a shared infra/outbox package (`packages/infra/queue` or `packages/shared`) so `n8n/client` depends on the outbox abstraction, not on `lib/queue`. The queue consumer (`whatsapp-worker`) should depend on the notifications **publisher interface** (an `OutboundChannel` port) rather than importing `lib/n8n/client` and `lib/services` directly — i.e. invert the dependency so `lib/n8n` and `lib/queue` both depend on a shared contract, and neither depends on the other.
