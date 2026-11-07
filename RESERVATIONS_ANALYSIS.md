# Comprehensive Analysis: Reservations Page & Data Structure

Generated: 2026-05-21

## Executive Summary

The reservations system currently operates with a **dual data model**: 
- **Frontend-only Mock Data**: Defined in `lib/reservations-api.ts` and `lib/reservations-types.ts`
- **Database Orders Table**: Used by dispatch/admin system with partially overlapping fields

These need to be unified for the admin reservations functionality to work with real data.

---

## 1. CURRENT DATA MODEL

### 1.1 Frontend Type Definitions (`lib/reservations-types.ts`)

**Guest Interface:**
```typescript
interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country?: string
  language?: string
}
```

**Service Interface:**
```typescript
interface Service {
  id: string
  name: string
  description?: string
  includes?: string[]
}
```

**Reservation Interface:**
```typescript
interface Reservation {
  id: string
  guest: Guest
  service: Service
  arrivalDate: string (YYYY-MM-DD)
  arrivalTime?: string (HH:MM)
  flightInfo?: string
  status: ReservationStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  paymentMethod?: string
  transactionId?: string
  specialRequests?: string
  vipStatus: VIPStatus
  createdAt: string (ISO)
  updatedAt: string (ISO)
}
```

**Status Enums:**
- `ReservationStatus`: pending | confirmed | awaiting_payment | assigned | in_progress | completed | cancelled
- `PaymentStatus`: pending | paid | partial | refunded
- `VIPStatus`: none | silver | gold | platinum

### 1.2 Mock Data Structure (`lib/reservations-api.ts`)

**5 Mock Reservations with:**
- Diverse guest countries: Argentina, USA, Mexico, Colombia, Sweden
- Various services: Premium City Tour, Business Express, Guatapé Adventure, etc.
- Status distribution: confirmed, assigned, in_progress, pending, awaiting_payment
- Payment statuses: paid (3), pending (2)
- VIP tiers: gold (2), none (3)
- Transaction IDs for paid reservations
- Special requests tracked

**Missing from mock data but referenced in UI:**
- `selectedHotel` (shown in ReservationTable.tsx line 121)
- `customer_country` (used in dispatch system)
- Driver assignment metadata

---

## 2. DATABASE SCHEMA

### 2.1 Orders Table (Primary Table)

**From migration `013_fix_orders_assigned_fk.sql`:**

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  booking_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_country TEXT,
  
  -- Package/Service Info
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  -- Flight Info
  flight_number TEXT,
  airline TEXT,
  arrival_date TEXT,
  arrival_time TEXT,
  
  -- Destination/Location
  destination_address TEXT,
  destination_has_place INTEGER DEFAULT 1,
  additional_trips TEXT,
  
  -- Traveler Profile (JSON)
  traveler_profile TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  payment_status TEXT DEFAULT 'pending',
  dispatch_status TEXT DEFAULT 'pending',
  
  -- Driver Assignment (Dispatch Feature)
  assigned_to INTEGER,
  assigned_at TEXT,
  
  -- Payment
  payment_id INTEGER,
  
  -- Notes
  internal_notes TEXT,
  customer_notes TEXT,
  
  -- Audit Trail
  status_changed_at TEXT,
  status_changed_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.2 Drivers Table (Related to Reservations)

**From migration `010_drivers_table.sql`:**

