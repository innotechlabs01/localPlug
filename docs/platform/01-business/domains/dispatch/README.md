# DISPATCH DOMAIN

> Driver assignment, availability matching, and real-time dispatch.

## Responsibility
- Owns: driver assignment, availability matching, dispatch logic
- Does NOT own: driver profiles (Drivers), trip execution (Trips)

## Boundaries
- Inbound: Booking (request), Admin, Customer app
- Outbound: Drivers (availability), Trips (create), Notifications (assignment)

## Status
- Maturity: 55%
- Extraction: Partial (some logic in Admin page, client-side)
- Portal: None

## Domain Model
- **Entities**: Assignment, DriverAvailability, DispatchRule
- **Value Objects**: AssignmentStatus, DispatchMethod, Priority
- **Aggregates**: Assignment (root: Assignment, invariants: one active assignment per driver)
- **Events**: assignment.requested, assignment.offered, assignment.accepted, assignment.rejected
- **Policies**: Availability windows, priority rules, surge matching

## Key Files
- `packages/domains/_services/src/assignment.ts` — Domain service (stub)
- `app/admin/dispatch-center/` — Admin page (client-side logic)
- `packages/db/src/domains/dispatch/` — DB schema

## Extraction Plan
1. Move dispatch logic from Admin page to domain service
2. Create Dispatch Portal (driver mobile)
3. Add real-time events via WebSocket
