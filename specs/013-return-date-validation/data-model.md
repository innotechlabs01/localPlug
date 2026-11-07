# Data Model: Return Date Validation

**Phase 1 output** — No new entities. Existing FlightData entity reused.

## FlightData (existing)

Defined in `app/components/booking/lib/types.ts` and locally in `step-flight-logistics.tsx`.

| Field | Type | Mutable | Description |
|-------|------|---------|-------------|
| `flightNumber` | string | Yes | Flight number for arrival |
| `airline` | string | Yes | Airline name |
| `arrivalDate` | string (YYYY-MM-DD) | Yes | Arrival date (min: 10 days ahead) |
| `arrivalTime` | string (HH:MM) | Yes | Arrival time |
| `needReturn` | boolean | Yes | Whether user needs return transportation |
| `returnDate` | string (YYYY-MM-DD) | Yes | Return date (min: arrivalDate if needReturn, else 10-day default) |
| `returnTime` | string (HH:MM) | Yes | Return time |

## Validation Rules (new)

| Condition | Constraint |
|-----------|-----------|
| `needReturn === true` AND `arrivalDate` is set | `returnDate` `min` = `arrivalDate` |
| `needReturn === true` AND `arrivalDate` is NOT set | `returnDate` `min` = standard 10-day-ahead floor |
| `needReturn === false` | Return fields hidden; no constraint |
| `arrivalDate` changes AND `returnDate < new arrivalDate` | `returnDate` cleared to empty string |