```sql
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  email TEXT UNIQUE,
  vehicle TEXT NOT NULL,
  plate TEXT NOT NULL,
  category TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'available' (online|offline|away),
  rating REAL DEFAULT 5.0,
  languages TEXT DEFAULT 'Spanish',
  experience_level TEXT DEFAULT 'Standard',
  total_trips INTEGER DEFAULT 0,
  vip_compatible INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.3 Missing Fields in Database

The following fields exist in frontend Reservation type but NOT in orders table:
- `guest.id`
- `guest.language`
- `service.includes[]`
- `vipStatus` (needs mapping from priority/payment status)
- `specialRequests` (partially: customer_notes exists but not specific field)

---

## 3. CURRENT VISUALIZATIONS

### 3.1 ReservationKPIs Component

**Displays 6 KPI Cards:**
1. **Total Reservations** - Count of all reservations
2. **Pending** - Count with `status='pending'`
3. **Confirmed** - Count with `status='confirmed'`
4. **Awaiting Payment** - Count with `status='awaiting_payment'`
5. **Completed** - Count with `status='completed'`
6. **Cancelled** - Count with `status='cancelled'`

Each card shows:
- Current value (number)
- Percentage change vs. last month (mock calculation)
- Trend indicator (↑ up, ↓ down)

### 3.2 ReservationFilters Component

**Tab-based status filtering:**
- All
- Pending
- Confirmed
- Awaiting Payment
- Assigned
- In Progress
- Completed
- Cancelled

Each tab shows count badge. **Bug**: Component references undefined `reservations` variable (line 30).

### 3.3 ReservationTable Component

**Columns displayed:**
1. Guest (Avatar + Name)
2. Country (Flag emoji)
3. Package (Service name)
4. Arrival (Date + Time formatted)
5. Flight (Flight info)
6. Status (Colored badge)
7. Payment (Colored badge)
8. Hotel (References `selectedHotel` - **NOT in current data**)
9. VIP (Star badge if status != 'none')
10. Actions (View, WhatsApp, More)

**Issues:**
- `selectedHotel` field referenced but not in Reservation type
- No driver assignment display

### 3.4 ReservationTimeline Component

**Shows next 24 hours arrivals:**
- Sorted by arrival time
- Timeline items with:
  - Status-colored dot
  - Time + Status text
  - Guest name
  - Flight info + Service name
  - Status badge

### 3.5 ReservationDetailModal Component

**Displays comprehensive details:**

**Tourist Profile:**
- Avatar + Name, Email
- Phone, Country, Language, VIP Status

**Service Details:**
- Package name
- Included services
- Flight info
- Pickup location (references `selectedHotel`)
- Destination

**Payment Details:**
- Amount (formatted)
- Payment status (badge)
- Payment method
- Transaction ID

**Notes & Support:**
- Special requests
- Support/Admin timeline entries

**Actions:**
- Assign Driver (button)
- Send WhatsApp (button)
- Cancel Reservation (button)

---

## 4. ORDERS/DRIVERS RELATIONSHIP & DISPATCH SYSTEM

### 4.1 Orders → Drivers Relationship

**Fields in orders table:**
- `assigned_to` INTEGER - References `drivers.id`
- `assigned_at` TEXT - Timestamp of assignment
- `dispatch_status` TEXT - Values: pending | assigned | enroute | pickedup | completed

**Foreign Key:**
Not explicitly set in SQLite but intended to reference `drivers.id`

### 4.2 Driver Assignment Flow (from `/app/api/admin/dispatch/route.ts`)

**Assignment Process:**
1. POST to `/api/admin/dispatch` with action='assign'
2. Validates driver exists
3. Updates order:
   - `assigned_to = driverId`
   - `dispatch_status = 'assigned'`
   - `assigned_at = datetime('now')`
4. Updates driver:
   - `status = 'busy'`

**Unassignment Process:**
1. POST with action='unassign'
2. Sets `assigned_to = NULL`
3. Sets `dispatch_status = 'pending'`
4. Updates driver status to 'available'

### 4.3 Status Tracking

**Two parallel status fields:**

1. **`status`** (Order Status - Business):
   - new, pending, confirmed, completed, cancelled

2. **`dispatch_status`** (Dispatch Status - Operations):
   - pending, assigned, enroute, pickedup, completed

**Issue:** Reservation type uses `status` field but no mapping to `dispatch_status` exists.

### 4.4 Driver Assignment Confirmation

**Current Implementation:** No "pending confirmation" status exists.

**Process:** Assignment is immediate - no confirmation workflow implemented.

---

## 5. CURRENT STATE: WHAT EXISTS vs. WHAT'S MISSING

### ✅ WHAT EXISTS

**Frontend Type System:**
- ✅ Complete Reservation interface with nested Guest/Service
- ✅ Comprehensive status enums
- ✅ Mock data with 5 diverse examples
- ✅ All basic fields (dates, times, flight info, VIP status)

**UI Components:**
- ✅ All 5 major components built (KPIs, Filters, Table, Timeline, Modal)
- ✅ Responsive layout with proper styling
- ✅ Search and filter functionality
- ✅ Real-time polling (30-second intervals)
- ✅ Error handling and loading states

**Dispatch System:**
- ✅ Driver assignment API endpoints
- ✅ Driver table with full profile
- ✅ Dispatch status tracking
- ✅ Driver availability management

**Admin Infrastructure:**
- ✅ Layout and styling framework
- ✅ Admin authentication setup
- ✅ i18n integration

### ✗ WHAT'S MISSING

**Data Model Issues:**
- ✗ No `selectedHotel` field in Reservation type (referenced in UI but not defined)
- ✗ No direct connection between reservations and orders table
- ✗ No VIP status mapping in database
- ✗ No special requests field storage
- ✗ No language tracking for guests

**Database Schema Gaps:**
- ✗ No dedicated reservations table (using orders table instead)
- ✗ No explicit hotel/accommodation field
- ✗ No guest language field
- ✗ Missing guest.id mapping to customer records

**API Endpoints:**
- ✗ No `/api/admin/reservations` endpoint (currently uses mock data via `lib/reservations-api.ts`)
- ✗ No endpoint to fetch reservations from database
- ✗ No driver assignment endpoint for reservations
- ✗ No WhatsApp message endpoint

**Driver Assignment in Reservations:**
- ✗ No display of assigned driver in Reservation modal
- ✗ No driver confirmation workflow
- ✗ No way to show pending confirmation status
- ✗ No integration between reservation assignment and dispatch status

**Business Logic:**
- ✗ No payment confirmation flow between Stripe and reservation status
- ✗ No 15-day arrival enforcement in reservation context
- ✗ No way to track payment → reservation lifecycle
- ✗ No WhatsApp integration for reservation notifications

**UI Issues:**
- ✗ Bug in ReservationFilters: references undefined `reservations` variable
- ✗ Hotel column displays undefined data
- ✗ No actual driver assignment UI (button present but no implementation)
- ✗ No actual WhatsApp sending implementation

---

## 6. DATA FLOW ANALYSIS

### Current Flow (Mock Data):
```
Booking Form Submit
    ↓
