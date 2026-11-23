# HOTELS DOMAIN

> Hotel partner management, properties, rooms, commissions, and tenancy.

## Responsibility
- Owns: hotel profiles, properties, rooms, commission policies, hotel tenancy, manager assignment
- Does NOT own: bookings (Booking), payments (Payments), notifications (Communication)

## Boundaries
- Inbound: Admin, Hotel Portal (planned), API consumers
- Outbound: Booking (availability), Payments (commission), Notifications (hotel events), Analytics (metrics)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 28%
- Extraction: Not started

## Domain Model
- Entities: Hotel, Property, Room, HotelManager, CommissionPolicy
- Value Objects: HotelStatus, RoomType, CommissionRate, TenancyScope
- Aggregates: Hotel (root, invariants: tenancy isolation, commission rules)
- Events: hotel.created, hotel.updated, hotel.status.changed, hotel.manager.assigned, room.created, room.updated, commission.updated
- Policies: CommissionPolicy (4x formula), tenancy rules, room availability, manager assignment
