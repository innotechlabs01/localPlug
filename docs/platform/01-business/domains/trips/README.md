# TRIPS DOMAIN

> Trip execution, state machine, GPS tracking, and ride history.

## Responsibility
- Owns: trip lifecycle, GPS tracking, ride history, trip state machine
- Does NOT own: booking (Booking), dispatch (Dispatch), payments (Payments)

## Boundaries
- Inbound: Dispatch (create), Admin, Customer app, Driver Portal
- Outbound: Payments (charge), Notifications (status), Analytics (metrics)

## Status
- Maturity: 45%
- Extraction: Complete (B16)
- Portal: Driver Portal + Customer app (trip tracking)

## Domain Model
- **Entities**: Trip, TripLocation, TripEvent
- **Value Objects**: TripStatus, Location, TripMetrics
- **Aggregates**: Trip (root: Trip, invariants: status transitions, location sequence)
- **Events**: trip.started, trip.location_updated, trip.completed, trip.cancelled
- **Policies**: State machine rules, GPS update frequency, cancellation policies

## Key Files
- `packages/domains/trips/` — Domain package (B16)
- `packages/db/src/domains/trips/` — DB schema

## Status
Extracted in B16. Enhance with events and tests.
