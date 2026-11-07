# Business Domain — Trips

**Purpose:** Track the execution of an accepted assignment from start to finish.

## Entities
- `Trip` — the executed journey
- `TripMilestone` — status transitions with timestamps
- `TripEarning` — financial record for the trip

## Events
- `trip:status_changed`, `trip:completed`, `trip:cancelled`

## Business Rules
- **One trip per accepted assignment** (1:1 relationship).
- Each status transition records its timestamp.
- Trip cannot be cancelled by driver once passenger is onboard.
- `COMPLETED` triggers: earnings calculation + `availability → available`.

## Related
- Workflow: `../../06-workflows/trip-flow.md`
- State machine: `../../07-state-machines/trip.md`
- Domain package: `packages/domains/trips`
