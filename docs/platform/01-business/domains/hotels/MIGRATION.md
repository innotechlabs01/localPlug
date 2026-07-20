# MIGRATION (Hotels)

## Current State
- **Location**: `app/admin/hotel-management/` (935-line page), `lib/settings.ts` (commission), `lib/admin/hotel-auth.ts` (tenancy)
- **Tables**: `hotels`, `rooms`, `room_bookings`, `hotel_managers`
- **API Routes**: `app/api/admin/hotels/*/route.ts` (multiple files)
- **Admin Pages**: `/admin/hotel-management` (monolith)
- **Dependencies**: Booking (availability), Payments (commission), Notifications (hotel events), Analytics (metrics)

## Key Problems
1. **935-line admin page** — UI, business logic, and DB queries mixed
2. **Commission duplication** — 4x formula in lib/settings.ts, admin routes, hotel-auth.ts
3. **Tenancy logic scattered** — hotel-auth.ts, inline in routes
4. **No domain service** — business logic in API routes
5. **No events** — hotel state changes not published

## Extraction Plan

| Step | Task | Depends On | Effort | Status |
|------|------|-----------|--------|--------|
| 1 | Create domain package `packages/domains/hotels/` | — | 1 day | ⬜ |
| 2 | Extract entities (Hotel, Room, HotelManager, RoomBooking) | Step 1 | 2 days | ⬜ |
| 3 | Extract CommissionPolicy as single source of truth | Step 2 | 1 day | ⬜ |
| 4 | Extract TenancyPolicy | Step 3 | 1 day | ⬜ |
| 5 | Extract RoomAvailabilityPolicy | Step 3 | 1 day | ⬜ |
| 6 | Create HotelService, RoomService, CommissionService | Step 4 | 3 days | ⬜ |
| 7 | Extract repositories (HotelRepository, RoomRepository) | Step 6 | 2 days | ⬜ |
| 8 | Create domain events (hotel.*, room.*, commission.*) | Step 7 | 1 day | ⬜ |
| 9 | Refactor API routes (thin orchestrators) | Step 8 | 2 days | ⬜ |
| 10 | Refactor Admin page (consume API) | Step 9 | 2 days | ⬜ |
| 11 | Consolidate commission from lib/settings.ts | Step 10 | 1 day | ⬜ |
| 12 | Add tests | Step 11 | 2 days | ⬜ |
| 13 | Update documentation | Step 12 | 1 day | ⬜ |

**Total effort**: ~20 days

## Dependencies
- **Booking domain**: Room availability, hotel bookings
- **Payments domain**: Commission payments
- **Notifications domain**: Hotel events
- **Analytics domain**: Hotel metrics

## Risk Assessment
- **Risk 1**: Commission calculation changes break existing bookings → Mitigation: Historical bookings keep original rate
- **Risk 2**: Tenancy boundary violations during extraction → Mitigation: Feature flag + extensive testing
- **Risk 3**: Admin page regression during refactor → Mitigation: Keep old page until new one is verified

## Rollback Plan
- Feature flag: `use-hotel-domain`
- If extraction fails: Revert to inline logic
- Backup: Keep old admin page as `/admin/hotel-management-legacy`
