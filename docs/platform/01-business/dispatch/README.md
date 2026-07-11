# Business Domain — Dispatch

**Purpose:** Match available drivers to pending bookings efficiently.

## Entities
- `Assignment` — a dispatch attempt matching a driver to a booking
- `Queue` — pending bookings awaiting assignment
- `MatchCriteria` — driver matching rules and preferences

## Events
- `assignment:new` — driver matched to booking
- `assignment:accepted` — driver accepted
- `assignment:rejected` — driver rejected
- `assignment:expired` — timer ran out, voided
- `assignment:cancelled` — dispatcher cancelled
- `assignment:reassigned` — reassigned to another driver

## Business Rules
- Only **Available + Approved** drivers appear in dispatch.
- Assignment timer is configurable (default **45 seconds**).
- A booking can have multiple assignments (rejection/reassignment).
- Smart matching considers VIP requirements, vehicle type, experience.
- One accepted assignment yields exactly one trip.

## Related
- Workflow: `../../06-workflows/dispatch-flow.md`, `../../06-workflows/assignment-flow.md`
- State machine: `../../07-state-machines/assignment.md`
- Domain package: `packages/domains/dispatch`
