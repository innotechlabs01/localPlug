# Data Model Reference: Reservations & Orders

Quick reference for understanding how reservations map to the database and frontend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  ADMIN RESERVATIONS PAGE                        │
│         app/admin/reservations/page.tsx (413 lines)             │
└─────────────────────────────────────────────────────────────────┘
         ↓ fetchReservations() ↓ (from lib/reservations-api.ts)
┌─────────────────────────────────────────────────────────────────┐
│             MOCK DATA (Currently Used)                          │
│  - 5 Example Reservations                                       │
│  - Returns hardcoded data, ignores database                     │
└─────────────────────────────────────────────────────────────────┘
         ↓ (Should call instead)
┌─────────────────────────────────────────────────────────────────┐
│            DATABASE (Not Yet Connected)                         │
│  orders table (SQLite)                                          │
│  ├─ Created by /api/booking                                    │
│  ├─ 37 columns including customer, flight, status, etc         │
│  └─ Joined with drivers table for assignments                  │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Data Model

### Type Hierarchy

```
Reservation
├── guest: Guest
│   ├── id: string
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── phone: string
│   ├── country?: string
│   └── language?: string
├── service: Service
│   ├── id: string
│   ├── name: string
│   ├── description?: string
│   └── includes?: string[]
├── arrivalDate: string (YYYY-MM-DD)
├── arrivalTime?: string (HH:MM)
├── flightInfo?: string
├── status: ReservationStatus
├── paymentStatus: PaymentStatus
├── totalAmount: number
├── paymentMethod?: string
├── transactionId?: string
├── specialRequests?: string
├── vipStatus: VIPStatus
├── createdAt: string (ISO)
└── updatedAt: string (ISO)

Status Values:
├── ReservationStatus: pending | confirmed | awaiting_payment | assigned | in_progress | completed | cancelled
├── PaymentStatus: pending | paid | partial | refunded
└── VIPStatus: none | silver | gold | platinum
```

## Database Schema

### orders Table (37 columns)

```
PRIMARY KEYS & REFERENCES
├── id (INTEGER PRIMARY KEY)
├── order_number (TEXT UNIQUE)
└── booking_reference (TEXT UNIQUE)

CUSTOMER INFORMATION
├── customer_name (TEXT NOT NULL) - "Sofía Martínez"
├── customer_email (TEXT NOT NULL)
├── customer_phone (TEXT)
└── customer_country (TEXT)

PACKAGE/SERVICE
├── package_id (TEXT NOT NULL)
├── package_name (TEXT NOT NULL)
├── package_price (INTEGER NOT NULL)
└── currency (TEXT DEFAULT 'usd')

FLIGHT INFORMATION
├── flight_number (TEXT)
├── airline (TEXT)
├── arrival_date (TEXT)
└── arrival_time (TEXT)

LOCATION/DESTINATION
├── destination_address (TEXT)
├── destination_has_place (INTEGER)
└── additional_trips (TEXT JSON)

TRAVELER INFO
└── traveler_profile (TEXT JSON) - Additional traveler data

STATUS TRACKING
├── status (TEXT DEFAULT 'new')         [Business Status]
├── priority (TEXT DEFAULT 'normal')    [VIP indicator]
├── payment_status (TEXT DEFAULT 'pending')
└── dispatch_status (TEXT DEFAULT 'pending') [Operations Status]

DRIVER ASSIGNMENT
├── assigned_to (INTEGER)               [FK to drivers.id]
└── assigned_at (TEXT)

PAYMENT TRACKING
└── payment_id (INTEGER)

NOTES & AUDIT
├── internal_notes (TEXT)
├── customer_notes (TEXT)
├── status_changed_at (TEXT)
├── status_changed_by (INTEGER)
├── created_at (TEXT DEFAULT now)
└── updated_at (TEXT DEFAULT now)
```

### drivers Table (12 columns)

```
PRIMARY KEY & CONTACT
├── id (INTEGER PRIMARY KEY)
├── name (TEXT NOT NULL)
├── phone (TEXT)
├── photo (TEXT)
└── email (TEXT UNIQUE)

VEHICLE INFORMATION
├── vehicle (TEXT NOT NULL)      - "Mercedes V-Class"
└── plate (TEXT NOT NULL)        - "MDE-782"

QUALIFICATIONS
├── category (TEXT DEFAULT 'standard')
├── languages (TEXT DEFAULT 'Spanish')
└── experience_level (TEXT DEFAULT 'Standard')

METRICS
├── status (TEXT DEFAULT 'available')  [available|busy|offline]
├── rating (REAL DEFAULT 5.0)
├── total_trips (INTEGER DEFAULT 0)
├── vip_compatible (INTEGER DEFAULT 0)
├── notes (TEXT)
├── created_at (TEXT DEFAULT now)
└── updated_at (TEXT DEFAULT now)
```

## Field Mapping: Orders → Reservation Type

### Direct Mapping (Copy-Paste)
```
orders.customer_email           → guest.email
orders.customer_phone           → guest.phone
orders.customer_country         → guest.country
orders.package_id               → service.id
orders.package_name             → service.name
orders.arrival_date             → arrivalDate
orders.arrival_time             → arrivalTime
orders.status                   → status
orders.payment_status           → paymentStatus
orders.package_price            → totalAmount
orders.created_at               → createdAt
orders.updated_at               → updatedAt
```

### Transform Required
```
orders.customer_name            → guest.firstName + guest.lastName
                                   (Need to split "Sofía Martínez")
orders.flight_number+airline    → flightInfo
                                   (Concatenate: "AV124 — Arriving 14:30")
orders.customer_notes           → specialRequests
                                   (Partial mapping)
orders.destination_address      → selectedHotel
                                   (Partial mapping)
```

