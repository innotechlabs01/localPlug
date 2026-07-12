# HOTELS DOMAIN

> Hotel partner management, properties, rooms, commissions, and tenancy.

## Responsibility
- Owns: hotel profiles, properties, rooms, commission policies, hotel tenancy
- Does NOT own: bookings (Booking), payments (Payments), notifications (Communication)

## Boundaries
- Inbound: Admin, Hotel Portal (planned), API consumers
- Outbound: Booking (availability), Payments (commission), Notifications (hotel events)

## Status
- Maturity: 28%
- Extraction: Not started (935-line admin page, inline DB logic)
- Portal: None (Hotel Portal planned)

## Domain Model
- **Entities**: Hotel, Property, Room, HotelUser, HotelCommission
- **Value Objects**: HotelStatus, RoomType, CommissionRate, TenancyScope
- **Aggregates**: Hotel (root: Hotel, invariants: tenancy isolation, commission rules)
- **Events**: hotel.onboarded, hotel.status_changed, commission.updated
- **Policies**: CommissionPolicy (single source: 4x formula), tenancy rules, room availability

## Key Files
- `app/admin/hotel-management/` — 935-line admin page (needs full extraction)
- `lib/admin/hotel-auth.ts` — Hotel tenancy boundary
- `lib/settings.ts` — Hotel commission config (317L)
- `packages/db/src/domains/hotels/` — DB schema (4 tables)

## Extraction Plan
1. Create domain package
2. Extract commission logic from lib/settings.ts
3. Extract hotel management from admin page
4. Create Hotel Portal
5. Add hotel events