[/api/booking] Creates order in database
    ↓
Order stored in SQLite orders table
    ↓
[Reservations Page] Calls fetchReservations()
    ↓
Returns MOCK data from lib/reservations-api.ts
    ↓
Displays in UI (ignores database data)
```

### Required Flow (Real Data):
```
Booking Form Submit
    ↓
[/api/booking] Creates order in database
    ↓
Order stored with all fields
    ↓
[Reservations Page] Calls /api/admin/reservations
    ↓
API queries orders table + JOIN drivers
    ↓
Transforms to Reservation type
    ↓
Displays in UI
    ↓
User Actions (assign driver, send message)
    ↓
Update orders table + dispatch system
```

---

## 7. FIELD MAPPING MATRIX

### Orders Table → Reservation Type Mapping

| Reservation Field | Source Table | Database Field | Notes |
|---|---|---|---|
| guest.id | customers(?) | missing | No customer table, derive from email |
| guest.firstName | orders | customer_name | Need to split name |
| guest.lastName | orders | customer_name | Need to split name |
| guest.email | orders | customer_email | ✅ Direct match |
| guest.phone | orders | customer_phone | ✅ Direct match |
| guest.country | orders | customer_country | ✅ Direct match |
| guest.language | - | missing | Need to add field |
| service.id | orders | package_id | ✅ Direct match |
| service.name | orders | package_name | ✅ Direct match |
| service.includes | - | missing | Need to add metadata |
| arrivalDate | orders | arrival_date | ✅ Direct match |
| arrivalTime | orders | arrival_time | ✅ Direct match |
| flightInfo | orders | flight_number + airline | Need to concatenate |
| status | orders | status | ✅ Direct match (but different values) |
| paymentStatus | orders | payment_status | ✅ Direct match |
| totalAmount | orders | package_price | ✅ Direct match (currency in cents) |
| paymentMethod | - | missing | Stored in payments table? |
| transactionId | - | missing | payment_id references payments(?) |
| specialRequests | orders | customer_notes | Partial match |
| vipStatus | - | derived | From priority field or order value |
| createdAt | orders | created_at | ✅ Direct match |
| updatedAt | orders | updated_at | ✅ Direct match |
| selectedHotel | - | destination_address | Partial match |

---

## 8. KEY ISSUES TO RESOLVE

### Issue #1: Missing `selectedHotel` Field
**Impact:** Table and modal show undefined
**Solution:** Map `destination_address` or create `selected_hotel` field in orders

### Issue #2: Dual Status Models
**Impact:** Confusion between order status and dispatch status
**Solution:** Define clear mapping or consolidate

### Issue #3: Name Splitting Required
**Impact:** database stores "Sofía Martínez", need firstName/lastName
**Solution:** Implement name parsing logic or split at insert time

### Issue #4: No Real API Endpoint
**Impact:** Admin page shows mock data, not real bookings
**Solution:** Create `/api/admin/reservations` endpoint

### Issue #5: Driver Assignment Incomplete
**Impact:** UI shows buttons but no backend integration
**Solution:** Implement driver assignment for reservations

### Issue #6: Bug in ReservationFilters
**Impact:** Component crashes or shows wrong counts
**Solution:** Fix undefined `reservations` reference

### Issue #7: No VIP Status in Database
**Impact:** Can't determine VIP eligibility from orders table
**Solution:** Create VIP determination logic or add field

### Issue #8: Missing Guest Language
**Impact:** Can't show language preferences to support team
**Solution:** Add guest_language field to orders table or link to customer profile

### Issue #9: No Payment Details
**Impact:** Can't display payment method/transaction ID
**Solution:** Create payments table or add fields to orders

### Issue #10: No Confirmation Status
**Impact:** Can't show pending driver confirmation
**Solution:** Add confirmation_status field to track workflow

---

## 9. DAILY METRICS REQUIREMENTS

### Metrics Currently Shown in KPIs:
1. Total Reservations (count)
2. Pending (count + % of total)
3. Confirmed (count + % vs last month)
4. Awaiting Payment (count + % vs last month)
5. Completed (count + % vs last month)
6. Cancelled (count)

### Missing Metrics:
- Revenue by date/country
- Reservations by country
- Reservations by package/service
- Driver assignment completion rate
- Payment conversion rate
- Average order value
- Cancellation rate
- Pending payment value

### Grouping Currently Missing:
- By date (already partially done - timeline shows 24h)
- By country
- By flight
- By package type
- By payment status
- By driver assignment status

---

## 10. SUMMARY & RECOMMENDATIONS

### High Priority:
1. Create `/api/admin/reservations` endpoint to fetch orders from database
2. Fix ReservationFilters component bug
3. Add `selectedHotel`/accommodation field mapping
4. Implement driver assignment backend

### Medium Priority:
5. Add guest language field
6. Create payment details link
7. Add VIP determination logic
8. Implement name parsing

### Low Priority:
9. Add advanced metrics/grouping
10. Add confirmation workflow status
11. Add historical data (last month comparison)

### Data Migration Needs:
- Split customer_name into firstName + lastName
- Add guest_language field
- Add selected_hotel field  
- Link to payments table for transaction details
- Create or update customer profiles

---

## File References

**Frontend:**
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/lib/reservations-types.ts` - Type definitions
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/lib/reservations-api.ts` - Mock data and API functions
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/page.tsx` - Main page (413 lines)
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/components/ReservationKPIs.tsx`
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/components/ReservationFilters.tsx` (has bug on line 30)
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/components/ReservationTable.tsx`
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/components/ReservationTimeline.tsx`
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/admin/reservations/components/ReservationDetailModal.tsx`

**Backend:**
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/api/booking/route.ts` - Booking creation
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/api/admin/orders/route.ts` - Orders queries
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/api/admin/dispatch/route.ts` - Driver assignment
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/app/api/admin/drivers/route.ts` - Driver management

**Database:**
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/lib/db/migrations/010_drivers_table.sql`
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/lib/db/migrations/011_dispatch_columns.sql`
- `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug/lib/db/migrations/013_fix_orders_assigned_fk.sql`

