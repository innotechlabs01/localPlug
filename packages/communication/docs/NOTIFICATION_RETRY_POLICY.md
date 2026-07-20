# NOTIFICATION_RETRY_POLICY (Retry + DLQ)

> Never lose a message. Every failure is retried. Every permanent failure
> goes to the Dead Letter Queue. Every DLQ entry is investigated.

---

## Retry Strategy

### Exponential Backoff

```
Attempt 1: Immediately
Attempt 2: After 30 seconds
Attempt 3: After 2 minutes
Attempt 4: After 5 minutes
Attempt 5: After 15 minutes
Attempt 6: After 30 minutes
Attempt 7: After 1 hour
Attempt 8: After 2 hours
Attempt 9: After 4 hours
Attempt 10: After 8 hours → MOVE TO DLQ
```

### Configuration

```typescript
interface RetryPolicy {
  maxAttempts: number           // Default: 10
  baseDelayMs: number           // Default: 30000 (30s)
  maxDelayMs: number            // Default: 28800000 (8 hours)
  backoffMultiplier: number     // Default: 2
  jitterMs: number              // Default: 5000 (±5s random)
}
```

### Per-Provider Overrides

| Provider | Max Attempts | Base Delay | Notes |
|----------|-------------|------------|-------|
| WhatsApp | 10 | 30s | Rate limit aware |
| Email | 5 | 60s | SMTP transient errors |
| Push | 5 | 30s | Token refresh may help |
| SMS | 5 | 60s | Cost conscious |
| WebSocket | 3 | 10s | Real-time, low tolerance |
| InApp | 1 | 0s | Database write, unlikely to fail |

---

## Dead Letter Queue (DLQ)

When all retries exhausted, message moves to DLQ.

### DLQ Entry

```typescript
interface DeadLetterEntry {
  id: string
  notificationId: string
  recipientId: string
  channel: NotificationChannel
  eventType: string
  templateId: string
  attempts: number
  lastError: string
  lastAttemptAt: Date
  payload: Record<string, unknown>
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: 'retried' | 'dismissed' | 'manually_sent'
}
```

### DLQ Processing

```
DLQ Entry Created
    ↓
1. Alert monitoring (Slack/Email)
2. Auto-retry after 24 hours (one more attempt)
3. If still failed → manual investigation
4. Manual resolution: retry / dismiss / send manually
```

### DLQ Queries

```sql
-- Unresolved DLQ entries
SELECT * FROM notification_dlq
WHERE resolved_at IS NULL
ORDER BY created_at DESC;

-- DLQ by channel
SELECT channel, COUNT(*) as count
FROM notification_dlq
WHERE resolved_at IS NULL
GROUP BY channel;

-- DLQ by event type
SELECT event_type, COUNT(*) as count
FROM notification_dlq
WHERE resolved_at IS NULL
GROUP BY event_type;
```

---

## Circuit Breaker Integration

Each provider has a circuit breaker:

```
Closed (Normal) → Open (Failing) → Half-Open (Testing) → Closed
     ↑                                                       │
     └───────────────────────────────────────────────────────┘
```

### Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number    // Open after N failures (default: 5)
  successThreshold: number    // Close after N successes (default: 3)
  timeoutMs: number           // Half-open timeout (default: 30000)
}
```

### Behavior When Open

1. New messages are queued (outbox pattern)
2. No calls to provider
3. After timeout, half-open: try one request
4. Success → close circuit
5. Failure → reopen circuit

---

## Outbox Pattern Integration

The retry system uses the B10 outbox pattern:

1. Message is written to outbox (atomic with business state)
2. Outbox processor picks it up
3. Provider attempts delivery
4. On success → mark outbox entry as processed
5. On failure → increment retry count, schedule next attempt
6. On DLQ → move to DLQ table

This ensures no message is lost between business state change and delivery attempt.

---

## Metrics

| Metric | Description |
|--------|-------------|
| `notification.retry.count` | Total retry attempts |
| `notification.dlq.entries` | Current DLQ size |
| `notification.dlq.new` | New DLQ entries per minute |
| `notification.dlq.resolved` | Resolved DLQ entries per hour |
| `notification.circuit.open` | Circuit breaker state |
| `notification.delivery.time` | Time from event to delivery |
