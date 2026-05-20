# Flight Validation Contract

## Overview

The flight validation service is a client-side TypeScript module that checks
whether a given airline + flight number combination corresponds to a known
scheduled flight. It follows the same async-wrapping pattern as the existing
persistence layer (`persistence.ts`) for consistency.

## Interface

```typescript
interface FlightValidationAPI {
  // Validate an airline + flight number combination
  // Returns a FlightValidationResult
  validateFlight(params: {
    airline: string
    flightNumber: string
  }): Promise<FlightValidationResult>
}

interface FlightValidationResult {
  valid: boolean
  airlineName?: string     // Canonical airline name (set when valid)
  flightNumber?: string    // Normalized flight number (set when valid)
  error?: string           // Error message (set on service failure)
}
```

## Implementation

- **Module**: `app/components/booking/lib/flight-validation.ts`
- **Reference data**: `app/components/booking/lib/flight-data.ts` (static array)
- **Default latency**: 200ms (configurable via `options.latency`)
- **Failure simulation**: Toggle via `localStorage.__mock_fail = 'true'`

### Matching Algorithm

1. Normalize airline input: trim whitespace, lowercase
2. Normalize flight number: trim whitespace, uppercase, extract numeric suffix
3. Find matching airline in reference data:
   - Exact match on `airlineName` (case-insensitive)
   - OR match on `iataCode` (case-insensitive)
4. If airline found, check if the numeric flight number suffix is in
   `flightNumbers` array
5. Return `{ valid: true, airlineName, flightNumber }` on match
6. Return `{ valid: false }` on no match

### Error Handling

| Scenario | Behavior |
|----------|----------|
| `__mock_fail` set to "true" | Returns `{ valid: false, error: "Validation service unavailable" }` |
| Empty airline or flight number | Returns `{ valid: false, error: "Missing required fields" }` |
| Network error (simulated) | Returns `{ valid: false, error: "Validation service error" }` |
| Normal operation, valid flight | Returns `{ valid: true, airlineName: "...", flightNumber: "..." }` |
| Normal operation, invalid flight | Returns `{ valid: false }` (no error — flight simply not found) |

## Usage in Booking Form

```typescript
import { createFlightValidation } from './lib/flight-validation'

const flightValidation = createFlightValidation()

// When user types flight number or airline (debounced 500ms):
const result = await flightValidation.validateFlight({
  airline: data.airline,
  flightNumber: data.flightNumber,
})

if (result.valid) {
  // Show green checkmark + airline name
  setFlightValidationStatus('validated')
  setCanonicalAirlineName(result.airlineName)
} else if (result.error) {
  // Show amber warning (service error)
  setFlightValidationStatus('error')
} else {
  // Show amber warning (flight not found)
  setFlightValidationStatus('unverified')
}
```

## Concierge Search Contract

```typescript
// GET /api/bookings/search?flightNumber=AA1123&airline=American+Airlines

// Success Response (200)
interface SearchResponse {
  results: Booking[]
  count: number
}

// Error Response (400)
interface SearchError {
  error: string
  message: string
}
```

### Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `flightNumber` | yes | string | Flight number (e.g., "AA1123") |
| `airline` | yes | string | Airline name or IATA code (e.g., "American Airlines" or "AA") |

### Search Behavior

- Match is case-insensitive on both `flightNumber` and `airline`
- Both parameters must be present; 400 if missing
- Returns all matching bookings from the in-memory store
- Returns `{ results: [], count: 0 }` if no match (not 404)
- Store repopulated on each POST to `/api/booking`
