# Data Model: Admin Reservations Functionality

## Core Entities

### Reservation
Represents a booking made by a customer for a tour or service.

**Fields**:
- `id`: Unique identifier (UUID)
- `guest_id`: Foreign key to Guest entity
- `service_id`: Foreign key to Service entity
- `arrival_date`: Date of arrival (YYYY-MM-DD)
- `arrival_time`: Time of arrival (HH:MM)
- `flight_info`: Flight details (airline + flight number)
- `status`: Current reservation status (pending, confirmed, awaiting_payment, assigned, in_progress, completed, cancelled)
- `payment_status`: Payment status (pending, paid, partial, refunded)
- `total_amount`: Total cost in USD
- `payment_method`: Payment method used (last 4 digits of card)
- `transaction_id`: Payment transaction identifier
- `special_requests`: Any special requests or notes
- `vip_status`: VIP level (none, silver, gold, platinum)
- `created_at`: Timestamp when reservation was created
- `updated_at`: Timestamp when reservation was last updated

**Relationships**:
- Belongs to one Guest
- Belongs to one Service
- Has one Payment record (embedded as fields for simplicity)
- May have multiple Timeline entries

### Guest
Represents a customer making a reservation.

**Fields**:
- `id`: Unique identifier (UUID)
- `first_name`: Guest's first name
- `last_name`: Guest's last name
- `email`: Email address
- `phone`: Phone number with country code
- `country`: Country of origin
- `language`: Preferred language(s)
- `created_at`: Timestamp when guest record was created
- `updated_at`: Timestamp when guest record was last updated

**Relationships**:
- Can have multiple Reservations

### Service
Represents a tour or package that can be booked.

**Fields**:
- `id`: Unique identifier (UUID)
- `name`: Service/package name
- `description`: Detailed description of the service
- `duration_hours`: Estimated duration in hours
- `base_price`: Base price in USD
- `includes`: List of included services/amenities
- `add_ons`: Available optional add-ons with prices
- `is_active`: Whether the service is currently bookable
- `created_at`: Timestamp when service was created
- `updated_at`: Timestamp when service was last updated

**Relationships**:
- Can be booked by multiple Reservations (through Reservation.service_id)

### Payment
Represents financial transaction for a reservation (embedded in Reservation for simplicity).

**Fields** (embedded in Reservation):
- `status`: Payment status (pending, paid, partial, refunded)
- `amount`: Payment amount in USD
- `method`: Payment method (e.g., "Visa •••• 4242")
- `transaction_id`: Unique transaction identifier from payment processor
- `paid_at`: Timestamp when payment was completed

### TimelineEntry
Represents an upcoming arrival or service event for display in the timeline section.

**Fields**:
- `id`: Unique identifier (UUID)
- `reservation_id`: Foreign key to Reservation
- `event_time`: Date and time of the event
- `event_type`: Type of event (arrival, pickup, dropoff, activity_start, activity_end)
- `description`: Brief description of the event
- `status`: Current status of the event (pending, in_progress, completed, arrived)
- `location`: Location associated with the event (if applicable)
- `created_at`: Timestamp when timeline entry was created

**Relationships**:
- Belongs to one Reservation

## Validation Rules

### Reservation Validation
- `guest_id` must reference an existing Guest
- `service_id` must reference an existing Service
- `arrival_date` must be a valid date
- `status` must be one of: pending, confirmed, awaiting_payment, assigned, in_progress, completed, cancelled
- `payment_status` must be one of: pending, paid, partial, refunded
- `total_amount` must be a positive number
- If `payment_status` is 'paid' or 'partial', `transaction_id` must be present

### Guest Validation
- `email` must be a valid email format
- `phone` must be a valid phone number format
- At least one of `first_name` or `last_name` must be present

### Service Validation
- `name` must be present and not empty
- `base_price` must be a positive number
- `duration_hours` must be a positive number

## Database Schema Notes

Following the project's use of Turso (libSQL) with raw SQL migrations, the tables would be created with SQL similar to:

```sql
CREATE TABLE guests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT,
  language TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  base_price REAL NOT NULL CHECK (base_price > 0),
  includes TEXT, -- JSON array
  add_ons TEXT, -- JSON array
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  arrival_date DATE NOT NULL,
  arrival_time TIME,
  flight_info TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'awaiting_payment', 'assigned', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  total_amount REAL NOT NULL CHECK (total_amount > 0),
  payment_method TEXT,
  transaction_id TEXT,
  special_requests TEXT,
  vip_status TEXT DEFAULT 'none',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timeline_entries (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  event_time DATETIME NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'arrived')),
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Data Transfer Objects

For communication between frontend and backend, the following DTOs would be used:

### ReservationDTO
```typescript
{
  id: string;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country?: string;
    language?: string;
  };
  service: {
    id: string;
    name: string;
    description?: string;
  };
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime?: string; // HH:MM
  flightInfo?: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paymentMethod?: string;
  transactionId?: string;
  specialRequests?: string;
  vipStatus?: VIPStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### GuestDTO
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ServiceDTO
```typescript
{
  id: string;
  name: string;
  description?: string;
  durationHours: number;
  basePrice: number;
  includes?: string[];
  addOns?: Array<{ name: string; price: number }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Enums

### ReservationStatus
- `pending` - Initial state, awaiting initial confirmation
- `confirmed` - Reservation confirmed, awaiting payment or assignment
- `awaiting_payment` - Confirmed but payment not yet received
- `assigned` - Driver/guide assigned, service not yet started
- `in_progress` - Service currently being delivered
- `completed` - Service finished successfully
- `cancelled` - Reservation cancelled by customer or admin

### PaymentStatus
- `pending` - Payment not yet attempted
- `paid` - Payment successfully completed
- `partial` - Partial payment received
- `refunded` - Payment refunded to customer

### VIPStatus
- `none` - No VIP status
- `silver` - Silver level VIP
- `gold` - Gold level VIP
- `platinum` - Platinum level VIP

### TimelineEventType
- `arrival` - Guest arrival at pickup location
- `pickup` - Guest picked up by transportation
- `dropoff` - Guest dropped off at destination
- `activity_start` - Tour/activity begins
- `activity_end` - Tour/activity ends
- `meal` - Scheduled meal time
- `break` - Scheduled break time
