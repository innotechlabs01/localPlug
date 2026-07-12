# CHAT DOMAIN

> Real-time messaging, conversation management, and customer support.

## Responsibility
- Owns: conversations, messages, chat widgets, conversation ratings, presence, unread counts
- Does NOT own: AI responses (AI), notifications (Communication), ratings (Ratings), cases (Cases)

## Boundaries
- Inbound: Customer app, Admin, Hotel Portal, WhatsApp (via Communication)
- Outbound: AI (response generation), Ratings (feedback), Cases (escalation), Notifications (status)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 22%
- Extraction: Not started

## Domain Model
- Entities: Conversation, Message, Participant, Attachment, ChatWidget, Presence, UnreadCount
- Value Objects: ConversationStatus, MessageType, SenderType, Channel, PresenceStatus
- Aggregates: Conversation (root, invariants: status transitions, participant limits)
- Events: conversation.created, message.sent, conversation.ended, conversation.escalated
- Policies: AutoResponsePolicy, EscalationPolicy, RetentionPolicy, RateLimitPolicy
