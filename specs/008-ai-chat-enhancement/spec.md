# Feature Specification: AI Chat Enhancement + Unified n8n Business Workflow + i18n Audit

**Feature Branch**: `008-ai-chat-enhancement`

**Created**: 2026-05-16

**Updated**: 2026-05-17

**Status**: Draft → Clarified

**Input**: User description: "Review what's pending in the project and how to improve it with AI. We're still using mock AI. Also keep in mind we have i18n so any text we add should be in both EN and ES locales."

## Clarifications

### Session 2026-05-17

- Q: Should this spec be broadened beyond AI-chat to include WhatsApp notifications, driver confirmation, and payment automation? → A: Yes — broaden to cover the unified n8n business process flow including WhatsApp, driver confirmation, and payment notifications.
- Q: Which WhatsApp provider? → A: WhatsApp Business Cloud API via Twilio.
- Q: How does the payment confirmation trigger work? → A: Webhook from Stripe (`checkout.session.completed` event fires to n8n).
- Q: Does n8n manage driver data or delegate to the app? → A: n8n only sends WhatsApp notifications; the app handles driver assignment logic separately.
- Q: What is the WhatsApp notification sequence? → A: Three-message sequence: (1) Payment received, (2) Driver assigned with ETA, (3) Delivery completed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Real AI Response via n8n (Priority: P1)

As a customer chatting with support, I receive smart, context-aware responses from an AI connected to a real natural language processing backend instead of keyword-matched mock replies. The AI can understand follow-up questions, handle complex queries, and maintain conversation context.

**Why this priority**: This is the core improvement — replacing the current mock AI with real AI processing via n8n is the primary pending item and directly impacts customer experience.

**Independent Test**: Open chat widget → send a question that does not match any keyword → receive a coherent AI response → ask a follow-up question → receive a contextually relevant reply.

**Acceptance Scenarios**:

1. **Given** the user sends a message that does not match any predefined keyword, **When** the system processes it, **Then** the AI generates a relevant response instead of the default fallback.
2. **Given** the user asks a follow-up question referencing the previous message, **When** the AI processes it, **Then** the response maintains conversation context.
3. **Given** n8n is unreachable or returns an error, **When** the system processes the message, **Then** it falls back to a graceful message and queues the request for retry.

---

### User Story 2 — i18n Audit for All Hardcoded Text (Priority: P1)

As an admin managing the platform in both English and Spanish, I see no hardcoded text anywhere in the UI or API responses. All user-facing strings are centralized in the locale files and use the i18n system.

**Why this priority**: The user explicitly requested all text be centralized. The API currently has hardcoded Spanish responses for blocked topics, fraud detection, and mock AI that bypass the i18n system entirely. Without centralization, maintaining bilingual support will become increasingly error-prone as the app grows.

**Independent Test**: Switch language to English → trigger a blocked topic → see the response in English → switch to Spanish → trigger the same blocked topic → see the response in Spanish.

**Acceptance Scenarios**:

1. **Given** a user sends a blocked topic message (e.g., lost items), **When** the system processes it, **Then** the rejection message is rendered using i18n locale keys in the correct language.
2. **Given** a user sends a fraud-detected message, **When** the system responds, **Then** the fraud response is rendered using i18n locale keys.
3. **Given** the AI generates a mock fallback response (when n8n is unavailable), **When** it displays, **Then** the text comes from locale files, not hardcoded strings.
4. **Given** an agent sends messages through the admin chat center, **When** the system processes them, **Then** all status labels, button text, and notifications use the i18n system.

---

### User Story 3 — n8n Workflow Integration Audit (Priority: P2)

As a developer or admin, I have clear visibility into whether n8n workflows are properly connected and processing chat messages. The n8n client calls exist but need verification that the workflows handle messages end-to-end.

**Why this priority**: The n8n integration client is already built and calls are being made, but the responses from n8n are not being used — the mock AI still generates replies regardless. This story audits and fixes the integration so n8n responses actually drive the chat.

**Independent Test**: Send a chat message → n8n workflow processes it → response comes from n8n AI → verify it is stored as the AI response.

**Acceptance Scenarios**:

1. **Given** a user sends a message, **When** the n8n `ai-chat-message` webhook fires, **Then** the n8n response is used as the AI response (not the mock generator).
2. **Given** n8n returns a response with metadata (confidence score, intent), **When** the system processes it, **Then** the conversation is updated with the confidence score and auto-escalation triggers if confidence is below threshold.
3. **Given** the n8n webhook is called, **When** it succeeds, **Then** the success is logged and no fallback mock is used.

