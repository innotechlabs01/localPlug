# Research: Flight Validation & User Tracking

**Date**: 2026-05-15

## Decisions

### Flight Validation Strategy

| Aspect | Decision |
|--------|----------|
| **Approach** | Mock internal flight reference data set (static TypeScript array) |
| **Service location** | Client-side pure TypeScript module (`flight-validation.ts`) |
| **API pattern** | Async function with configurable latency, matching `persistence.ts` |
| **Failure simulation** | Reuse existing `__mock_fail` localStorage toggle |
| **Reference data size** | 10 major airlines serving Medellín (MDE), 3+ flights each |

**Rationale**: The spec 003 is a "baseline" (per the original user request). Using a
*mock* flight service is consistent with the existing mock persistence layer from spec
002 — same async wrapper pattern, same failure toggle, simulated latency. This avoids
API key management, rate limits, and cost during development while still validating the
full UX flow (validation UI, error states, booking flagging). The real external API can
be swapped in later by replacing the contents of `flight-validation.ts` without changing
any component code.

**Alternatives considered**:
- **AviationStack**: Free tier offers 500 req/mo, requires API key — overkill for baseline
- **FlightAware AeroAPI**: Paid only ($49+/mo) — cost prohibitive for baseline
- **AeroDataBox (RapidAPI)**: Free tier available but requires third-party subscription

### 15-Day Date Enforcement Strategy

| Aspect | Decision |
|--------|----------|
| **Implementation** | HTML5 `<input type="date" min="...">` + step-gate validation in form submit |
| **Min date calc** | `new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]` |
| **Timezone** | Server-rendered value using UTC then adjusted to Colombia Time (UTC-5) |
| **Recalculation** | `min` computed fresh on every render (no stale state issue) |
| **Step gate** | If `arrivalDate < minDate`, "Continue" button disabled with tooltip message |

**Rationale**: The native HTML5 date input `min` attribute is the most accessible
approach — it inherently prevents selection of disabled dates, works with keyboard
navigation, and is announced by screen readers. The step-gate validation acts as a
second line of defense for programmatic/manual entry bypass attempts.

**Alternatives considered**:
- **Custom date picker (react-day-picker)**: Heavier bundle, more moving parts
- **JavaScript validation only**: Doesn't prevent visual selection of invalid dates
- **Server-side validation only**: Poor UX (user fills all fields then gets error)

### Concierge Booking Search Strategy

| Aspect | Decision |
|--------|----------|
| **Endpoint** | `GET /api/bookings/search?flightNumber=XX&airline=YY` |
| **Backend store** | In-memory `Map<string, Booking[]>` keyed by `airline:flightNumber` |
| **Population** | `POST /api/booking` pushes submitted bookings into the store |
| **Response format** | `{ results: Booking[], count: number }` |
| **Search UI** | None for baseline — endpoint contract only (concierge dashboard is out of scope) |

**Rationale**: The concierge team needs an interface to look up bookings by flight.
For the baseline, an API endpoint is sufficient — the actual dashboard UI is a future
concern. The in-memory store is consistent with the "mock" philosophy: no database
required, resets on server restart, but proves the contract works.

**Alternatives considered**:
- **localStorage on concierge machine**: Not multi-user, not practical
- **Real database**: Overkill for baseline (no server-side DB currently)
- **Admin dashboard page**: Out of scope for this spec (P2 feature)

### Type & Data Model Changes

| Aspect | Decision |
|--------|----------|
| **Booking field additions** | `flightValidationStatus: 'pending' | 'validated' | 'unverified' | 'error'` |
| **New entity** | `FlightValidationResult` — return type of validation service |
| **New entity** | `BookingFlag` — marker for bookings needing manual review |
| **Storage key** | `booking_queue` extended to include flight validation payload |

**Rationale**: The existing Booking type needs minimal extension — a single field
for validation status. For the mock baseline, we don't need a separate FlightRecord
entity; the flight data already lives in `Booking.flight`. The flagging mechanism is
a boolean/inferred from `flightValidationStatus !== 'validated'`.

## Best Practices

### Date Validation Patterns

- Compute `min` and `max` on the server or use `new Date()` inside `'use client'`
  components (not in RSC, since the date would be stale by the time the client hydrates)
- Test the min-date calculation at midnight boundaries, timezone offsets, and the
  day after a 31st-of-month
- For Colombia Time (UTC-5), use `Intl.DateTimeFormat` with `timeZone: 'America/Bogota'`
  to get the correct offset regardless of server location

### Flight Validation UX

- Show a subtle spinner/spinner icon during validation (matched to the 200ms mock latency)
- On success: display a small green checkmark + airline name confirmation
- On failure (invalid flight): display an amber warning banner + "will be flagged for review"
- On service error: same as failure — flag for review
- Never prevent form advancement — only warn/flag

### Accessibility Patterns

- Validation status text needs `aria-live="polite"` so screen readers announce changes
- Warning/error banners need `role="alert"`
- Date input with `min` attribute is natively accessible — do not override ARIA
- All new interactive elements must meet 44px touch target minimum

### Testing Patterns

- Flight validation service: test valid flight, invalid flight, service failure,
  timeout, empty input, edge-case flight numbers (e.g., "0000", "AA 123" with space)
- Date enforcement: test min date calculation, midnight boundary, 31st-of-month rollover,
  different timezones, programmatic bypass attempt
- Concierge search endpoint: test exact match, partial match, no match,
  multiple results for same flight, missing parameters, invalid format
- Form integration: test that validation runs on flight number change,
  that flagged bookings still submit, that `__mock_fail` causes graceful degradation
