# DOMAIN_MODEL (Hotels)

## Entities

### Hotel
**Table**: `hotels`
**Aggregate Root**: Yes

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| name | TEXT | ✅ | Hotel display name |
| slug | TEXT | ✅ | URL-friendly identifier (unique) |
| description | TEXT | ❌ | Hotel description |
| address | TEXT | ✅ | Full address |
| lat | REAL | ✅ | Latitude |
| lng | REAL | ✅ | Longitude |
| phone | TEXT | ✅ | Contact phone |
| email | TEXT | ✅ | Contact email |
| website | TEXT | ❌ | Hotel website |
| photos | TEXT | ❌ | JSON array of photo URLs |
| stars | INTEGER | ✅ | Star rating (1-5) |
| status | TEXT | ✅ | HotelStatus enum |
| commission_rate | REAL | ✅ | Commission percentage |
| created_at | TEXT | ✅ | ISO timestamp |
| updated_at | TEXT | ✅ | ISO timestamp |

### Room
**Table**: `rooms`
**Aggregate Root**: No (belongs to Hotel)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| hotel_id | UUID | ✅ | FK → hotels.id |
| name | TEXT | ✅ | Room name |
| description | TEXT | ❌ | Room description |
| capacity | INTEGER | ✅ | Max guests |
| price_per_night | REAL | ✅ | Base price |
| amenities | TEXT | ❌ | JSON array of amenities |
| photos | TEXT | ❌ | JSON array of photo URLs |
| status | TEXT | ✅ | RoomStatus enum |
| created_at | TEXT | ✅ | ISO timestamp |
| updated_at | TEXT | ✅ | ISO timestamp |

### HotelManager
**Table**: `hotel_managers`
**Aggregate Root**: No (belongs to Hotel)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| hotel_id | UUID | ✅ | FK → hotels.id |
| user_id | TEXT | ✅ | Auth user ID |
| role | TEXT | ✅ | Manager role (owner, manager, staff) |
| created_at | TEXT | ✅ | ISO timestamp |

### RoomBooking
**Table**: `room_bookings`
**Aggregate Root**: No (cross-domain: Hotels + Booking)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| order_id | UUID | ✅ | FK → orders.id (Booking domain) |
| room_id | UUID | ✅ | FK → rooms.id |
| hotel_id | UUID | ✅ | FK → hotels.id |
| check_in | TEXT | ✅ | Check-in date |
| nights | INTEGER | ✅ | Number of nights |
| price_per_night | REAL | ✅ | Price at time of booking |
| total_amount | REAL | ✅ | Total amount |
| promotion_id | TEXT | ❌ | Applied promotion |
| discount_applied | REAL | ❌ | Discount amount |
| guest_name | TEXT | ✅ | Guest name |
| guest_email | TEXT | ✅ | Guest email |
| guest_phone | TEXT | ✅ | Guest phone |
| status | TEXT | ✅ | BookingStatus enum |
| created_at | TEXT | ✅ | ISO timestamp |
| updated_at | TEXT | ✅ | ISO timestamp |

## Value Objects

### HotelStatus
| Value | Description |
|-------|-------------|
| `active` | Hotel is live and accepting bookings |
| `inactive` | Hotel is temporarily disabled |
| `pending` | Hotel is being onboarded |
| `suspended` | Hotel is suspended (policy violation) |

### RoomStatus
| Value | Description |
|-------|-------------|
| `available` | Room is available for booking |
| `unavailable` | Room is not available |
| `maintenance` | Room is under maintenance |

### CommissionRate
| Property | Type | Validation |
|----------|------|------------|
| rate | REAL | 0.0 - 100.0 |
| type | string | 'percentage' or 'fixed' |

**Business Rule**: Commission = Booking Amount × (CommissionRate / 100)
**Single Source of Truth**: `packages/domains/_services/src/hotel.ts` (CommissionPolicy)

### TenancyScope
| Property | Type | Description |
|----------|------|-------------|
| hotelId | UUID | Tenant boundary |
| userId | UUID | User within tenant |

**Rule**: Users can only see data within their hotel scope.

## Aggregates

### Hotel (Aggregate Root)
**Root Entity**: Hotel
**Invariants**:
1. Commission rate must be between 0 and 100
2. Hotel slug must be unique
3. Hotel status transitions follow state machine
4. Tenancy isolation: users only see their hotel's data

| Command | Pre-conditions | State Change |
|---------|---------------|--------------|
| createHotel | Valid input, unique slug | status → pending |
| activateHotel | status = pending | status → active |
| deactivateHotel | status = active | status → inactive |
| suspendHotel | status = active | status → suspended |
| assignManager | valid user, hotel exists | manager added |
| updateCommission | valid rate | commission_rate updated |

## Relationships

```
Hotel ──1───* Room
Hotel ──1───* HotelManager
Hotel ──1───* RoomBooking
Room ──1───* RoomBooking
RoomBooking ──*───1 Order (Booking domain)
```
