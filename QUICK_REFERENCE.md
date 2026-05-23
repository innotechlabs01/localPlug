# Reservations System - Quick Reference Card

## What Exists vs What's Missing

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Reservation Type | ✅ Complete | `lib/reservations-types.ts` | Guest, Service nested objects |
| Mock Data | ✅ Complete | `lib/reservations-api.ts` | 5 examples, all statuses |
| KPIs UI | ✅ Functional | `app/admin/reservations/components/ReservationKPIs.tsx` | Needs real data |
| Filters UI | ✅ Has Bug | `app/admin/reservations/components/ReservationFilters.tsx` | Line 30: undefined var |
| Table UI | ✅ Has Bug | `app/admin/reservations/components/ReservationTable.tsx` | Missing selectedHotel field |
| Timeline UI | ✅ Functional | `app/admin/reservations/components/ReservationTimeline.tsx` | Works with mock data |
| Modal UI | ✅ Partial | `app/admin/reservations/components/ReservationDetailModal.tsx` | Buttons no handlers |
| API Endpoint | ❌ Missing | Need: `app/api/admin/reservations/route.ts` | CRITICAL for real data |
| Orders Table | ✅ Complete | `lib/db/migrations/013_fix_orders_assigned_fk.sql` | 37 columns, real data |
| Drivers Table | ✅ Complete | `lib/db/migrations/010_drivers_table.sql` | 12 columns, assignments |
| Driver Assignment | 🟡 Partial | `app/api/admin/dispatch/route.ts` | API exists, UI not wired |

## The Critical Gap

```
CURRENT STATE:
┌─────────────────────┐     ┌──────────────────────────┐
│   Admin Page (UI)   │────→│  Mock Data (Frontend)    │
│  (shows mock data)  │     │  5 hardcoded examples    │
└─────────────────────┘     └──────────────────────────┘
                                       
                            ❌ DATABASE (IGNORED!)
                            ┌──────────────────────────┐
                            │  Orders Table (Backend)  │
                            │  Real bookings (ignored) │
                            └──────────────────────────┘

NEEDED STATE:
┌─────────────────────┐     ┌──────────────────────────┐
│   Admin Page (UI)   │────→│  /api/admin/reservations │
│  (shows real data)  │     │  Transforms orders table │
└─────────────────────┘     └──────────────────────────┘
                                    ↓
                            ┌──────────────────────────┐
                            │  Orders Table (Backend)  │
                            │  Real bookings (active)  │
                            └──────────────────────────┘
```

## Bugs to Fix

### Bug #1: ReservationFilters.tsx (Line 30)
```typescript
// BROKEN: 'reservations' is undefined
count: reservations.filter(r => r.status === filter.id).length

// FIX: Add to component props and use it
```
**Time to Fix:** 15 minutes

### Bug #2: ReservationTable.tsx (Column 8)
```typescript
// BROKEN: selectedHotel field doesn't exist
<td>{reservation.selectedHotel || '—'}</td>

// FIX: Add field to Reservation interface in reservations-types.ts
selectedHotel?: string
```
**Time to Fix:** 30 minutes

## Field Mapping Reference

### Direct Copy (No Transform)
```
orders.customer_email        → guest.email
orders.customer_phone        → guest.phone
orders.customer_country      → guest.country
orders.arrival_date          → arrivalDate
orders.arrival_time          → arrivalTime
orders.package_price         → totalAmount
orders.payment_status        → paymentStatus
```

### Needs Transform
```
orders.customer_name         → Split into firstName + lastName
orders.flight_number+airline → Concat into flightInfo ("AV124 — 14:30")
orders.destination_address   → Map to selectedHotel
```

### Missing (Needs Addition or Derivation)
```
guest.language              ← Not stored (add to booking form)
vipStatus                   ← Derive from priority or order value
selectedHotel               ← Add to Reservation interface
service.includes[]          ← Need package metadata table
paymentMethod               ← Need payments table
transactionId               ← Join with payments table
```

