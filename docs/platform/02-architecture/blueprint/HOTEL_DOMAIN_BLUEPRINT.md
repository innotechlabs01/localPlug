# HOTEL_DOMAIN_BLUEPRINT

> Blueprint for extracting Hotels from Admin into a proper Business Domain.
> Follows the same pattern as Driver Domain extraction (B15).

---

## Current State

Hotels is the largest capability still fully embedded in Admin.

```
Admin (monolith)
├── app/api/admin/hotels/         ← 8 route files, ~930 lines
├── app/api/admin/rooms/          ← CRUD
├── app/api/admin/promotions/     ← CRUD
├── app/api/admin/hotels/stats/   ← Dashboard stats
├── app/admin/hotels/page.tsx     ← 935-line admin page
├── lib/admin/hotel-auth.ts       ← Tenancy boundary
├── lib/n8n/client.ts             ← Manager creation notification
└── lib/settings.ts               ← Commission config
```

**No domain package exists.** All logic lives in Admin routes.

---

## Database Schema

### Tables (4)

| Table | Columns | Records (est.) |
|-------|---------|----------------|
| `hotels` | id, name, slug, description, address, lat, lng, phone, email, website, photos, stars, status, commission_rate, timestamps | ~10-50 |
| `rooms` | id, hotel_id (FK), name, description, capacity, price_per_night, amenities, photos, status, timestamps | ~50-200 |
| `promotions` | id, hotel_id (FK), type, code, discount_amount, is_active, usage_limit, usage_count, starts_at, ends_at, timestamps | ~20-100 |
| `room_bookings` | id, order_id, room_id (FK), hotel_id (FK), check_in, nights, price_per_night, total_amount, promotion_id, discount_applied, guest_name, guest_email, guest_phone, status, timestamps | ~100-500 |

### Relationships

```
hotels 1───* rooms
hotels 1───* promotions
hotels 1───* room_bookings
rooms 1───* room_bookings
promotions 1───* room_bookings
users *───1 hotels (hotel_id FK on users)
orders *───1 hotels (hotel_id FK on orders)
experience_bookings *───1 hotels (hotel_id FK)
```

---

## Ownership Matrix

### Hotel Domain Owns

| Entity | Table | Responsibility |
|--------|-------|---------------|
| Hotel | `hotels` | CRUD, status, commission rate, manager assignment |
| Room | `rooms` | CRUD, pricing, availability, amenities |
| Promotion | `promotions` | CRUD, code validation, usage tracking, date windows |
| RoomBooking | `room_bookings` | Reservation lifecycle, guest management |
| HotelManager | `users.hotel_id` | Manager-hotel assignment, tenancy boundary |

### Other Domains Reference (NOT Own)

| Domain | Reference | How |
|--------|-----------|-----|
| Booking | `hotelId` on `orders` | FK reference only. Booking says "which hotel", not "hotel details" |
| Experience | `hotelId` on `experience_bookings` | FK reference only |
| Payment | `hotel_payout_cents` | Calculated from commission rate. Payment asks Hotel for rate, doesn't own it |
| Dispatch | Hotel name in search | Read-only reference for display |

---

## Domain Package Structure

