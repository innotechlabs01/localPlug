# NOTIFICATION_PROVIDERS (Channel Adapters)

> Each provider is a thin adapter. It implements `NotificationProvider` and nothing else.
> No business logic. No routing. No templates. Just send.

---

## Contract

```typescript
interface NotificationProvider {
  readonly id: string
  readonly channel: NotificationChannel

  send(message: RenderedMessage): Promise<DeliveryResult>
  validate(recipient: string): boolean
  getHealth(): ProviderHealth
}

interface DeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  retryable: boolean
  timestamp: Date
}

interface ProviderHealth {
  healthy: boolean
  latencyMs: number
  lastError?: string
  circuitOpen: boolean
}
```

---

## Providers

### WhatsApp (Evolution API)

```
providers/whatsapp/
├── evolution-provider.ts     ← Main adapter
├── rate-limiter.ts           ← Per-hour rate limiting
├── message-builder.ts        ← WhatsApp-specific formatting
└── instance-manager.ts       ← Instance connection management
```

- Uses Evolution API for message delivery
- Rate limit: 50 messages/hour (configurable)
- Supports: text, media (images, documents), location, contacts
- Language detection from recipient name (Spanish heuristic)

### Email

```
providers/email/
├── smtp-provider.ts          ← SMTP adapter
├── ses-provider.ts           ← AWS SES adapter (future)
└── templates/                ← Email-specific HTML templates
```

- Uses configured SMTP server
- Supports: HTML + plain text
- Attachment support
- CC/BCC support (future)

### Push (Firebase)

```
providers/push/
├── firebase-provider.ts      ← Firebase Cloud Messaging
├── apns-provider.ts          ← Apple Push Notification Service (future)
└── token-manager.ts          ← Device token management
```

- Uses Firebase Cloud Messaging
- Supports: title, body, data payload, image
- Platform-specific: Android + iOS
- Token refresh handling

### SMS

```
providers/sms/
├── twilio-provider.ts        ← Twilio adapter
└── message-builder.ts        ← SMS-specific formatting
```

- Uses Twilio (configurable)
- Character limit: 160 (GSM) / 70 (Unicode)
- Fallback: if WhatsApp fails, try SMS

### WebSocket

```
providers/websocket/
├── socketio-provider.ts      ← Socket.IO adapter
└── room-manager.ts           ← Room/channel management
```

- Uses existing Socket.IO infrastructure
- Supports: real-time push to connected clients
- Room-based broadcasting
- Fallback: if offline, queue for next connection

### In-App

```
providers/inapp/
├── database-provider.ts      ← Database-backed notifications
├── notification-store.ts     ← CRUD operations
└── real-time-pusher.ts       ← Push via WebSocket when connected
```

- Stores in `notifications` table (B4 schema)
- Shows in notification center UI
- Mark as read/unread
- Badge count

---

## Provider Selection

Providers are selected by the **Router** based on:
1. User preferences (which channels they accept)
2. Business rules (which channels are appropriate)
3. Provider health (circuit breaker status)
4. Rate limits (current usage vs capacity)

The domain never selects providers. The domain only publishes events.

---

## Provider Health

Each provider exposes health status:

```typescript
interface ProviderHealth {
  healthy: boolean          // Overall health
  latencyMs: number         // Average response time
  lastError?: string        // Last error message
  circuitOpen: boolean      // Circuit breaker status
}
```

If a provider is unhealthy:
1. Circuit breaker opens after N failures
2. Messages are queued (outbox pattern)
3. Circuit breaker closes after successful requests
4. Queued messages are retried

---

## Migration from lib/n8n/client.ts

The current 575-line god module maps to:

| Current Function | Target Provider |
|------------------|-----------------|
| `sendOrQueueWhatsApp()` | `providers/whatsapp/evolution-provider.ts` |
| `triggerPaymentConfirmation()` | Handler + template + provider |
| `triggerDriverAssigned()` | Handler + template + provider |
| `triggerDeliveryCompleted()` | Handler + template + provider |
| `triggerAiChatMessage()` | Handler + template + provider |
| `sendN8nWebhook()` | `providers/webhook/n8n-provider.ts` |
| `checkWhatsAppRateLimit()` | `providers/whatsapp/rate-limiter.ts` |
| `trackWhatsAppSend()` | `providers/whatsapp/rate-limiter.ts` |