---

### User Story 4 — Chat Widget i18n Coverage (Priority: P2)

As a customer using the chat widget, I see all text in my selected language. The chat widget currently has some hardcoded strings and the start message contains an emoji-reliant greeting that may not feel natural in all contexts.

**Why this priority**: The widget is the primary customer touchpoint. Ensuring full i18n coverage there means every user interaction is properly localized.

**Independent Test**: Open chat widget in English → see all labels in English → switch site to Spanish → open chat widget → see all labels in Spanish.

**Acceptance Scenarios**:

1. **Given** the chat widget loads, **When** the page language is English, **Then** all widget text (title, subtitle, input placeholder, start message, buttons) displays in English.
2. **Given** the chat widget loads, **When** the page language is Spanish, **Then** all widget text displays in Spanish.
3. **Given** the chat widget connection fails, **When** the error message appears, **Then** it uses the correct locale.

---

### User Story 5 — WhatsApp Payment & Delivery Notifications (Priority: P1)

As a customer who has paid for a service, I receive WhatsApp notifications at each milestone — payment confirmation, driver assignment with ETA, and delivery completion — so I know the status of my booking without checking the platform.

**Why this priority**: This is the core business automation the n8n workflow must handle. Without WhatsApp notifications, the customer is left without visibility after payment.

**Independent Test**: Complete a Stripe checkout → receive WhatsApp message confirming payment → admin assigns driver → receive WhatsApp message with driver name and ETA → delivery marked complete → receive WhatsApp delivery completion message.

**Acceptance Scenarios**:

1. **Given** a Stripe `checkout.session.completed` webhook fires, **When** n8n receives it, **Then** a WhatsApp message is sent to the customer confirming payment received with booking reference.
2. **Given** a driver is assigned to the booking (handled by app logic), **When** the app sends a `driver-assigned` event to n8n, **Then** a WhatsApp message is sent with driver name, photo, vehicle info, and ETA.
3. **Given** the delivery is marked complete in the app, **When** the app sends a `delivery-completed` event to n8n, **Then** a WhatsApp message is sent confirming delivery completion.
4. **Given** WhatsApp delivery fails, **When** n8n receives a non-delivery report, **Then** the failure is logged and the message is queued for retry (max 3 attempts).

---

### Edge Cases

- What happens when n8n returns an error or times out? The system uses a graceful localized fallback and queues the message for retry.
- What happens when a user has a language that is not EN or ES? Default to EN and clearly indicate the language preference was not recognized.
- What happens when new text is added to the codebase without corresponding locale entries? A validation process should catch this (future concern).
- What happens when i18n keys are missing for a particular locale? Fall back to EN gracefully.
- What happens with the mock AI responses when n8n is connected? They should be removed entirely, with only a localized fallback for n8n failures.
- What happens when WhatsApp delivery fails? The message is retried up to 3 times by n8n; if all attempts fail, the failure is logged and the system falls back to in-app notification via the existing chat widget.
- What happens if the customer's phone number is missing or invalid? The n8n workflow skips WhatsApp and logs the error; no blocking failure — the booking flow continues.
- What happens if Stripe webhook fires but the booking order is not yet created? n8n validates the order exists and retries with backoff; if order never materializes, the webhook is logged as orphaned.
- What happens when n8n is down for WhatsApp sending? Messages are queued in n8n's internal queue and retried; no message data is lost.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace the keyword-based mock AI response generator with real AI responses via the n8n chat message webhook.
- **FR-002**: When n8n returns a response, the system MUST use that response as the AI reply (not fall through to mock).
- **FR-003**: When n8n is unavailable, the system MUST provide a localized fallback message and queue the message for retry.
- **FR-004**: All chat API response messages (blocked topics, fraud, system messages) MUST use i18n locale keys instead of hardcoded strings.
- **FR-005**: The mock AI response generator (`generateMockAiResponse`) MUST be removed once n8n integration is confirmed working.
- **FR-006**: All admin chat center text MUST use i18n locale keys (already done, but MUST be verified).
- **FR-007**: All chat widget text MUST use i18n locale keys (already done, but MUST be verified).
- **FR-008**: The i18n locale files MUST include both EN and ES translations for every user-facing string.
- **FR-009**: Missing locale entries MUST gracefully fall back to the EN translation.
- **FR-010**: The n8n chat response MUST include metadata (confidence score) and the system MUST auto-escalate when confidence is below 0.5.
- **FR-011**: The n8n workflow MUST be a single unified flow that handles AI chat responses, payment confirmations, driver notifications, and delivery completion messages — NOT multiple disjoint workflows.
- **FR-012**: WhatsApp notifications MUST use WhatsApp Business Cloud API via Twilio as the messaging provider.
- **FR-013**: A Stripe `checkout.session.completed` webhook MUST trigger the payment notification flow in n8n.
- **FR-014**: The n8n workflow MUST send a three-message WhatsApp sequence: (1) payment received with booking reference on Stripe payment, (2) driver assigned with name and ETA when the app triggers `driver-assigned`, (3) delivery completed when the app triggers `delivery-completed`.
- **FR-015**: Driver assignment logic MUST remain in the app backend; n8n only sends the WhatsApp notification when the app emits a `driver-assigned` event.
- **FR-016**: WhatsApp message failures MUST be retried up to 3 times; if all retries fail, the system logs the failure and falls back to in-app notification via chat widget.
- **FR-017**: If the customer's phone number is missing or invalid, n8n MUST skip WhatsApp and log the error without blocking the booking flow.

