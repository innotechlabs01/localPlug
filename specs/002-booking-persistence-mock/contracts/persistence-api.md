# Persistence Layer Contract

## Interface

```typescript
interface PersistenceAPI {
  // Save a booking draft (partial or complete)
  saveDraft(booking: Partial<Booking>): Promise<void>

  // Load the most recent draft, or null if none/expired
  loadDraft(): Promise<Partial<Booking> | null>

  // Enqueue a failed submission for retry
  enqueueRetry(entry: PersistenceQueueEntry): Promise<void>

  // Dequeue the next pending retry
  dequeueRetry(): Promise<PersistenceQueueEntry | null>

  // Get all pending retries
  getRetryQueue(): Promise<PersistenceQueueEntry[]>

  // Remove a retry entry (after success or max attempts)
  removeRetry(id: string): Promise<void>

  // Submit booking to the server API
  submit(booking: Booking): Promise<{ status: string }>

  // Clear all persisted data
  clear(): Promise<void>
}
```

## Return Values

- All methods return Promises to simulate async API behavior
- Simulated latency: 100-300ms (configurable)
- On failure simulation (`__mock_fail`): `saveDraft`, `submit` throw an error
- `loadDraft` returns `null` if draft is older than 24h

## Storage Format

```json
// localStorage key "booking_draft"
{
  "flight": { "flightNumber": "AA1123", "airline": "American Airlines", "arrivalDate": "2026-06-01", "arrivalTime": "14:30" },
  "profile": "nomad",
  "destination": { "hasPlace": true, "address": "Hotel Medellín", "wantsGuatape": false },
  "package": "first-24",
  "status": "draft",
  "createdAt": "2026-05-15T10:00:00.000Z"
}

// localStorage key "booking_queue"
[
  {
    "id": "uuid-v4",
    "booking": { ... },
    "timestamp": "2026-05-15T10:05:00.000Z",
    "retryCount": 0,
    "lastError": "NetworkError: Failed to fetch"
  }
]
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| localStorage unavailable | All methods resolve silently (no-op) |
| localStorage quota exceeded | `saveDraft` / `enqueueRetry` catch error, resolve silently |
| `__mock_fail` set to "true" | `saveDraft` and `submit` reject with error |
| Draft > 24h old | `loadDraft` removes key and returns null |
| Queue > 10 entries | Oldest entry is evicted before adding new one |
