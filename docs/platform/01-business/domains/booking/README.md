# BOOKING DOMAIN

> Core reservation and trip request management.

## Responsibility
- Owns: reservations, booking requests, trip types, booking state machine
- Does NOT own: payment processing, dispatch, driver assignment

## Boundaries
- Inbound: Customer app, Admin, Hotel portal, API consumers
- Outbound: Payments (charge), Dispatch (assign), Notifications (confirm)

## Status
- Maturity: 65%
- Extraction: Partial (domain service exists, some logic in routes)
- Portal: None (Customer portal planned)

## Domain Model
- **Entities**: Booking, BookingRequest, BookingTimeline
- **Value Objects**: BookingStatus, TripType, PassengerCount, LuggageCount
- **Aggregates**: Booking (root: Booking, invariants: status transitions)
- **Events**: booking.created, booking.confirmed, booking.cancelled, booking.completed
- **Policies**: 15-min hold expiry, cancellation window, refund rules

## Key Files
- `packages/domains/_services/src/booking.ts` — Domain service
- `app/api/bookings/` — API routes
- `packages/db/src/domains/bookings/` — DB schema

## Extraction Plan
1. Move booking logic from routes to domain service
2. Add event publishing on state changes
3. Consolidate booking tables
4. Create Customer portal