### Key Entities

- **Conversation**: Chat session with status tracking, flagged conversations, and confidence metadata.
- **Message**: Individual message with sender type (user, ai, agent, system), content, and type.
- **Support Agent**: Human agent with availability status and current load.
- **n8n Workflow**: Single unified external workflow processor that handles AI response generation, payment notification, driver assignment notification, and delivery completion notification.
- **WhatsApp Notification**: Outbound WhatsApp message sent via Twilio API with status tracking (sent, delivered, failed, retrying).
- **Payment Event**: Stripe `checkout.session.completed` webhook payload that triggers the payment notification flow.
- **Driver Assignment Event**: App-emitted event when a driver is assigned to a booking; consumed by n8n to trigger the driver WhatsApp notification.
- **Delivery Completion Event**: App-emitted event when a delivery is completed; consumed by n8n to trigger the delivery completion WhatsApp notification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All chat API hardcoded strings are replaced by i18n keys — zero remaining hardcoded user-facing strings in chat routes.
- **SC-002**: n8n responses are used for AI replies in 100% of cases when n8n is available and returns a successful response.
- **SC-003**: Chat widget displays correctly in both EN and ES with no missing translations.
- **SC-004**: Blocked topic and fraud detection responses display in the correct language matching the user's selected locale.
- **SC-005**: When n8n is unavailable, a localized fallback message is shown and the message is queued for retry — no hardcoded text.
- **SC-006**: Mock AI generator is fully removed after n8n integration is verified.
- **SC-007**: A single unified n8n workflow handles AI chat, payment notification, driver notification, and delivery notification — no orphaned secondary workflows.
- **SC-008**: WhatsApp messages are sent via Twilio for all three milestones (payment, driver-assigned, delivery-completed) within 30 seconds of the triggering event.
- **SC-009**: WhatsApp delivery failures are retried up to 3 times with logging; fallback to in-app notification on permanent failure.
- **SC-010**: Stripe `checkout.session.completed` webhook is correctly received by n8n and triggers the payment WhatsApp notification sequence.
- **SC-011**: Driver assignment remains entirely in-app; n8n only sends notifications when the app emits the `driver-assigned` event.

## Assumptions

- The n8n instance at `https://agent-ia.innotechlabssas.lat` is deployed and ready to handle `ai-chat-message` webhooks.
- The n8n MCP server is configured for workflow management.
- Turso/libSQL database is available for testing and production.
- The existing i18n system (React Context with locale files) will remain the standard for all text.
- The existing locale files (`en.ts`, `es.ts`) will be extended with any new translation keys.
- No breaking changes to the chat API contract are required.
- A single unified n8n workflow will handle all automation (AI chat, WhatsApp notifications, payment/driver/delivery events) — not multiple fragmented workflows.
- Twilio account is configured with WhatsApp Business API sandbox or production number.
- Stripe webhook can be configured to forward `checkout.session.completed` events to the n8n endpoint.
- The app backend will emit `driver-assigned` and `delivery-completed` events to the n8n webhook endpoint.
- Customer phone numbers are available in the booking/order data when Stripe payment confirms.
- WhatsApp message content (templates) will be in the customer's preferred language matching their locale selection.
