# Data Model: Flight Validation & User Tracking

## Entities

### Booking (extended from 002)

A complete booking record. The existing fields from 002 are unchanged; new fields
are marked below.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | string | yes | UUID v4 | Generated client-side |
| `flight.flightNumber` | string | yes | Min 2 chars | e.g., AA1123 |
| `flight.airline` | string | yes | Min 2 chars | |
| `flight.arrivalDate` | string | yes | ISO date, ≥15 days from today | Enforced by date picker `min` + step gate |
| `flight.arrivalTime` | string | yes | HH:MM format | 24-hour |
| `profile` | string | yes | One of: family, celebration, nomad, medical | Traveler profile ID |
| `destination.hasPlace` | boolean | yes | — | Whether user has an address |
| `destination.address` | string | no | Required if hasPlace=true | Hotel/address name |
| `destination.wantsGuatape` | boolean | no | — | Optional Guatapé trip |
| `package.id` | string | yes | One of: smooth-landing, first-24, full-insider | Selected VIP package |
| `flightValidationStatus` | string | no | `'pending' | 'validated' | 'unverified' | 'error'` | **NEW** — set during validation |
| `flightValidatedAt` | string | no | ISO timestamp | **NEW** — when validation completed |
| `status` | string | yes | draft, submitted, confirmed, failed | Lifecycle state |
| `createdAt` | string | yes | ISO timestamp | |
| `submittedAt` | string | no | ISO timestamp | Set on submission |

**State transitions**: `draft` → `submitted` → `confirmed` | `failed`

### FlightValidationResult

The result returned by the flight validation service.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `valid` | boolean | yes | — | Whether the flight was found in reference data |
| `airlineName` | string | no | — | Canonical airline name (e.g., "American Airlines") |
| `flightNumber` | string | yes | — | Normalized flight number (uppercase, no spaces) |
| `error` | string | no | — | Error message if validation failed (service error) |

**Note**: `airlineName` may differ from what the user typed (e.g., user types
"American" and canonical name is "American Airlines"). This is intentional —
the canonical name is the tracking reference.

### BookingFlag

An inferred marker on a booking indicating manual review is needed. This is not
a stored entity — it is derived from `flightValidationStatus`:

| Status | Flagged? | Reason |
|--------|----------|--------|
| `validated` | No | Flight confirmed in reference data |
| `unverified` | Yes | Flight not found in reference data |
| `error` | Yes | Validation service unavailable or error |
| `pending` | Yes (temporary) | Validation not yet complete |

### FlightReference (Mock Data)

A static entry in the mock flight reference data set. One entry per airline.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `airlineName` | string | yes | Canonical airline name |
| `iataCode` | string | yes | 2-letter IATA code (e.g., "AA") |
| `flightNumbers` | string[] | yes | Array of valid flight number suffixes |

**Example**: `{ airlineName: "American Airlines", iataCode: "AA", flightNumbers: ["1123", "1456", "2123"] }`
A flight is valid if the user's airline matches `airlineName` (case-insensitive) or
`iataCode`, AND the numeric portion of their flight number appears in `flightNumbers`.

## Server-Side Booking Store

An in-memory `Map<string, Booking[]>` keyed by `${airline}:${flightNumber}` (lowercase,
normalized). Populated on each successful `POST /api/booking`. Exposed for concierge
search via `GET /api/bookings/search?flightNumber=XX&airline=YY`.

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Store booking | POST | `/api/booking` | Push to store after successful submission |
| Search by flight | GET | `/api/bookings/search?flightNumber=X&airline=Y` | Returns all matching bookings |
| Reset | — | — | Store clears on server restart (development-only) |

## Persistence Keys (localStorage)

No new storage keys are added. The existing keys are unchanged:

| Key | Contents | TTL |
|-----|----------|-----|
| `booking_draft` | Partial Booking (JSON) | 24h |
| `booking_queue` | PersistenceQueueEntry[] (JSON) | No TTL |
| `booking_last_submitted` | Booking (JSON, last successful) | 7d |
| `__mock_fail` | `"true"` or missing | Dev/test toggle |

## Validation Rules

1. **Date enforcement**: `arrivalDate` must be ≥15 calendar days from today in
   Colombia Time (UTC-5). Enforced by HTML `min` attribute + step-gate check.
2. **Flight validation**: Runs on `flightNumber` and `airline` change (debounced
   500ms). Does not block form advancement.
3. **Normalization**: Flight number is uppercased and whitespace-trimmed before
   validation. Airlines matched case-insensitively against canonical name or IATA code.
4. **Graceful degradation**: If `__mock_fail` is set or an error occurs,
   `flightValidationStatus` is set to `'error'` and booking is flagged.
5. **Concierge search**: `flightNumber` and `airline` parameters are required.
   Match is case-insensitive, trimmed. Returns empty array (not 404) if no results.
