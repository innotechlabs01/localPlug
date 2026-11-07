# Architecture — Domain-Driven Design

## Boundaries
Domains are isolated business capabilities. Each owns its data and logic.

| Domain | Responsibility | Key Entities |
|---|---|---|
| Booking | Reservation lifecycle, pricing | Booking, Quote, Promotion |
| Dispatch | Assignment engine, matching | Assignment, Queue, Match |
| Drivers | Registration, claim, compliance | Driver, Document, Session |
| Trips | Trip lifecycle, transitions | Trip, Route, Milestone |
| Vehicles | Registry, fleet | Vehicle, Category, Assignment |
| Customers | Profiles, history | Customer, Preference |
| Payments | Earnings, payouts | Earning, Commission, Payout |
| Notifications | Push/in-app/WhatsApp | Notification, Template |
| Analytics | Metrics, reporting | Metric, Report |
| Content | Experiences, tours | Experience, Category |

## Rules
1. Domains communicate through **events**, not direct calls.
2. Each domain owns its data — no cross-domain queries.
3. Domain logic lives in `packages/domains/*`, never in UI or API routes.
4. Domain events are the only way to trigger cross-boundary side effects.
5. Each domain has its own Zod validation schemas.

## Aggregate design
```
Booking   → Root: Booking;  Entities: BookingItem, BookingNote;
            VOs: Route, Schedule, PassengerCount;
            Events: BookingCreated, BookingUpdated, BookingCancelled

Driver    → Root: Driver;   Entities: Document, AvailabilityLog, Session;
            VOs: PhoneNumber, License, VehicleType;
            Events: DriverRegistered, DriverApproved, AvailabilityChanged

Trip      → Root: Trip;    Entities: TripMilestone, TripEarning;
            VOs: Distance, Duration, Coordinates;
            Events: TripStarted, TripCompleted, TripCancelled
```

See `01-business/` for per-domain detail and `07-state-machines/` for lifecycles.
