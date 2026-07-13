# 1-business/ — Business Layer

## Core Purpose

The **Business Layer** (`1-business/`) contains the most stable, foundational specifications that define **WHAT** the system does. These are the immutable business rules and workflows that guide the entire platform.

### Strategic Objectives

1. **Clear Domain Boundaries**: Each business domain has well-defined responsibilities and is independent
2. **Immutable Business Rules**: Rules that define the platform operate consistently across all implementations
3. **Workflow Documentation**: Capture the end-to-end flows that the platform supports
4. **State Machine Definitions**: Explicit state transitions for core business concepts

### Layer Purpose and Responsibilities

**Business Layer is for:**

- **System Behavior**: What the platform actually does
- **Business Rules**: What the platform enforces
- **Workflows**: How business processes flow through the system
- **State Machines**: Valid state transitions for core entities

**Business Layer is NOT for:**

- **Technical Implementation**: How things are built
- **Architecture**: How components are organized
- **Development Rules**: How developers should code
- **Infrastructure**: How the system is deployed and operated

## Workflows

### Booking Workflow

**Flow:** Customer → Booking Validation → Dispatcher → Assignment → Driver Notification → Acceptance → Trip Creation → Completion → Payment

**Purpose:** Complete customer journey from initial booking request to final payment

**Key Steps:**

1. **Customer makes request** - Customer submits booking with pickup, dropoff, timing
2. **Booking validation** - System validates dates, capacity, pricing
3. **Dispatcher receives request** - Dispatcher reviews and assigns to driver
4. **Assignment creation** - System creates assignment with timer
5. **Driver notification** - Driver receives assignment via real-time alert
6. **Driver acceptance** - Driver accepts or rejects assignment
7. **Trip creation** - If accepted, trip is created with waypoints
8. **Trip completion** - Driver completes trip and records details
9. **Payment processing** - System calculates and processes payment

### Driver Onboarding Workflow

**Flow:** Registration → Profile Completion → Document Verification → Approval → Availability Setup

**Purpose:** Process new drivers from initial application to active service availability

**Key Steps:**

1. **Initial registration** - Driver enters phone number and basic information
2. **Phone verification** - OTP sent and verified via WhatsApp
3. **Profile completion** - Driver completes personal and vehicle information
4. **Document upload** - Driver uploads required compliance documents
5. **Admin review** - Admin verifies documents and approves driver
6. **Availability setup** - Driver configures availability preferences

### Assignment Workflow

**Flow:** Dispatcher Assignment → Driver Response → Trip Management → Completion

**Purpose:** Match drivers to bookings and manage assignment lifecycle

**Key Steps:**

1. **Dispatcher assigns** - Dispatcher reviews and assigns booking to driver
2. **Driver response** - Driver accepts, rejects, or expires assignment
3. **Trip management** - If accepted, manages trip status throughout journey
4. **Completion tracking** - Records trip completion and calculates earnings

### Notification Workflow

**Flow:** Event → Real-time Update → In-App/Notification/Email

**Purpose:** Keep all relevant parties informed of system events

**Key Steps:**

1. **Event generation** - Business rule violations or important changes occur
2. **Real-time broadcasting** - System broadcasts events to relevant users
3. **In-app notifications** - Users see updates in application UI
4. **Push notifications** - Mobile devices receive instant alerts
5. **Email notifications** - Detailed summaries sent via email

## State Machines

### Booking State Machine

```
Booking State Transitions:
PENDING → QUOTE (customer submits booking)
QUOTE → CONFIRMED (payment received)
CONFIRMED → SCHEDULED (dispatch assignment)
SCHEDULED → ON_THE_WAY (driver heads to pickup)
ON_THE_WAY → ARRIVED (driver at pickup)
ARRIVED → ONBOARD (passenger boarded)
ONBOARD → COMPLETED (trip finished)
* → CANCELLED (cancellation at any point)
```

### Assignment State Machine

```
Assignment State Transitions:
CREATED → PENDING (dispatcher creates assignment)
PENDING → ACCEPTED (driver accepts within timer)
PENDING → REJECTED (driver rejects)
PENDING → EXPIRED (timer reaches 00:00)
* → CANCELLED (dispatcher reassigns or cancels)
```

### Driver Availability State Machine

```
Driver Availability:
OFFLINE → AVAILABLE (driver enables availability)
AVAILABLE → OFFLINE (driver disables availability)
AVAILABLE → BUSY (driver accepts assignment)
BUSY → AVAILABLE (driver completes trip)
```

## Domain Specifications

### Drivers Domain

**Purpose:** Manage driver lifecycle from registration to active service

**Entities:**
- `Driver` — Core driver profile
- `Document` — Compliance documents (license, SOAT, insurance)
- `AvailabilityLog` — Audit trail for availability changes
- `Session` — Active device/session tracking
- `EventHistory` — Complete event audit log

