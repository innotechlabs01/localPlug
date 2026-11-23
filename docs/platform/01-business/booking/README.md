# Business Domain — Booking

**Purpose:** Manage the complete lifecycle of a customer reservation.

## Entities
- `Booking` — core reservation record
- `BookingItem` — individual service items within a booking
- `BookingNote` — special instructions or notes

## Value Objects
- `Route` — pickup and dropoff locations with coordinates
- `Schedule` — requested date/time with timezone
- `PassengerCount` — passengers and luggage

## Events
- `booking:created` — new reservation submitted
- `booking:updated` — details changed
- `booking:cancelled` — reservation cancelled
- `booking:confirmed` — payment verified, booking active

## Business Rules
- A booking cannot be created without valid pickup/dropoff.
- Scheduled time must be at least **2 hours** in the future.
- Cancellation within 24 hours may incur a fee.
- Bookings with return trips must have `return_date >= arrival_date`.
- One booking can spawn multiple assignments (rejection/reassignment) but only one trip per accepted assignment.

## Related
- Workflow: `../../06-workflows/booking-flow.md`
- State machine: `../../07-state-machines/booking.md`
- Domain package: `packages/domains/booking`
