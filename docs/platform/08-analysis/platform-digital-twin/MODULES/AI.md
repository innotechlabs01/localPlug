# AI (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/services/ollama-service.ts`
  - **Responsibilities (real):**
    - ✔ `generateOllamaResponse({message, conversationHistory, bookingInfo, userCountry})` — builds a messages array (system prompt + booking-info system note + last 6 history + user message), POSTs to `${OLLAMA_BASE_URL}/api/chat` (default `http://localhost:11434`, model `llama3.1:8b`), returns `{ message, confidence }`.
    - ✔ Contains a hardcoded Spanish `SYSTEM_PROMPT` describing the LocalPlug concierge persona and a CRITICAL escalation rule.
    - ✔ `ESCALATION_KEYWORDS` array + `detectEscalation(text)` — sets `confidence` to `0.3` when an escalation keyword matches, else `0.85`.
  - **Problem (real):** The Ollama client is the *fallback* AI provider, but it hardcodes the entire persona, escalation policy, and confidence heuristic. It is a second AI implementation that overlaps with the n8n/OpenAI path. The Spanish-only `SYSTEM_PROMPT` means EN users still get a Spanish-system-prompt model (language handling is inconsistent with `whatsapp-service.ts`'s EN/ES split).

- **File:** `lib/services/whatsapp-service.ts` (AI portion)
  - **Responsibilities (real):**
    - ✔ `generateAIResponse(conversation, userMessage)` — detects language and calls OpenAI `gpt-4o-mini` DIRECTLY via `generateOpenAIResponse` with hardcoded EN/ES system prompts and a localized fallback string.
    - ✔ `generateOpenAIResponse(...)` — raw `fetch` to OpenAI chat completions using `OPENAI_API_KEY`.
  - **Problem (real):** A third AI path (OpenAI) lives inside a file named "whatsapp-service", independent of the Ollama fallback and independent of the n8n `ai-chat-message` webhook path. There are now THREE divergent AI implementations: (1) n8n `triggerAiChatMessage` → external workflow, (2) OpenAI direct in `whatsapp-service`, (3) Ollama in `ollama-service`.

- **File:** `app/api/chat/send/route.ts` (AI orchestration portion)
  - **Responsibilities (real):**
    - ✔ Orchestrates the AI chain: `triggerAiChatMessage` (n8n) → if returns direct non-system message, persist; else return `pending` for polling; if n8n fails, `generateOllamaResponse` (ollama) → if empty, localized `t('chat.fallback')`.
    - ✔ Applies the `< 0.5` confidence → `human_active` escalation rule (twice: for n8n-direct and for ollama).
  - **Problem (real):** The real "AI orchestrator" is a route handler. The n8n/OpenAI/Ollama selection, confidence handling, and fallback ordering are all embedded here, and the confidence-escalation rule is also reimplemented in `ai-response`, n8n webhook, and `ollama-service`.

- **File:** `app/api/chat/ai-response/route.ts`
  - **Responsibilities (real):** ✔ `POST` — n8n async callback that persists an `ai` message + `ai_confidence` and applies `confidence < 0.5` → `human_active`.
  - **Problem (real):** The n8n "AI responded" path is split between this route (async) and the inline n8n-direct branch in `send` (sync), with duplicated storage + escalation logic.

- **File:** `app/api/webhooks/n8n/route.ts` (AI callback cases)
  - **Responsibilities (real):** ✔ `ai-chat-response` and `whatsapp-ai-response` cases store AI messages + confidence and escalate on `confidence < 0.5` — the WhatsApp-channel mirror of `ai-response/route.ts`.
  - **Problem (real):** Same AI-response persistence logic exists a fourth time (web `ai-response`, web n8n-direct in `send`, WhatsApp `whatsapp-ai-response`, Ollama branch).

- **File:** `app/api/chat/escalate/route.ts` and `app/api/chat/request-escalate/route.ts` (escalation to human)
  - **Responsibilities (real):** ✔ `request-escalate` calls `triggerEscalation` to n8n and assigns an agent; ✔ `escalate` (admin take-over) calls `takeOverConversation`. Both flip conversation to `human_active`.
  - **Problem (real):** "Escalate to human" is treated as an AI-domain outcome in `ollama-service` (confidence 0.3) but executed as a chat/conversation state change — the AI domain only *signals* escalation; it does not own the transition.

## Module-level real responsibilities

- ✔ Three AI providers: n8n workflow (`triggerAiChatMessage`), OpenAI direct (`whatsapp-service.generateAIResponse`), Ollama local (`ollama-service.generateOllamaResponse`).
- ✔ Language detection (EN/ES) via `detectLanguage` (imported by `whatsapp-service`) and via hardcoded Spanish system prompt (Ollama).
- ✔ Confidence scoring + low-confidence escalation rule (`< 0.5` → `human_active`).
- ✔ Fraud-pattern detection (`FRAUD_PATTERNS` in `chat/send`) and topic blocking (`BLOCKED_TOPICS`) that gate/flag before AI runs.
- ✔ Async (polling-based) vs sync (n8n-direct) AI result delivery.

## Proposed split (target per Blueprint domains/packages)

- `packages/domains/ai` → `AiOrchestrator` (single entry point owning provider selection: n8n → OpenAI → Ollama → localized fallback), `ConfidencePolicy` (the `< 0.5` escalate rule in one place), `LanguageStrategy` (EN/ES persona + detection, shared with notifications templating).
- `packages/domains/ai/providers` → `N8nAiProvider`, `OpenAiProvider`, `OllamaProvider` as swappable adapters behind one interface. Move `generateAIResponse`/`generateOpenAIResponse` out of `whatsapp-service` and `generateOllamaResponse` out of `ollama-service`.
- `packages/domains/safety` → `FraudDetector` and `TopicBlocklist` validators (the regex arrays) consumed by the orchestrator before calling a provider.
- `packages/domains/chat` → owns the actual escalation *state transition* (`human_active`); the AI domain only emits an `EscalationSuggested` event/decision.

## Dependency observations (real)

- The AI domain has no internal circular dependency, but it is invoked from many places: `app/api/chat/send`, `app/api/webhooks/n8n`, `app/api/chat/ai-response`, and `lib/services/whatsapp-service`. The n8n trigger it relies on (`triggerAiChatMessage`) lives in the Notifications module (`lib/n8n/client`), so AI depends on notifications for its primary provider path — and notifications, via `whatsapp-worker`, depends on `lib/queue`, which is the package that also forms the `lib/queue ↔ lib/n8n` cycle.
- The confidence-escalation rule is duplicated in at least four files: `chat/send` (n8n-direct + ollama branches), `chat/ai-response`, `webhooks/n8n` (`ai-chat-response` + `whatsapp-ai-response`), and `ollama-service` (confidence value). This should collapse into one `ConfidencePolicy`.
