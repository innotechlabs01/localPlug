# CHAT DOMAIN

> Real-time messaging, conversation management, and customer support.

## Responsibility
- Owns: conversations, messages, chat widgets, conversation ratings
- Does NOT own: AI responses (AI), notifications (Communication)

## Boundaries
- Inbound: Customer app, Admin, Hotel Portal, WhatsApp
- Outbound: AI (response generation), Ratings (feedback), Cases (escalation)

## Status
- Maturity: 22%
- Extraction: Not started (12 API routes with business logic)
- Portal: None

## Domain Model
- **Entities**: Conversation, Message, ConversationRating, ChatWidget
- **Value Objects**: ConversationStatus, MessageType, SenderType, Rating
- **Aggregates**: Conversation (root: Conversation, invariants: status transitions)
- **Events**: conversation.created, message.sent, conversation.ended, rating.submitted
- **Policies**: Auto-response rules, escalation rules, rating triggers

## Key Files
- `lib/chat-service.ts` — Chat service (needs extraction)
- `lib/agent-service.ts` — AI agent (needs extraction)
- `app/api/chat/` — 12 API routes (needs thin orchestrators)
- `packages/db/src/domains/chat/` — 5 tables

## Extraction Plan
1. Extract chat logic from lib/ to domain package
2. Separate AI responses into AI domain
3. Create Chat Portal (standalone)
