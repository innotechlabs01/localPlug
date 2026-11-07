# NOTIFICATION_DELIVERY (Delivery State Machine)

> Every notification goes through a delivery lifecycle.
> Every state transition is tracked. Every delay is measurable.

---

## Delivery States

```
                    ┌──────────┐
                    │ PENDING  │  Created, waiting to be processed
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │ QUEUED   │  Enqueued for channel delivery
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │SENDING   │  Provider is processing
                    └────┬─────┘
                         │
                ┌────────┼────────┐
                ▼        ▼        ▼
          ┌─────────┐ ┌────────┐ ┌────────┐
          │SENT     │ │FAILED  │ │RETRYING│
          └────┬────┘ └───┬────┘ └───┬────┘
               │          │          │
               ▼          │          │ (back to SENDING)
          ┌─────────┐     │          │
          │DELIVERED│     │          │
          └────┬────┘     │          │
               │          │          │
               ▼          ▼          │
          ┌─────────┐ ┌────────┐    │
          │  READ   │ │  DLQ   │ ←──┘ (after max retries)
          └─────────┘ └────────┘
```

---

## State Definitions

| State | Description | Terminal? |
|-------|-------------|-----------|
| `pending` | Created, waiting for processing | No |
| `queued` | Enqueued for specific channel | No |
| `sending` | Provider is attempting delivery | No |
| `sent` | Provider accepted the message | No |
| `delivered` | Confirmed delivered to device | No |
| `read` | Recipient opened/read the message | Yes |
| `failed` | Delivery attempt failed | No |
| `retrying` | Scheduling retry attempt | No |
| `dlq` | Moved to Dead Letter Queue | Yes |
| `expired` | TTL expired before delivery | Yes |

---

## State Machine Contract

```typescript
type DeliveryState =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'retrying'
  | 'dlq'
  | 'expired'

interface DeliveryTransition {
  from: DeliveryState
  to: DeliveryState
  reason: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
```

---

## Valid Transitions

```
pending    → queued, expired
queued     → sending, expired
sending    → sent, failed
sent       → delivered, failed
delivered  → read, failed
failed     → retrying, dlq
retrying   → sending, dlq, expired
read       → (terminal)
dlq        → (terminal, unless manually resolved)
expired    → (terminal)
```

---

## State Tracking

```sql
-- delivery_states table
CREATE TABLE delivery_states (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  state TEXT NOT NULL,
  transitioned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  metadata TEXT,          -- JSON
  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

CREATE INDEX idx_delivery_states_notification
  ON delivery_states(notification_id);
CREATE INDEX idx_delivery_states_state
  ON delivery_states(state);
```

---

## TTL (Time-To-Live)

Each notification has a TTL based on type:

| Notification Type | TTL | Reason |
|-------------------|-----|--------|
| Trip update | 15 min | Real-time, irrelevant after |
| Booking confirmation | 24 hours | Still relevant next day |
| Payment receipt | 7 days | Record keeping |
| Driver assignment | 1 hour | Action required soon |
| Marketing | 48 hours | Promotional |

If TTL expires before delivery → state becomes `expired`.

---

## Delivery Confirmation

### WhatsApp
- Webhook from Evolution API confirms delivery
- Read receipts when available

### Email
- SMTP delivery confirmation (250 OK)
- Open tracking (pixel, future)

### Push
- FCM delivery receipt
- Token invalidation detection

### SMS
- Delivery receipt from Twilio

### WebSocket
- ACK from client

### InApp
- Implicit (stored in database)
