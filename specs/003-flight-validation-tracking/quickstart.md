# Quickstart: Flight Validation & User Tracking

## What this feature adds

1. **15-day minimum date enforcement** — arrival date picker prevents selection of
   dates within 15 days of today; step-gate validation as second line of defense
2. **Flight data validation** — mock validation service checks airline + flight number
   against reference data; shows success checkmark or warning banner without blocking
   form advancement
3. **Flight-based user tracking** — `GET /api/bookings/search?flightNumber=X&airline=Y`
   endpoint lets the concierge team find all bookings for a given flight
4. **Booking flagging** — bookings with unverified flight data are marked for manual
   review

## Key files

| File | Purpose |
|------|---------|
| `app/components/booking/lib/flight-validation.ts` | Mock flight validation service |
| `app/components/booking/lib/flight-data.ts` | Static mock flight reference data (10+ airlines) |
| `app/components/booking/lib/types.ts` | Added `flightValidationStatus`, `FlightValidationResult` |
| `app/components/booking/lib/booking-store.ts` | Server-side in-memory booking store |
| `app/api/bookings/search/route.ts` | Concierge search endpoint |
| `app/components/booking/step-flight-logistics.tsx` | Updated: date `min` + validation UI |
| `app/components/booking/booking-form.tsx` | Updated: flight validation integration |

## Testing

```bash
pnpm test          # Vitest component tests (existing + new)
pnpm test:watch    # Watch mode
```

New test files:
- `app/components/booking/__tests__/flight-validation.test.ts`
- `app/components/booking/__tests__/date-enforcement.test.ts`

## Development

To simulate flight validation failure:

```js
localStorage.setItem('__mock_fail', 'true')
```

Flight validation will return `{ valid: false, error: "Validation service unavailable" }`
and the booking will be flagged for review.

To clear the in-memory booking store (for concierge search testing):

```
Restart the Next.js dev server — the store resets on server restart.
```

## Design tokens used (unchanged from 002)

- Colors: Slate Navy, Mountain Emerald, Golden Sol, Cool Slate
- Typography: Plus Jakarta Sans (headlines), Inter (body)
- Spacing: 8px base, 16px/24px/32px stacks
- Radii: 8px default, rounded-lg for cards
