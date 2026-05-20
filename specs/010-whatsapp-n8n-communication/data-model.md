# Data Model: WhatsApp n8n Communication

**Date**: 2026-05-19 | **Feature**: 010-whatsapp-n8n-communication

## Entities

### Conversation (existing, extended)

Represents a communication thread between the business and a user.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | INTEGER PK | AUTOINCREMENT | Unique identifier |
| `user_identifier` | TEXT NOT NULL | | Phone number (E.164) or email |
| `user_name` | TEXT | | User's display name |
| `user_email` | TEXT | | User's email (optional) |
| `status` | TEXT NOT NULL | `'ai_active'` | `ai_active`, `escalated`, `human_active`, `closed` |
| `assigned_agent_id` | INTEGER | | FK → support_agents.id |
| `assigned_at` | TEXT | | When agent was assigned |
| `order_id` | INTEGER | | FK → orders.id (optional) |
| `booking_reference` | TEXT | | Links to booking/payment |
| `channel` | TEXT NOT NULL | `'web'` | `web`, `whatsapp`, `n8n` |
| `priority` | TEXT NOT NULL | `'normal'` | `low`, `normal`, `high`, `urgent` |
| `flagged` | INTEGER NOT NULL | `0` | 0 or 1, fraud flag |
| `flag_reason` | TEXT | | Reason for flagging |
| `ai_confidence` | REAL | | 0.0 to 1.0, AI confidence |
| `last_message_at` | TEXT | | Timestamp of last message |
| `whatsapp_instance` | TEXT | | Evolution API instance name (e.g., `localplug-main`) |
| `whatsapp_message_id` | TEXT | | WhatsApp message ID for tracking |
| `created_at` | TEXT NOT NULL | `datetime('now')` | Creation timestamp |
| `updated_at` | TEXT NOT NULL | `datetime('now')` | Last update timestamp |

**State Transitions**:
```
ai_active → escalated (when AI detects escalation keywords)
ai_active → human_active (when admin clicks "Take Over")
escalated → human_active (when admin takes over)
human_active → ai_active (when admin clicks "AI Mode")
any → closed (when admin closes conversation)
```

### Message (existing)

An individual message within a conversation.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | INTEGER PK | AUTOINCREMENT | Unique identifier |
| `conversation_id` | INTEGER NOT NULL | | FK → conversations.id CASCADE |
| `sender_type` | TEXT NOT NULL | | `user`, `ai`, `agent`, `system` |
| `sender_id` | TEXT | | Agent ID or user identifier |
| `content` | TEXT NOT NULL | | Message content |
| `message_type` | TEXT NOT NULL | `'text'` | `text`, `system`, `escalation`, `image` |
| `metadata` | TEXT | | JSON (source, confidence, delivery status) |
| `created_at` | TEXT NOT NULL | `datetime('now')` | Timestamp |

**Metadata Schema**:
```json
{
  "source": "whatsapp" | "web" | "n8n",
  "messageId": "WhatsApp message ID",
  "confidence": 0.95,
  "deliveryStatus": "sent" | "delivered" | "read"
}
```

### WhatsApp Event (NEW)

Tracks all events from the WhatsApp integration.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | INTEGER PK | AUTOINCREMENT | Unique identifier |
| `conversation_id` | INTEGER | | FK → conversations.id |
| `event_type` | TEXT NOT NULL | | Event type from Evolution API |
| `instance_name` | TEXT NOT NULL | | Evolution API instance name |
| `remote_jid` | TEXT NOT NULL | | Phone number in JID format |
| `message_id` | TEXT | | WhatsApp message ID |
| `from_me` | INTEGER NOT NULL | `0` | 1 if sent by us, 0 if received |
| `content` | TEXT | | Message text content |
| `message_type` | TEXT | | `conversation`, `image`, `video`, etc. |
| `status` | TEXT | | `delivered`, `read`, `pending`, `played` |
| `participant` | TEXT | | Group participant if applicable |
| `raw_payload` | TEXT | | Full JSON payload from Evolution API |
| `created_at` | TEXT NOT NULL | `datetime('now')` | Timestamp |

**Event Types**:
- `message.upsert` — New message (incoming or outgoing)
- `message-receipt.update` — Delivery status change
- `instance.status` — Instance health status
- `connection.update` — Connection state change

**Retention**: Raw payloads deleted after 30 days; summary records (event_type, status, timestamp) preserved indefinitely.

### Payment Record (existing, extended)

User's payment information including phone number for WhatsApp.

| Column | Type | Description |
|--------|------|-------------|
| `booking_reference` | TEXT PK | Unique booking identifier |
| `package_id` | TEXT | Package identifier |
| `package_name` | TEXT | Human-readable package name |
| `amount` | INTEGER | Amount in cents |
| `currency` | TEXT | Currency code (USD) |
| `status` | TEXT | `pending`, `completed`, `failed`, `refunded` |
| `stripe_payment_intent_id` | TEXT | Stripe payment intent ID |
| `stripe_webhook_event_id` | TEXT | Stripe webhook event ID (dedup) |
| `customer_email` | TEXT | Customer email |
| `customer_name` | TEXT | Customer name |
| `customer_phone` | TEXT | Customer phone in E.164 format |
| `error_message` | TEXT | Error message if failed |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last update timestamp |

## Relationships

```
Payment Record (1) ──── (0..1) Conversation
                              │
                              ├── (0..N) Message
                              │
                              └── (0..N) WhatsApp Event
```

- A Payment Record may have one Conversation (linked by `booking_reference`)
- A Conversation has many Messages
- A Conversation has many WhatsApp Events
- A WhatsApp Event may be linked to a Conversation (by `conversation_id`)