**Business Rules:**
- Phone number is primary identifier (UNIQUE)
- Account must be APPROVED before service
- Documents must be complete and verified
- Terms and conditions must be accepted
- Only APPROVED + AVAILABLE drivers receive assignments

### Assignments Domain

**Purpose:** Match available drivers to pending bookings efficiently

**Entities:**
- `Assignment` — A dispatch attempt to match driver to booking
- `Queue` — Pending bookings awaiting assignment
- `MatchCriteria` — Driver matching rules and preferences

**Business Rules:**
- Only Available + Approved drivers appear in dispatch
- Assignment timer is configurable (default: 45 seconds)
- Smart matching considers VIP requirements, vehicle type, experience
- A booking can have multiple assignments (rejection/reassignment)

### Trips Domain

**Purpose:** Track the execution of an accepted assignment from start to finish

**Entities:**
- `Trip` — The executed journey
- `TripMilestone` — Status transitions with timestamps
- `TripEarning` — Financial record for the trip

**Business Rules:**
- One trip per accepted assignment (1:1)
- Each status transition records its timestamp
- Trip cannot be cancelled by driver once onboard
- COMPLETED triggers: earnings calculation, availability → available

### Vehicles Domain

**Purpose:** Manage the vehicle registry independently of driver ownership

**Entities:**
- `Vehicle` — Vehicle registry record
- `DriverVehicleAssignment` — N:M relationship between drivers and vehicles

**Business Rules:**
- Vehicles can be company-owned, shared, or rental
- Multiple drivers can use the same vehicle
- Each driver has one primary vehicle at a time
- Vehicle type determines service category eligibility

### Booking Domain

**Purpose:** Manage the complete lifecycle of a customer reservation

**Entities:**
- `Booking` — The core reservation record
- `BookingItem` — Individual service items within a booking
- `BookingNote` — Special instructions or notes

**Business Rules:**
- A booking cannot be created without valid pickup/dropoff
- Scheduled time must be at least 2 hours in the future
- Cancellation within 24 hours may incur a fee
- Bookings with return trips must have return date ≥ arrival date

### Payments Domain

**Purpose:** Manage earnings, commissions, payouts, and financial records

**Entities:**
- `Earning` — Driver earning per trip
- `Commission` — Platform commission rules
- `Payout` — Payment processing records

**Business Rules:**
- Net = gross - commission + bonuses + tips - deductions
- Currency defaults to COP
- Payment status tracks: pending → paid → failed
- Earnings are calculated on trip completion

### Cross-Domain Events

Domain communication through events:

#### Driver Events
- `driver:registered` — New driver self-registered
- `driver:claim_completed` — Existing driver claimed profile
- `driver:approved` — Admin approved driver
- `driver:suspended` — Admin suspended driver
- `driver:availability_changed` — Driver toggled availability

#### Assignment Events
- `assignment:new` — Driver matched to booking
- `assignment:accepted` — Driver accepted the assignment
- `assignment:rejected` — Driver rejected the assignment
- `assignment:expired` — Timer ran out, assignment voided
- `assignment:cancelled` — Dispatcher cancelled the assignment

#### Trip Events
- `trip:status_changed` — Trip status changed
- `trip:completed` — Trip completed
- `trip:cancelled` — Trip cancelled

## Directory Structure

```
1-business/\n├── WORKFLOWS/\n│   ├── booking.md\n│   ├── driver-onboarding.md\n│   ├── assignments.md\n│   └── notifications.md\n├── STATE_MACHINES/\n│   ├── booking.md\n│   ├── assignment.md\n│   └── driver-availability.md\n├── DOMAINS/\n│   ├── drivers.md\n│   ├── assignments.md\n│   ├── trips.md\n│   ├── vehicles.md\n│   ├── bookings.md\n│   └── payments.md\n└── SUMMARY.md\n```

## How to Use This Layer

### For Developers

1. **Business Logic Understanding**: Read the domain specifications to understand what the system does
2. **Workflow Analysis**: Follow the workflows to understand system flows
3. **State Validation**: Understand state transitions to validate business rules
4. **Cross-Domain Integration**: Review events and contracts across domains

### For Designers

1. **User Flows**: Map out user interactions following documented workflows\n2. **Visual Design**: Understand business constraints and requirements\n3. **Component Planning**: Design components aligned with business domains\n
### For Product Managers

1. **Product Strategy**: Understand business capabilities and limitations\n2. **Feature Planning**: Plan features based on defined workflows\n3. **Roadmapping**: Schedule development based on business dependencies\n
## Architecture Review

This layer is the foundation for all platform development. Every component and feature must respect the business specifications defined here. Changes to business rules require careful consideration of cross-domain impacts and must be thoroughly tested.

**Key Principles:**\n- **Business rules are immutable** — Core business logic never changes\n- **Domain boundaries are strict** — Clear separation between business concerns\n- **State transitions are defined** — Valid state changes are explicitly documented\n- **Workflows are documented** — End-to-end process flows are fully specified\n