```
packages/domains/hotels/
├── src/
│   ├── entities/
│   │   ├── hotel.ts              ← Hotel aggregate root
│   │   ├── room.ts               ← Room entity
│   │   ├── promotion.ts          ← Promotion entity
│   │   ├── room-booking.ts       ← RoomBooking entity
│   │   └── index.ts
│   ├── services/
│   │   ├── hotel-service.ts      ← Hotel CRUD + business logic
│   │   ├── room-service.ts       ← Room management
│   │   ├── promotion-service.ts  ← Promotion validation + CRUD
│   │   ├── booking-service.ts    ← Room reservation logic
│   │   └── index.ts
│   ├── repositories/
│   │   ├── hotel-repository.ts   ← Hotel persistence
│   │   ├── room-repository.ts    ← Room persistence
│   │   ├── promotion-repository.ts
│   │   ├── room-booking-repository.ts
│   │   └── index.ts
│   ├── policies/
│   │   ├── commission.ts         ← Commission calculation (single source of truth)
│   │   ├── pricing.ts            ← Room pricing with commission
│   │   ├── availability.ts       ← Room availability rules
│   │   └── index.ts
│   ├── events/
│   │   ├── hotel-created.ts
│   │   ├── hotel-updated.ts
│   │   ├── manager-assigned.ts
│   │   ├── room-updated.ts
│   │   ├── promotion-created.ts
│   │   ├── room-booked.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── hotel.ts              ← Hotel DTOs, filters, inputs
│   │   ├── room.ts
│   │   ├── promotion.ts
│   │   └── index.ts
│   ├── validation/
│   │   ├── hotel.ts              ← Zod schemas for hotel operations
│   │   ├── room.ts
│   │   ├── promotion.ts
│   │   └── index.ts
│   ├── mappers/
│   │   ├── hotel-mapper.ts       ← DB ↔ Domain mapping
│   │   ├── room-mapper.ts
│   │   ├── promotion-mapper.ts
│   │   └── index.ts
│   └── index.ts                  ← Barrel exports
├── package.json
└── tsconfig.json
```

---

## Domain Policies

### Commission Policy (CRITICAL)

**Problem**: Commission formula is duplicated in 4 locations:
1. `app/api/admin/hotels/route.ts` (POST) — uses `commissionRate` from body
2. `app/api/admin/rooms/route.ts` — computes `display_price = basePrice + (basePrice * commissionRate)`
3. `app/api/admin/hotels/stats/route.ts` — uses `rate/(1+rate)` formula
4. `app/api/webhooks/paddle/route.ts` — uses configurable fee rate

**Solution**: Single `CommissionPolicy` in the domain:

```typescript
// packages/domains/hotels/src/policies/commission.ts
export class CommissionPolicy {
  static calculateDisplayPrice(basePrice: number, commissionRate: number): number {
    return basePrice + (basePrice * commissionRate)
  }

  static calculateHotelPayout(totalAmount: number, commissionRate: number): number {
    return Math.round(totalAmount * (1 - commissionRate))
  }

  static calculatePlatformFee(totalAmount: number, commissionRate: number): number {
    return Math.round(totalAmount * commissionRate)
  }

  static calculateSplit(totalAmount: number, commissionRate: number) {
    const platformFee = this.calculatePlatformFee(totalAmount, commissionRate)
    const hotelPayout = this.calculateHotelPayout(totalAmount, commissionRate)
    return { platformFee, hotelPayout }
  }
}
```

### Pricing Policy

```typescript
export class PricingPolicy {
  static calculateRoomPrice(basePrice: number, commissionRate: number, promotion?: Promotion) {
    let price = CommissionPolicy.calculateDisplayPrice(basePrice, commissionRate)
    if (promotion) {
      price = this.applyPromotion(price, promotion)
    }
    return price
  }

  static applyPromotion(price: number, promotion: Promotion): number {
    if (promotion.type === 'percentage') {
      return price * (1 - promotion.discountAmount / 100)
    }
    return price - promotion.discountAmount
  }
}
```

### Availability Policy

```typescript
export class AvailabilityPolicy {
  static isAvailable(room: Room, checkIn: Date, checkOut: Date, existingBookings: RoomBooking[]): boolean {
    return !existingBookings.some(b =>
      b.status !== 'cancelled' &&
      b.checkIn < checkOut &&
      (b.checkOut ?? b.checkIn) > checkIn
    )
  }
}
```

---

## Domain Events

| Event | Producer | Payload | Consumers |
|-------|----------|---------|-----------|
| `hotel.created` | HotelService | hotelId, name, slug | Notifications, Analytics |
| `hotel.updated` | HotelService | hotelId, changes | Analytics |
| `hotel.manager.assigned` | HotelService | hotelId, managerId | Notifications (WhatsApp welcome) |
| `room.created` | RoomService | roomId, hotelId | Analytics |
| `room.updated` | RoomService | roomId, changes | Analytics |
| `promotion.created` | PromotionService | promotionId, hotelId | Notifications |
| `room.booked` | BookingService | bookingId, roomId, hotelId | Payments, Notifications |

