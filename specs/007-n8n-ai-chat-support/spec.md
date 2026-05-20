# Feature Specification: n8n Integration + AI Chat Support

**Feature Branch**: `007-n8n-ai-chat-support`

**Created**: 2026-05-16

**Status**: Draft

**Input**: User description: "Create post-payment confirmation flow via n8n, 24/7 AI support chat with human escalation, fraud detection, casual but secure tone"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Post-Payment Confirmation Message (Priority: P1)

As a customer who just completed payment, I receive an automated message confirming my booking data and letting me know the team is reviewing my reservation. I can reply with questions and receive a response.

**Why this priority**: This is the core automation — connecting payment completion to user communication via n8n.

**Independent Test**: Complete a booking payment → receive confirmation message within 60 seconds → reply to message → receive AI response.

**Acceptance Scenarios**:

1. **Given** the user completes payment, **When** the Stripe webhook fires, **Then** n8n triggers a confirmation message to the user within 60 seconds.
2. **Given** the confirmation message is sent, **When** the user replies, **Then** the AI responds in a casual, friendly tone without revealing it is AI.
3. **Given** the user asks about personal data or sensitive company info, **When** the AI processes the message, **Then** the AI blocks the request and politely declines.

---

### User Story 2 — 24/7 AI Support Chat (Priority: P1)

As a customer with questions or issues, I can access a 24/7 support chat widget on the website. The AI handles my query in a casual, human-like tone and can escalate to a human when needed.

**Why this priority**: This is the primary support channel — replaces WhatsApp promises with actual real-time support.

**Independent Test**: Open support chat → ask a question → receive AI response → request human agent → get connected to available agent.

**Acceptance Scenarios**:

1. **Given** the user opens the support chat, **When** they type a message, **Then** the AI responds within 10 seconds in a casual, friendly tone.
2. **Given** the user requests a human agent, **When** the AI detects the intent, **Then** it checks for available agents and connects them or queues the request.
3. **Given** the user asks for lost items, location help, or city information, **When** the AI processes the message, **Then** it blocks the request and explains it cannot help with those topics.
4. **Given** the AI detects potential fraud or harmful intent, **When** the message is processed, **Then** it flags the conversation and alerts the admin.

---

### User Story 3 — Human Agent Escalation & Chat Management (Priority: P2)

As a support agent, I can see queued conversations, accept them, respond to customers, and close chats. The system tracks agent availability and assigns conversations fairly.

**Why this priority**: Human escalation is essential for complex issues the AI cannot resolve.

**Independent Test**: AI escalates conversation → agent sees it in queue → agent accepts → agent responds → agent closes chat → conversation returns to AI queue.

**Acceptance Scenarios**:

1. **Given** a conversation is escalated, **When** an agent is available, **Then** the agent sees the conversation in their queue and can accept it.
2. **Given** an agent accepts a conversation, **When** they respond, **Then** their messages are sent to the customer and labeled as from a human agent.
3. **Given** an agent closes a chat, **When** the conversation is closed, **Then** the conversation returns to AI management for any future messages.

---

### User Story 4 — Fraud Detection & Security (Priority: P2)

As the system, I must detect potential fraud patterns, block harmful requests, and protect sensitive information. The AI must never reveal personal data, company internals, or help with location/lost item issues.

**Why this priority**: Security and data protection are non-negotiable.

**Independent Test**: Send suspicious message → AI flags it → admin receives alert → conversation is marked for review.

**Acceptance Scenarios**:

1. **Given** a user sends a message with suspicious patterns (phishing, social engineering), **When** the AI processes it, **Then** it flags the conversation and alerts admin.
2. **Given** a user asks for employee personal data, **When** the AI processes it, **Then** it blocks the request.
3. **Given** a user asks for help with lost items or location issues, **When** the AI processes it, **Then** it politely declines and explains scope limitations.

---

### Edge Cases

- What happens when n8n is unavailable? The app queues the message and retries.
- What happens when no human agents are available? The AI continues handling and queues the escalation request.
- What happens when a user sends messages in rapid succession? The system batches them and responds once.
- What happens when the AI confidence is low? It escalates to human automatically.
- What happens when a conversation is inactive for 30 minutes? The system sends a follow-up message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send a confirmation message to the user within 60 seconds of payment completion via n8n webhook.
- **FR-002**: System MUST provide a 24/7 support chat widget accessible from all pages.
- **FR-003**: AI MUST respond in a casual, friendly, human-like tone without revealing it is AI.
- **FR-004**: AI MUST block requests for personal data, company sensitive information, lost items, location help, and city information.
- **FR-005**: AI MUST detect potential fraud patterns and flag conversations for admin review.
- **FR-006**: System MUST allow AI to escalate to human agents when requested or when confidence is low.
- **FR-007**: System MUST track human agent availability and assign conversations fairly.
- **FR-008**: Human agents MUST be able to accept, respond to, and close conversations.
- **FR-009**: System MUST store all conversation history (messages, timestamps, sender type).
- **FR-010**: System MUST integrate with n8n for workflow orchestration (payment confirmation, AI processing, escalation).
- **FR-011**: System MUST queue messages when n8n is unavailable and retry automatically.
- **FR-012**: Admin dashboard MUST display active conversations, agent status, and flagged conversations.

### Key Entities

- **Conversation**: A chat session between a user and the system (AI or human). Has status (ai_active, escalated, human_active, closed), assigned agent, and message history.
- **Message**: Individual message in a conversation. Has sender (user, ai, agent), content, timestamp, and type (text, system, escalation).
- **Support Agent**: A human support team member. Has name, email, status (available, busy, offline), and current conversation count.
- **n8n Webhook**: Endpoint that receives events from the app (payment confirmed, conversation escalated) and triggers n8n workflows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Payment confirmation messages are sent within 60 seconds of payment completion.
- **SC-002**: AI responds to 90% of user messages within 10 seconds.
- **SC-003**: AI successfully blocks 100% of requests for sensitive information.
- **SC-004**: Human escalation is available 24/7 with average response time under 5 minutes during business hours.
- **SC-005**: Zero sensitive data leaks through the chat system.
- **SC-006**: Fraud detection flags 100% of suspicious patterns.

## Assumptions

- n8n is deployed and accessible at `https://agent-ia.innotechlabssas.lat/`
- The n8n MCP server is configured for workflow management
- Turso/LibSQL database is available for storing conversations and messages
- The AI backend (via n8n) handles natural language processing and response generation
- Human agents will be added to the system manually via admin interface
- WebSocket or Server-Sent Events will be used for real-time chat updates
- The existing Stripe webhook infrastructure will be extended to trigger n8n workflows
