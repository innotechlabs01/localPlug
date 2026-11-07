# POLICIES (Hotels)

## Policy: CommissionPolicy (Single Source of Truth)

**Description**: Hotel commission calculation for revenue sharing.
**Trigger**: When a booking involving a hotel is confirmed or completed.
**Rule**: Commission = Booking Amount × (Commission Rate / 100)

### Business Rules
1. Commission rate is set per hotel (0-100%)
2. Commission is calculated at booking confirmation time
3. Commission is paid to hotel after trip completion
4. Commission changes apply to future bookings only
5. Historical bookings retain their original commission rate

### Implementation
```typescript
// packages/domains/hotels/src/policies/commission.ts
export class CommissionPolicy {
  calculate(bookingAmount: number, commissionRate: number): number {
    return bookingAmount * (commissionRate / 100)
  }
}
```

### Single Source of Truth
The 4x formula duplication in:
- `lib/settings.ts` (line ~180)
- `app/api/admin/hotels/*/route.ts`
- `lib/hotel-commission.ts`

Must be consolidated into `CommissionPolicy`.

---

## Policy: TenancyPolicy

**Description**: Hotel data isolation. Users only see their hotel's data.
**Trigger**: Every read/write operation on hotel data.
**Rule**: Filter by hotel_id from user's session.

### Business Rules
1. Admin users see all hotels
2. Hotel managers see only their hotel
3. Staff users see only their hotel
4. Customer users see only active hotels
5. Data never leaks across tenancy boundaries

### Implementation
```typescript
// packages/domains/hotels/src/policies/tenancy.ts
export class TenancyPolicy {
  apply(userId: string, userRole: string, query: HotelQuery): HotelQuery {
    if (userRole === 'admin') return query // no filter
    return { ...query, hotelId: userHotelId }
  }
}
```

---

## Policy: RoomAvailabilityPolicy

**Description**: Room availability management for bookings.
**Trigger**: When a booking is created or cancelled.
**Rule**: Room cannot be double-booked for overlapping dates.

### Business Rules
1. Room is marked unavailable when booking is confirmed
2. Room is restored when booking is cancelled
3. Room can be set to maintenance by hotel manager
4. Overlapping date check is mandatory
5. Price is locked at booking time (not room's current price)

### Implementation
```typescript
// packages/domains/hotels/src/policies/availability.ts
export class RoomAvailabilityPolicy {
  canBook(room: Room, checkIn: string, nights: number): boolean {
    // Check room status is 'available'
    // Check no overlapping bookings
    // Check check-in is not in the past
  }
}
```

---

## Policy: ManagerAssignmentPolicy

**Description**: Rules for assigning hotel managers.
**Trigger**: When a manager is assigned to a hotel.
**Rule**: Only one owner per hotel, multiple managers allowed.

### Business Rules
1. A hotel must have exactly one owner
2. A hotel can have multiple managers
3. A hotel can have multiple staff
4. A user can be manager of multiple hotels
5. Owner assignment requires admin role

---

## Policy: HotelOnboardingPolicy

**Description**: New hotel onboarding workflow.
**Trigger**: When a new hotel is created.
**Rule**: Hotel goes through onboarding steps before becoming active.

### Business Rules
1. Hotel starts in 'pending' status
2. Profile must be complete (name, address, contact, photos)
3. At least one room must be created
4. Commission rate must be set
5. Manager must be assigned
6. Only then can hotel be activated

### Onboarding Steps
1. Create hotel profile → status: pending
2. Add rooms → at least one required
3. Set commission rate → required
4. Assign manager → required
5. Activate hotel → status: active