## Next Steps (By Priority)

### 🔴 Critical (Do First)
1. Create `/api/admin/reservations` endpoint (2-3 hours)
2. Fix ReservationFilters bug (15 min)
3. Add selectedHotel field (30 min)
4. Update page to use real API (1 hour)

### 🟠 High (Do Soon)
5. Wire up assign driver button (2 hours)
6. Create `/api/admin/reservations/:id/assign` endpoint (1.5 hours)
7. Show driver options in modal (1 hour)

### 🟡 Medium (Nice to Have)
8. Add guest language field
9. Create payment details link
10. Add VIP determination logic

## Key SQL Queries

### Get all reservations
```sql
SELECT o.*, d.name as driver_name, d.vehicle as driver_vehicle
FROM orders o
LEFT JOIN drivers d ON o.assigned_to = d.id
WHERE 1=1
ORDER BY o.created_at DESC
```

### Count by status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM orders
GROUP BY status
```

### Get assigned orders for driver
```sql
SELECT * FROM orders
WHERE assigned_to = ? AND dispatch_status IN ('assigned', 'enroute')
```

## API Endpoints Needed

### GET /api/admin/reservations
```javascript
Query params: ?filter=pending&search=sofia&country=argentina
Response: 
{
  reservations: Reservation[],
  total: number,
  counts: { pending: X, confirmed: Y, ... }
}
```

### POST /api/admin/reservations/:id/assign
```javascript
Body: { driverId: number }
Response: { success: boolean }
```

### POST /api/admin/reservations/:id/whatsapp
```javascript
Response: { success: boolean, messageId: string }
```

## Database Schema Quick View

### Orders (37 columns)
- **Customer**: name, email, phone, country
- **Service**: package_id, package_name, package_price
- **Flight**: flight_number, airline, arrival_date, arrival_time
- **Location**: destination_address, destination_has_place, additional_trips
- **Status**: status (business), dispatch_status (ops), payment_status
- **Assignment**: assigned_to (driver ID), assigned_at
- **Notes**: customer_notes, internal_notes, traveler_profile (JSON)

### Drivers (12 columns)
- **Profile**: name, phone, email, photo
- **Vehicle**: vehicle, plate
- **Qualifications**: category, languages, experience_level
- **Metrics**: status, rating, total_trips, vip_compatible

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Page shows mock data | No API endpoint | Create `/api/admin/reservations` |
| Filter counts wrong | Undefined variable | Add reservations prop |
| Hotel column shows undefined | Field missing | Add to Reservation type |
| Can't assign driver | No button handler | Wire up onClick + API call |
| Can't send WhatsApp | No endpoint | Create `/api/.../whatsapp` |
| Can't split name | No parser | Create name-parser utility |

## File Structure for New Code

```
app/
├── api/
│   └── admin/
│       └── reservations/           ← NEW
│           ├── route.ts            ← GET endpoint
│           └── [id]/
│               ├── assign/
│               │   └── route.ts    ← POST assign driver
│               ├── whatsapp/
│               │   └── route.ts    ← POST send message
│               └── cancel/
│                   └── route.ts    ← DELETE cancel

lib/
└── reservations/                   ← NEW
    ├── transformers.ts             ← order → Reservation
    ├── queries.ts                  ← database queries
    └── name-parser.ts              ← split name logic
```

## Testing Strategy

### Quick Test (5 minutes)
1. Add mock endpoint that returns hardcoded Reservation[]
2. Verify UI displays it correctly
3. Check filter counts update

### Real Test (When API done)
1. Create booking through form
2. Check orders table has data
3. Navigate to reservations page
4. Verify data appears
5. Test filter/search
6. Click assign driver
7. Verify driver updated

---

**For Complete Details:** See RESERVATIONS_ANALYSIS.md and RESERVATIONS_DATA_MAP.md
