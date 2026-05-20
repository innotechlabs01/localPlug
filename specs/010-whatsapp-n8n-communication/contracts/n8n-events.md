# n8n Events Contract

**Endpoint**: `POST /api/webhooks/n8n`
**Purpose**: Receive events from n8n workflows (payment confirmation, AI responses, escalation, WhatsApp sent)

## Authentication

Header: `Authorization: Bearer <N8N_API_KEY>`

## Request Format

All events follow this structure:

```json
{
  "event": "string",
  "data": { },
  "timestamp": "ISO 8601"
}
```

## Event Types

### payment-confirmed

n8n has processed payment confirmation and sent WhatsApp welcome message.

```json
{
  "event": "payment-confirmed",
  "data": {
    "bookingReference": "abc-123",
    "customerEmail": "juan@test.com",
    "customerName": "Juan Pérez"
  },
  "timestamp": "2026-05-19T10:00:00.000Z"
}
```

**Processing Logic**: Create conversation in `conversations` table if not exists.

### whatsapp-sent

WhatsApp message sent successfully via Evolution API.

```json
{
  "event": "whatsapp-sent",
  "data": {
    "conversationId": 123,
    "whatsappMessageId": "ABCDEF123456",
    "status": "sent"
  },
  "timestamp": "2026-05-19T10:00:01.000Z"
}
```

**Processing Logic**: Store WhatsApp event in `whatsapp_events` table.

### whatsapp-escalation

AI detected escalation keywords and escalated the conversation.

```json
{
  "event": "whatsapp-escalation",
  "data": {
    "conversationId": 123,
    "reason": "User requested human agent",
    "phone": "573001234567"
  },
  "timestamp": "2026-05-19T10:00:05.000Z"
}
```

**Processing Logic**:
1. Update conversation status to `escalated`
2. Store escalation message in `messages` table

### whatsapp-ai-response

AI generated a response to an incoming WhatsApp message.

```json
{
  "event": "whatsapp-ai-response",
  "data": {
    "conversationId": 123,
    "message": "Tu reserva está confirmada...",
    "confidence": 0.95
  },
  "timestamp": "2026-05-19T10:00:03.000Z"
}
```

**Processing Logic**:
1. Store AI response in `messages` table
2. Update `ai_confidence` on conversation
3. If confidence < 0.5 → auto-escalate

### ai-chat-response

AI response for web chat widget (existing, unchanged).

```json
{
  "event": "ai-chat-response",
  "data": {
    "conversationId": 456,
    "message": "How can I help you?",
    "confidence": 0.92
  },
  "timestamp": "2026-05-19T10:00:02.000Z"
}
```

**Processing Logic**: Store AI response in `messages` table (existing behavior).

### driver-assigned

Driver assigned to user (existing, unchanged).

```json
{
  "event": "driver-assigned",
  "data": {
    "bookingReference": "abc-123",
    "whatsappMessageId": "XYZ789",
    "whatsappStatus": "sent"
  },
  "timestamp": "2026-05-19T10:00:10.000Z"
}
```

**Processing Logic**: Store WhatsApp event in `whatsapp_events` table.

### delivery-completed

Delivery completed (existing, unchanged).

```json
{
  "event": "delivery-completed",
  "data": {
    "bookingReference": "abc-123",
    "whatsappMessageId": "DEF456",
    "whatsappStatus": "sent"
  },
  "timestamp": "2026-05-19T10:00:15.000Z"
}
```

**Processing Logic**: Store WhatsApp event in `whatsapp_events` table.

### escalation-complete

n8n completed escalation processing (existing, unchanged).

```json
{
  "event": "escalation-complete",
  "data": {
    "conversationId": 123,
    "assignedAgentId": 1
  },
  "timestamp": "2026-05-19T10:00:20.000Z"
}
```

**Processing Logic**: Update conversation status to `human_active` with assigned agent.

### fraud-alert

n8n flagged conversation for fraud (existing, unchanged).

```json
{
  "event": "fraud-alert",
  "data": {
    "conversationId": 123,
    "reason": "Suspicious pattern detected"
  },
  "timestamp": "2026-05-19T10:00:25.000Z"
}
```

**Processing Logic**: Flag conversation with `flagged=1` and `flag_reason`.

## Response Format

```json
{
  "success": true,
  "processed": "event-name"
}
```

## Error Response

```json
{
  "error": "Webhook processing failed"
}
```

Status: 500
