# Feature Specification: WhatsApp n8n Communication

**Feature Branch**: `010-whatsapp-n8n-communication`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "crea el baseline del cambio que se tiene que hacer para crear la comunicacion de n8n y todo lo de whastapp"

**References**: `specs/009-whatsapp-evolution-api/SETUP-GUIDE.md`, `specs/009-whatsapp-evolution-api/QUICK-REFERENCE.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Post-Payment WhatsApp Confirmation (Priority: P1)

A user completes a booking and payment on the website. Immediately after payment confirmation, the system sends a WhatsApp message to the user's phone number confirming their reservation details (booking reference, package, flight, arrival date). The message is sent in the user's detected language (Spanish or English).

**Why this priority**: This is the core trigger that initiates the entire WhatsApp communication channel. Without this, the user has no way to receive post-booking communication via WhatsApp, which is the primary support channel for the service.

**Independent Test**: Complete a test booking with Stripe payment → verify WhatsApp message is received within 30 seconds → verify message contains correct booking details → verify language matches user's booking language.

**Acceptance Scenarios**:

1. **Given** a user has completed payment with a valid phone number, **When** the Stripe payment webhook is processed, **Then** a WhatsApp welcome message is sent to the user within 30 seconds containing booking reference, package name, flight number, and arrival date.
2. **Given** a user completes payment but the phone number is missing or invalid, **When** the system attempts to send WhatsApp, **Then** the system logs the failure and does not crash; the booking remains confirmed in the database.
3. **Given** the WhatsApp message is sent successfully, **When** the user opens WhatsApp, **Then** the message appears in a conversation thread with the business account.

---

### User Story 2 - Automated AI Responses via WhatsApp (Priority: P1)

When a user sends a message to the business WhatsApp number, the system automatically processes the message using an AI agent, generates a contextual response, and sends it back to the user via WhatsApp. The AI responds in the same language the user writes in.

**Why this priority**: This is the second half of the bidirectional communication loop. Users expect immediate responses when they message the business, and the AI handles routine inquiries without human intervention.

**Independent Test**: Send a WhatsApp message to the business number → verify AI response is received within 5 seconds → verify response is in the correct language → verify response is contextually relevant to the booking.

**Acceptance Scenarios**:

1. **Given** a user sends a text message via WhatsApp, **When** the message is received by the system, **Then** an AI-generated response is sent back within 5 seconds in the same language as the incoming message.
2. **Given** a user asks about their booking details, **When** the AI processes the message, **Then** the response includes relevant booking information (package, flight, arrival) pulled from the database.
3. **Given** a user sends a non-text message (image, video, document), **When** the system receives it, **Then** the system acknowledges receipt but does not attempt to process non-text content with the AI.
4. **Given** the AI confidence in a response is below 50%, **When** the response is generated, **Then** the conversation is automatically escalated to human support status.

---

### User Story 3 - Human Agent Takeover (Priority: P2)

An administrator viewing the IA Chat Center can take manual control of a WhatsApp conversation at any time. When the admin clicks "Take Over," the AI stops responding to that conversation and the admin can send messages directly. The admin can release the conversation back to AI control at any time.

**Why this priority**: This ensures that complex issues, complaints, or sensitive situations can be handled by a human agent without the AI interfering. It provides a safety net for the automated system.

**Independent Test**: Open admin panel → select a WhatsApp conversation → click "Take Over" → verify AI stops responding → send a manual message → verify user receives it → click "AI Mode" → verify AI resumes.

**Acceptance Scenarios**:

1. **Given** an admin is viewing a WhatsApp conversation in AI-active mode, **When** the admin clicks "Take Over," **Then** the conversation status changes to "human_active" and the AI stops processing incoming messages for that conversation.
2. **Given** an admin has taken over a conversation, **When** the admin types and sends a message, **Then** the message is sent to the user via WhatsApp and appears in the conversation thread.
3. **Given** an admin has taken over a conversation, **When** the admin clicks "AI Mode," **Then** the conversation status returns to "ai_active" and the AI resumes processing incoming messages.
4. **Given** a conversation is in human-active mode, **When** a new WhatsApp message arrives from the user, **Then** the message is stored in the database but no AI response is generated.

---

### User Story 4 - Automatic Escalation Detection (Priority: P2)

The AI agent automatically detects when a user wants to speak with a human (based on keywords like "hablar con alguien", "queja", "problema", "refund", "cancel") and escalates the conversation to human support. The user receives a notification that an agent will contact them.

**Why this priority**: This ensures users who need human help are routed appropriately without requiring the admin to manually monitor every conversation.

**Independent Test**: Send a WhatsApp message containing "quiero hablar con alguien" → verify conversation status changes to "escalated" → verify user receives escalation confirmation message → verify conversation appears in admin escalated filter.

**Acceptance Scenarios**:

1. **Given** a user sends a message containing escalation keywords, **When** the AI processes the message, **Then** the conversation status is updated to "escalated" and the user receives a message confirming an agent will contact them.
2. **Given** a conversation is in escalated status, **When** new messages arrive from the user, **Then** no AI response is generated and the admin is notified.
3. **Given** a conversation is escalated, **When** the admin views it in the IA Chat Center, **Then** it appears with an "Escalated" badge and the escalation reason is visible.

---

### User Story 5 - Admin Dashboard Visibility (Priority: P2)

All WhatsApp conversations are visible in the admin IA Chat Center with clear channel indicators (WhatsApp vs Web). The admin can filter conversations by channel, see the full message history including AI responses, and identify which conversations are from WhatsApp vs the web chat widget.

**Why this priority**: The admin needs visibility into all communication channels to provide consistent support and monitor AI performance.

**Independent Test**: Open admin IA Chat Center → verify WhatsApp conversations show with a WhatsApp badge → filter by WhatsApp channel → verify only WhatsApp conversations appear → view message history → verify AI and user messages are distinguishable.

**Acceptance Scenarios**:

1. **Given** WhatsApp conversations exist in the system, **When** the admin opens the IA Chat Center, **Then** each WhatsApp conversation displays a green "WhatsApp" badge in the conversation list.
2. **Given** the admin wants to view only WhatsApp conversations, **When** they select the "WhatsApp" channel filter, **Then** only WhatsApp conversations are displayed.
3. **Given** a WhatsApp conversation is selected, **When** the admin views the message thread, **Then** each message shows its source (user via WhatsApp, AI response, system message) with appropriate labels.
4. **Given** a WhatsApp message includes metadata about its source, **When** displayed in the admin panel, **Then** a small "WA" indicator appears next to messages that originated from WhatsApp.

---

### User Story 6 - WhatsApp Delivery Status Tracking (Priority: P3)

The system tracks the delivery status of all WhatsApp messages (sent, delivered, read) and stores this information in the database. The admin can see delivery indicators for messages sent through the system.

**Why this priority**: Delivery confirmation provides assurance that messages reach users and helps diagnose communication issues.

**Independent Test**: Send a WhatsApp message → verify delivery status is tracked in database → verify admin can see delivery status in conversation view.

**Acceptance Scenarios**:

1. **Given** a WhatsApp message is sent, **When** the delivery receipt is received from WhatsApp, **Then** the message status is updated in the database.
2. **Given** a WhatsApp message is read by the user, **When** the read receipt is received, **Then** the message status is updated to "read" in the database.

---

### Edge Cases

- What happens when the WhatsApp instance disconnects during a conversation? The system logs the disconnection event and queues any outgoing messages for retry when reconnected.
- What happens when a user sends a message to a closed conversation? The system creates a new conversation thread automatically.
- What happens when the AI service is unavailable? The system sends a fallback message indicating a team member will respond shortly.
- What happens when two admins try to take over the same conversation simultaneously? The system uses the last-write-wins approach; the second admin's takeover overrides the first.
- What happens when a user messages from a different phone number than their booking? A new conversation is created and the user is asked to verify their booking reference.
- What happens when the Evolution API rate limit is hit? Messages are queued and sent with a delay; the system logs the rate limit event.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send a WhatsApp confirmation message to the user within 30 seconds of successful Stripe payment completion.
- **FR-001a**: System MUST validate and normalize phone numbers to E.164 format (e.g., +573001234567) before attempting WhatsApp delivery.
- **FR-002**: System MUST include booking reference, package name, flight number, and arrival date in the confirmation message.
- **FR-003**: System MUST detect the user's language from their booking data and send the message in that language.
- **FR-004**: System MUST process incoming WhatsApp messages and generate AI responses within 5 seconds.
- **FR-005**: System MUST respond in the same language the user writes in (auto-detection).
- **FR-006**: System MUST detect escalation keywords and automatically change conversation status to "escalated."
- **FR-007**: System MUST allow administrators to take manual control of WhatsApp conversations ("Take Over").
- **FR-008**: System MUST allow administrators to release conversations back to AI control ("AI Mode").
- **FR-009**: System MUST display all WhatsApp conversations in the admin IA Chat Center with channel indicators.
- **FR-010**: System MUST support filtering conversations by channel (WhatsApp, Web, All).
- **FR-011**: System MUST store all WhatsApp messages (incoming and outgoing) in the database with full history.
- **FR-012**: System MUST track WhatsApp message delivery status (sent, delivered, read).
- **FR-013**: System MUST persist WhatsApp events for auditing and debugging purposes.
- **FR-014**: System MUST handle WhatsApp instance disconnections gracefully without data loss.
- **FR-015**: System MUST support configurable anti-baneo settings (rate limiting, message delays).
- **FR-016**: System MUST NOT send AI responses when a conversation is in "human_active" status.
- **FR-017**: System MUST automatically create a new conversation when an unrecognized phone number messages the business.
- **FR-018**: System MUST provide a fallback message when the AI service is unavailable.
- **FR-019**: System MUST authenticate all webhook communication between services using Header Auth (Bearer token) with API keys stored in environment variables.
- **FR-020**: System MUST auto-delete WhatsApp events older than 30 days while preserving summary records for audit purposes.

### Key Entities

- **Conversation**: Represents a communication thread between the business and a user. Key attributes: channel (whatsapp/web/n8n), status (ai_active/escalated/human_active/closed), booking reference, WhatsApp instance name, assigned agent.
- **Message**: An individual message within a conversation. Key attributes: sender type (user/ai/agent/system), content, message type (text/system/escalation), metadata (source, confidence, delivery status).
- **WhatsApp Event**: A tracked event from the WhatsApp integration. Key attributes: event type (message.upsert, message-receipt.update, instance.status), instance name, remote JID (phone), message ID, delivery status, raw payload. Retention: 30 days for raw payloads, summary records preserved indefinitely.
- **Payment Record**: User's payment information including the customer phone number used for WhatsApp communication.

## Infrastructure & Integration *(from 009-whatsapp-evolution-api)*

### Deployment Architecture

| Component | Location | Domain |
|-----------|----------|--------|
| Next.js App | Vercel | `localplug.vercel.app` |
| Evolution API | EasyPanel (Docker) | `api-message.innotechlabssas.lat` |
| n8n Workflows | Self-hosted | `agent-ia.innotechlabssas.lat` |
| PostgreSQL | EasyPanel (managed) | Internal to EasyPanel project |
| Redis | EasyPanel (managed) | Internal to EasyPanel project |
| Database | Turso (libSQL) | `localplug-innotechlabssas.aws-ap-northeast-1.turso.io` |

### n8n Workflow Structure

**Workflow 1: Payment → WhatsApp Welcome**
```
Webhook (POST /webhook/payment-confirmed)
  → Header Auth: Bearer N8N_API_KEY
  → Code: Format Welcome Message (auto-detect language)
  → Evolution API: Send Text (instance: localplug-main)
  → HTTP Request: Callback to App (event: whatsapp-sent)
