# Data Model: Booking Persistence

## Entities

### Booking

A complete booking record submitted by the user through the 4-step form.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | string | yes | UUID v4 | Generated client-side |
| `flight.flightNumber` | string | yes | Min 2 chars | e.g., AA1123 |
| `flight.airline` | string | yes | Min 2 chars | |
| `flight.arrivalDate` | string | yes | ISO date, ≥15 days from today | |
| `flight.arrivalTime` | string | yes | HH:MM format | 24-hour |
| `profile` | string | yes | One of: family, celebration, nomad, medical | Traveler profile ID |
| `destination.hasPlace` | boolean | yes | — | Whether user has an address |
| `destination.address` | string | no | Required if hasPlace=true | Hotel/address name |
| `destination.wantsGuatape` | boolean | no | — | Optional Guatapé trip |
| `package.id` | string | yes | One of: smooth-landing, first-24, full-insider | Selected VIP package |
| `status` | string | yes | draft, submitted, confirmed, failed | Lifecycle state |
| `createdAt` | string | yes | ISO timestamp | |
| `submittedAt` | string | no | ISO timestamp | Set on submission |

**State transitions**: `draft` → `submitted` → `confirmed` | `failed`

### PersistenceQueueEntry

An entry in the local retry queue for failed submissions.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | string | yes | UUID v4 |
| `booking` | Booking | yes | Full booking payload |
| `timestamp` | string | yes | ISO timestamp of first attempt |
| `retryCount` | number | yes | 0-3 |
| `lastError` | string | no | Error message from last attempt |

### ToastNotification

A transient notification displayed to the user.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | string | yes | UUID v4 |
| `type` | string | yes | success, error, warning, info |
| `message` | string | yes | Human-readable message |
| `action` | { label, onClick } | no | Optional action button |
| `createdAt` | number | yes | Date.now() timestamp |
| `duration` | number | no | Auto-dismiss ms (null = manual) |

## Persistence Keys (localStorage)

| Key | Contents | TTL |
|-----|----------|-----|
| `booking_draft` | Partial Booking (JSON) | 24h |
| `booking_queue` | PersistenceQueueEntry[] (JSON) | No TTL |
| `booking_last_submitted` | Booking (JSON, last successful) | 7d |
| `__mock_fail` | `"true"` or missing | Dev/test toggle |

## Validation Rules

1. **Date validation**: `arrivalDate` must be ≥15 days from current date
2. **Step validation**: "Continue" is disabled until all required fields in
   current step are filled
3. **Package selection**: Exactly one package must be selected before "Confirm"
4. **Queue limit**: Max 10 entries in retry queue; oldest entry evicted when
   full
5. **Draft TTL**: Drafts older than 24h are discarded on page load