---

## API Routes (After Extraction)

| Route | Current Location | New Location | Change |
|-------|-----------------|--------------|--------|
| `GET /api/hotels` | `app/api/hotels/route.ts` | Stay (public) | Use HotelService |
| `GET/POST/PUT/DELETE /api/admin/hotels` | `app/api/admin/hotels/route.ts` | Stay (thin orchestrator) | Delegate to HotelService |
| `GET /api/admin/hotels/stats` | `app/api/admin/hotels/stats/route.ts` | Stay (thin orchestrator) | Delegate to HotelService |
| `GET/POST/PUT/DELETE /api/admin/rooms` | `app/api/admin/rooms/route.ts` | Stay (thin orchestrator) | Delegate to RoomService |
| `GET/POST/PUT/DELETE /api/admin/promotions` | `app/api/admin/promotions/route.ts` | Stay (thin orchestrator) | Delegate to PromotionService |
| `GET /api/promotions/validate` | `app/api/promotions/validate/route.ts` | Stay (public) | Use PromotionService |
| `PUT /api/admin/users/hotel-assign` | `app/api/admin/users/hotel-assign/route.ts` | Stay (thin orchestrator) | Delegate to HotelService |

---

## Manager Provisioning (Current → New)

**Current** (inline in API route):
```typescript
// app/api/admin/hotels/route.ts POST
const clerkUser = await clerkClient.users.createUser({ ... })
await db.insert(users).values({ clerkId: clerkUser.id, role: 'hotel_manager', hotelId })
await triggerManagerCreated({ manager: {...}, hotel: {...} })
```

**New** (domain service):
```typescript
// packages/domains/hotels/src/services/hotel-service.ts
async createHotel(input: CreateHotelInput): Promise<Result<Hotel>> {
  const hotel = await this.hotelRepo.create(input)
  const manager = await this.provisionManager(input.managerEmail, hotel.id)
  await this.eventBus.publish(new HotelCreatedEvent(hotel))
  await this.eventBus.publish(new ManagerAssignedEvent(hotel.id, manager.id))
  return ok(hotel)
}
```

---

## Migration Steps

### Step 1: Extract Domain Package
- Create `packages/domains/hotels/` with entities, services, repositories
- Implement CommissionPolicy (single source of truth)
- Add validation schemas to `packages/validation/src/hotel/`
- Add types to `packages/types/src/domain/`

### Step 2: Wire Admin Routes to Domain
- Replace inline DB queries with HotelService calls
- Replace commission formula duplication with CommissionPolicy
- Replace inline manager provisioning with HotelService.createHotel()

### Step 3: Add Events
- Publish domain events for hotel lifecycle
- Wire notification handlers for manager creation

### Step 4: Clean Up
- Remove `lib/admin/hotel-auth.ts` → move to domain tenancy
- Remove `lib/settings.ts` hotel config → move to domain config
- Update booking step to use HotelService for hotel data

### Step 5: Hotel Portal (Future)
- Create `apps/hotel-portal/`
- Manager self-service: view bookings, manage rooms, view revenue
- Same pattern as Driver Portal

---

## Dependencies

| Dependency | Direction | Notes |
|-----------|-----------|-------|
| Booking → Hotels | Booking references `hotelId` | FK only, no business logic |
| Payment → Hotels | Payment reads `commissionRate` | For split calculation |
| Dispatch → Hotels | Search displays hotel name | Read-only reference |
| Notifications → Hotels | Manager creation notification | Event-driven |

---

## Estimated Effort

| Task | Lines | Complexity |
|------|-------|------------|
| Domain entities + services | ~500 | Medium |
| Repository implementations | ~300 | Medium |
| CommissionPolicy | ~50 | Low |
| Validation schemas | ~100 | Low |
| Types | ~80 | Low |
| Admin route refactoring | ~400 | Medium |
| Event handlers | ~100 | Low |
| Tests | ~300 | Medium |
| **Total** | **~1,830** | **Medium** |

Comparable to Driver Domain extraction (B15).
