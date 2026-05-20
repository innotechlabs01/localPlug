# Admin API Contract

**Purpose**: Admin operations for WhatsApp conversation management (Take Over, AI Mode, agent assignment)

## Take Over Conversation

**Endpoint**: `POST /api/chat/escalate`
**Purpose**: Admin takes manual control of a WhatsApp conversation

### Request

```json
{
  "conversationId": 123,
  "reason": "Admin takeover"
}
```

### Response

```json
{
  "success": true,
  "status": "human_active"
}
```

### Behavior

1. Update conversation status to `human_active`
2. Set `assigned_at` to current timestamp
3. AI stops processing incoming messages for this conversation
4. Admin can now send messages via `POST /api/chat/send`

## Release to AI Mode

**Endpoint**: `POST /api/chat/close` (reused with special logic)
**Purpose**: Admin releases conversation back to AI control

### Request

```json
{
  "conversationId": 123,
  "closedBy": "agent"
}
```

### Behavior

1. Reopen conversation with status `ai_active`
2. Remove agent assignment
3. AI resumes processing incoming messages

## Send Message as Agent

**Endpoint**: `POST /api/chat/send`
**Purpose**: Admin sends a message to a WhatsApp conversation

### Request

```json
{
  "conversationId": 123,
  "message": "Thank you for your patience...",
  "userIdentifier": "573001234567",
  "senderType": "agent",
  "agentId": 1
}
```

### Behavior

1. Store message in `messages` table with `sender_type: 'agent'`
2. Send message to user via Evolution API (if channel is WhatsApp)
3. Update `last_message_at` on conversation

## List Conversations

**Endpoint**: `GET /api/chat/conversations`
**Purpose**: List conversations with optional filters

### Query Parameters

- `status` — Filter by status (`ai_active`, `escalated`, `human_active`, `closed`)
- `flagged` — Filter by flagged status (`true`)
- `search` — Search by user name, email, or message content
- `channel` — Filter by channel (`whatsapp`, `web`)

### Response

```json
{
  "success": true,
  "conversations": [
    {
      "id": 123,
      "user_identifier": "573001234567",
      "user_name": "Juan Pérez",
      "user_email": "juan@test.com",
      "status": "ai_active",
      "assigned_agent_id": null,
      "booking_reference": "abc-123",
      "channel": "whatsapp",
      "priority": "normal",
      "flagged": 0,
      "ai_confidence": 0.95,
      "last_message_at": "2026-05-19T10:00:00.000Z",
      "created_at": "2026-05-19T09:55:00.000Z",
      "whatsapp_instance": "localplug-main",
      "agent_name": null,
      "message_count": 15,
      "last_message": "Gracias por tu pregunta..."
    }
  ]
}
```

## Get Messages

**Endpoint**: `GET /api/chat/messages`
**Purpose**: Get messages for a conversation

### Query Parameters

- `conversationId` — Required, conversation ID
- `limit` — Optional, default 50

### Response

```json
{
  "success": true,
  "messages": [
    {
      "id": 456,
      "conversation_id": 123,
      "sender_type": "user",
      "sender_id": "573001234567",
      "content": "Hola, tengo una pregunta",
      "message_type": "text",
      "metadata": "{\"source\":\"whatsapp\",\"messageId\":\"ABC123\"}",
      "created_at": "2026-05-19T10:00:00.000Z",
      "agent_name": null
    }
  ]
}
```