### Missing / Derived
```
guest.id                        ← No mapping (derive from email or auto-generate)
guest.language                  ← Not stored (need to capture during booking)
service.includes[]              ← Not stored (need package metadata table)
paymentMethod                   ← Not stored (need payments table)
transactionId                   ← orders.payment_id (need to join with payments table)
vipStatus                       ← Derive from: orders.priority OR orders.package_price
```

## Current Component Usage

### ReservationKPIs.tsx
```
Receives: Reservation[]
Displays:
  - Total count
  - Count by status (pending, confirmed, awaiting_payment, etc)
  - Percentage change (mock calculation)
```

### ReservationFilters.tsx
```
Props: selectedFilter, onFilterChange
BUG: Line 30 references undefined 'reservations' variable
Fix: Should accept reservations as prop
```

### ReservationTable.tsx
```
Displays 10 columns:
  ✅ Guest name, Country, Package, Arrival date/time
  ✅ Flight, Status (badge), Payment (badge)
  ✗ Hotel → References undefined selectedHotel field
  ✅ VIP status (star), Actions
```

### ReservationTimeline.tsx
```
Shows: Next 24 hours arrivals
  - Sorted by time
  - Status-colored timeline dots
  - Guest name, flight, service
```

### ReservationDetailModal.tsx
```
Shows comprehensive details:
  ✅ Guest profile, Service details, Payment details
  ✅ Special requests, Support timeline
  ✗ No driver assignment display
  ✗ No driver confirmation UI
```

## Status Mapping

### Order Status (Business)
```
Database: orders.status
Values: new | pending | confirmed | completed | cancelled

Used for: Overall order fulfillment tracking
```

### Dispatch Status (Operations)
```
Database: orders.dispatch_status
Values: pending | assigned | enroute | pickedup | completed

Used for: Real-time delivery tracking
```

### Issue: Mismatch
- Reservation type uses "status" field
- No mapping between orders.status and orders.dispatch_status
- UI shows awaiting_payment, assigned, in_progress which don't map clearly to either

### Proposed Solution
```
Map orders.dispatch_status to reservation.status:
pending          → pending
assigned         → assigned
enroute          → in_progress
pickedup         → in_progress
completed        → completed
NULL + paid      → confirmed
NULL + pending   → awaiting_payment
```

## API Endpoints (Current vs Needed)

### Implemented
```
POST /api/booking
  → Creates order in database
  → Returns: { status, message, orderNumber }

GET /api/admin/orders
  → Queries orders table
  → Returns: order[]

PUT /api/admin/dispatch
  → Assigns driver to order
  → Updates: orders.assigned_to, orders.dispatch_status
  → Updates: drivers.status
```

### Mock (Needs Implementation)
```
GET /api/admin/reservations
  → Should query orders table
  → Should JOIN with drivers
  → Should transform to Reservation[]
  → Currently returns mock data

POST /api/admin/reservations/:id/assign-driver
  → Should update orders + drivers
  → Should send WhatsApp notification

POST /api/admin/reservations/:id/whatsapp
  → Should send WhatsApp to guest

DELETE /api/admin/reservations/:id
  → Should cancel reservation
```

## UI Issues

### Bug #1: ReservationFilters.tsx Line 30
```typescript
// Current (broken)
const filteredCounts = filters.map(filter => {
  if (filter.id === 'all') return { ...filter, count: reservationsCount }
  return {
    ...filter,
    count: reservations.filter(r => r.status === filter.id).length  // ← undefined
  }
})

// Fix
export default function ReservationFilters({ 
  selectedFilter,
  onFilterChange,
  reservationsCount,
  reservations  // ← Add this prop
}: ReservationFiltersProps & { reservations: Reservation[] }) {
```

### Bug #2: selectedHotel Field Missing
```typescript
// In ReservationTable.tsx line 121
// Current
<td>{reservation.selectedHotel || '—'}</td>

// Fix: Add to Reservation interface in reservations-types.ts
export interface Reservation {
  // ... existing fields
  selectedHotel?: string  // Add this line
}

// OR map from database
selectedHotel: order.destination_address
```

## Daily Metrics Dashboard

### Current KPIs (Shown)
- Total Reservations
- Pending (count)
- Confirmed (count)
- Awaiting Payment (count)
- Completed (count)
- Cancelled (count)

### Available from Database (Not Shown)
- Revenue (sum of package_price where payment_status='paid')
- Pending Revenue (sum where payment_status='pending')
- Reservations by country (GROUP BY customer_country)
- Reservations by package (GROUP BY package_name)
- Average order value (AVG(package_price))
- Conversion rate (paid / total * 100)
- Driver assignment rate (count(assigned_to) / total)

### Grouping Options
```sql
GROUP BY DATE(arrival_date)      -- Daily arrivals
GROUP BY customer_country        -- By origin country
GROUP BY package_name            -- By package/service
GROUP BY dispatch_status         -- By operation status
GROUP BY priority                -- By VIP tier
GROUP BY payment_status          -- By payment status
```

## Next Steps

### Phase 1: Data Connection (High Priority)
1. Create /api/admin/reservations endpoint
2. Fix ReservationFilters bug
3. Add selectedHotel to type definition
4. Implement database query with proper transformations

### Phase 2: Driver Assignment (High Priority)
1. Add driver info to modal
2. Implement assign driver endpoint
3. Connect to dispatch system
4. Add confirmation status tracking

### Phase 3: Enhanced Features (Medium Priority)
1. Add guest language field to database
2. Create payments table link
3. Add VIP determination logic
4. Implement WhatsApp notifications

### Phase 4: Metrics & Reporting (Low Priority)
1. Add daily metrics calculations
2. Add grouping options
3. Add export functionality
4. Add historical comparisons