```

**Workflow 2: WhatsApp → AI Agent → Response**
```
Webhook (POST /webhook/evolution-events)
  → IF: event == "messages.upsert"
  → IF: data.key.fromMe == false
  → Code: Extract Message Data
  → OpenAI GPT-4o: Generate Response
  → IF: Needs Escalation?
      TRUE → Notify App (whatsapp-escalation) + Send escalation message
      FALSE → Format AI Response + Evolution API Send Text + Save to App DB
```

**Workflow 3: Status Tracking**
```
Webhook (POST /webhook/evolution-events)
  → Switch: Route by Event Type
      message-receipt.update → Log delivery status
      instance.status → Log instance health
      connection.update → Alert if disconnected
```

### Evolution API Configuration

- **Instance Name**: `localplug-main`
- **Emission**: Baileys (multi-device, free)
- **Anti-Baneo Settings**:
  - `reject_call: true`
  - `groups_ignore: true`
  - `always_online: true`
  - `read_messages: true`
  - `read_status: true`
  - `sync_full_history: false`
- **Rate Limits**: Max 50 messages/hour initially, ramp up over 2-3 weeks
- **Message Delay**: Random 3-8 seconds between messages

### OpenAI Agent Configuration

- **Model**: GPT-4o
- **Temperature**: 0.7
- **Max Tokens**: 500
- **System Prompt**: Medellín Premium assistant (bilingual, booking-aware, escalation-ready)
- **Escalation Detection**: Keywords "hablar con alguien", "queja", "problema", "refund", "cancel"

### Environment Variables Required

| Variable | Source | Purpose |
|----------|--------|---------|
| `EVOLUTION_API_URL` | EasyPanel | Evolution API server URL |
| `EVOLUTION_API_KEY` | EasyPanel | Evolution API authentication |
| `EVOLUTION_INSTANCE_NAME` | EasyPanel | WhatsApp instance identifier |
| `N8N_BASE_URL` | Self-hosted | n8n server URL |
| `N8N_API_KEY` | n8n Settings | n8n API authentication |
| `OPENAI_API_KEY` | OpenAI Dashboard | AI model authentication |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive WhatsApp confirmation within 30 seconds of payment completion in 95% of cases.
- **SC-002**: AI responses to incoming WhatsApp messages are delivered within 5 seconds in 90% of cases.
- **SC-003**: AI correctly detects and escalates conversations containing escalation keywords in 95% of cases.
- **SC-004**: Admins can take over any WhatsApp conversation within 2 seconds of clicking the button.
- **SC-005**: All WhatsApp conversations are visible in the admin dashboard with zero data loss.
- **SC-006**: System handles 100 concurrent WhatsApp conversations without degradation.
- **SC-007**: Language auto-detection correctly identifies Spanish vs English in 90% of cases based on booking data.
- **SC-008**: WhatsApp instance reconnection after disconnection completes within 60 seconds.

## Clarifications

### Session 2026-05-19

- Q: What phone number format does the system expect from users? → A: E.164 format (+573001234567) - user enters with country code, system validates and normalizes before WhatsApp delivery.
- Q: How should webhook communication between Evolution API, n8n, and the app be authenticated? → A: Header Auth (Bearer token) - API keys sent as Authorization headers on every webhook call.
- Q: How long should WhatsApp events be retained before cleanup? → A: 30 days - Auto-delete events older than 30 days, keep summary records.

## Assumptions

- Users have provided a valid phone number in E.164 format (e.g., +573001234567) during the booking process or it is available from the payment metadata. The system normalizes and validates phone numbers before WhatsApp delivery.
- The Evolution API WhatsApp instance is properly configured and connected (QR code scanned).
- The n8n workflow automation server is running and accessible.
- OpenAI API key is configured and has sufficient quota for AI responses.
- The WhatsApp Business account has been verified and approved by Meta for utility message templates.
- Users have WhatsApp installed on their mobile devices.
- The admin IA Chat Center is accessible to authorized administrators.
- Cloudflare DNS is properly configured for the Evolution API domain (api-message.innotechlabssas.lat).
- The Turso database has the required tables (conversations, messages, whatsapp_events) created via migrations.
- Anti-baneo rules are followed: gradual ramp-up of message volume, natural conversation patterns, respect for user opt-out requests.
