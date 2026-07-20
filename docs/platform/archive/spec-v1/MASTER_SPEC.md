# LOCALPLUG — Master Specification

**Version:** 1.0.0
**Date:** 2026-07-11
**Status:** Active — The Constitution of LocalPlug

---

> **You are the Permanent Chief Software Architect of LocalPlug.**
>
> You are responsible for every architectural decision across the entire platform.
>
> Your mission is not only to build software.
> Your mission is to design a platform capable of evolving for the next decade.
>
> Every recommendation must maximize:
> - Scalability
> - Maintainability
> - Readability
> - Performance
> - Developer Experience
> - Business Evolution
>
> Never optimize only for the current feature.
> Always optimize for the platform.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Product Philosophy](#2-product-philosophy)
3. [Architecture Constitution](#3-architecture-constitution)
4. [Engineering Principles](#4-engineering-principles)
5. [Domain-Driven Design](#5-domain-driven-design)
6. [Folder Organization](#6-folder-organization)
7. [Business Domains](#7-business-domains)
8. [Application Layer](#8-application-layer)
9. [Platform Services](#9-platform-services)
10. [Shared Packages](#10-shared-packages)
11. [UI Design System](#11-ui-design-system)
12. [Database Architecture](#12-database-architecture)
13. [Event-Driven Architecture](#13-event-driven-architecture)
14. [Authentication](#14-authentication)
15. [Authorization](#15-authorization)
16. [API Standards](#16-api-standards)
17. [Coding Standards](#17-coding-standards)
18. [Git Standards](#18-git-standards)
19. [Naming Conventions](#19-naming-conventions)
20. [Realtime Architecture](#20-realtime-architecture)
21. [Infrastructure](#21-infrastructure)
22. [Security](#22-security)
23. [Performance](#23-performance)
24. [Scalability](#24-scalability)
25. [Testing](#25-testing)
26. [Deployment](#26-deployment)
27. [Documentation](#27-documentation)
28. [AI Development Rules](#28-ai-development-rules)
29. [Migration Strategy](#29-migration-strategy)
30. [Future Vision](#30-future-vision)

---

## 1. Product Vision

### 1.1 What is LocalPlug?

LocalPlug is a **Business Operating System** for premium airport transfers and tourism concierge services in Medellín, Colombia.

It is not a collection of pages.
It is not a CRUD application.
It is not an Admin Dashboard.

LocalPlug connects three entities:
- **Travelers** seeking premium airport transfers and curated experiences
- **Drivers** providing transportation services
- **Dispatchers** managing operations in real-time

### 1.2 Platform Architecture

```
                    LocalPlug Platform

                           │

        ┌──────────────────┼──────────────────┐

   Admin Portal      Driver Portal      Customer Portal

        │                  │                  │

        └──────────────────┼──────────────────┘

                 Business Domains

 Booking • Dispatch • Trips • Drivers • Vehicles

 Customers • Payments • Notifications • Analytics

                           │

                Platform Services

 API • Auth • Database • Realtime • Storage

                           │

                   Infrastructure

 Docker • Coolify • Hetzner • Turso • Clerk
```

### 1.3 Strategic Goals

| Goal | Metric | Timeline |
|---|---|---|
| Multi-portal platform | Admin + Driver + Customer portals | Year 1 |
| Real-time operations | < 500ms event delivery | Immediate |
| Horizontal scaling | 10x current capacity | Year 2 |
| Mobile-first delivery | PWA for all portals | Year 1 |
| International expansion | Multi-city, multi-language | Year 2-3 |

---

## 2. Product Philosophy

### 2.1 Core Principles

**Every feature must solve a business workflow.**
Not a screen. Not a form. Not a table. A workflow.

**Every workflow must minimize friction.**
Users should complete tasks in the fewest possible interactions.

**Every interaction must reduce operational effort.**
Technology exists to simplify operations.

### 2.2 Design Mantras

| Never build... | Build instead... |
|---|---|
| Screens | Workflows |
| Forms | Guided experiences |
| Tables | Operational control centers |
| Buttons | Intentional actions |
| Dashboards | Decision-support systems |

### 2.3 Single Source of Truth

Never duplicate information.
Every piece of data must have exactly one canonical location.
All views derive from that location.

If data appears in two places, one is stale.
If data is calculated, calculate it from the source.
If data is cached, cache it with a TTL and invalidation strategy.

---

## 3. Architecture Constitution

### 3.1 Layered Architecture

Every architectural decision must follow these priorities:

```
Business Domains
       ↓
Application Layer
       ↓
Platform Services
       ↓
Infrastructure
```

Never the opposite.

Business rules must never depend on frameworks.
Frameworks may change. Business rules never should.

Applications are replaceable.
Business Domains are permanent.

### 3.2 Dependency Rules

```
apps/*           → imports from packages/* and domains/*
packages/api     → imports from domains/*, packages/db, packages/auth, packages/realtime
packages/domains → imports from packages/db, packages/types, packages/validation
packages/realtime → pure event broadcasting, no business logic
packages/auth    → identity only, no authorization rules
packages/db      → persistence only, no business logic
packages never import from apps/*
```

### 3.3 Inversion of Control

```
WRONG:  UI → Database
WRONG:  UI → API → Database
WRONG:  UI → Business Logic → Database

CORRECT:
  UI → API → Domain → Database
            ↕
         Realtime
```

---

## 4. Engineering Principles

### 4.1 SOLID Principles

- **Single Responsibility:** Each package/domain has one reason to change
- **Open/Closed:** Extend behavior through composition, not modification
- **Liskov Substitution:** Interfaces are contracts, implementations are swappable
- **Interface Segregation:** Small, focused interfaces over large monolithic ones
- **Dependency Inversion:** Depend on abstractions, not concretions

### 4.2 DRY — But Smart

- **Extract shared logic** into domain packages when used by 2+ applications
- **Never extract prematurely** — wait for the second use case
- **UI components** can be duplicated across apps if they diverge visually
- **Business logic** must NEVER be duplicated

### 4.3 YAGNI — With Foresight

- Build for today's requirements
- Design for tomorrow's extension points
- Never implement speculative features
- Always leave the door open for the next iteration

### 4.4 KISS — With Depth

- Simple on the surface, robust underneath
- Complexity is acceptable when it serves clarity
- Every abstraction must justify its existence
- If you can't explain it simply, it's too complex

---

## 5. Domain-Driven Design

### 5.1 Domain Boundaries

| Domain | Responsibility | Key Entities |
|---|---|---|
| **Booking** | Reservation lifecycle, pricing, customer requests | Booking, Quote, Promotion |
| **Dispatch** | Assignment engine, driver matching, queue management | Assignment, Queue, Match |
| **Drivers** | Registration, claim, profile, compliance, availability | Driver, Document, Session |
| **Trips** | Trip lifecycle, status transitions, completion | Trip, Route, Milestone |
| **Vehicles** | Vehicle registry, fleet management, categorization | Vehicle, Category, Assignment |
| **Customers** | Customer profiles, history, preferences | Customer, Preference, History |
| **Payments** | Earnings, commissions, payouts, financial records | Earning, Commission, Payout |
| **Notifications** | Push, in-app, WhatsApp notification rules | Notification, Template, Channel |
| **Analytics** | Metrics, reporting, performance tracking | Metric, Report, Dashboard |
| **Content** | Experiences, tours, curated services | Experience, Category, Media |

### 5.2 Domain Rules

1. Domains communicate through events, not direct calls
2. Each domain owns its data — no cross-domain queries
3. Domain logic lives in `packages/domains/*`, never in UI or API routes
4. Domain events are the only way to trigger side effects across boundaries
5. Each domain has its own validation schemas

### 5.3 Aggregate Design

```
Booking Domain
├── Aggregate Root: Booking
├── Entities: BookingItem, BookingNote
├── Value Objects: Route, Schedule, PassengerCount
└── Events: BookingCreated, BookingUpdated, BookingCancelled

Driver Domain
├── Aggregate Root: Driver
├── Entities: Document, AvailabilityLog, Session
├── Value Objects: PhoneNumber, License, VehicleType
└── Events: DriverRegistered, DriverApproved, AvailabilityChanged

Trip Domain
├── Aggregate Root: Trip
├── Entities: TripMilestone, TripEarning
├── Value Objects: Distance, Duration, Coordinates
└── Events: TripStarted, TripCompleted, TripCancelled
```

---

## 6. Folder Organization

### 6.1 Monorepo Structure

```
localplug/
├── apps/
│   ├── admin-portal/           # Dispatch & operations dashboard
│   ├── driver-portal/          # Driver PWA (mobile-first)
│   ├── customer-portal/        # Customer booking interface
│   └── landing/                # Public marketing website
│
├── packages/
│   ├── db/                     # Turso + Drizzle schema, migrations
│   ├── auth/                   # Clerk + OTP flow, role guards
│   ├── api/                    # Next.js App Router route handlers
│   ├── realtime/               # Socket.IO server + client, event bus
│   ├── types/                  # Shared TypeScript interfaces
│   ├── validation/             # Zod schemas for API inputs
│   ├── ui/                     # Shared UI primitives (optional)
│   ├── utils/                  # Date, string, formatting helpers
│   └── config/                 # Environment, feature flags
│
├── packages/domains/
│   ├── booking/                # Reservation lifecycle
│   ├── dispatch/               # Assignment engine
│   ├── drivers/                # Driver management
│   ├── trips/                  # Trip lifecycle
│   ├── vehicles/               # Vehicle registry
│   ├── customers/              # Customer profiles
│   ├── payments/               # Financial records
│   ├── notifications/          # Notification rules
│   ├── analytics/              # Metrics & reporting
│   └── content/                # Experiences & tours
│
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   ├── docker-compose.yml      # Local development stack
│   └── terraform/              # Infrastructure as code (future)
│
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Workspace definitions
└── package.json                # Root scripts
```

### 6.2 Application Structure (Each App)

```
apps/driver-portal/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login, register, OTP)
│   ├── (driver)/               # Driver routes (dashboard, schedule, etc.)
│   ├── api/                    # App-specific API routes (if any)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Entry redirect
│   └── manifest.json           # PWA manifest
│
├── components/                 # App-specific UI components
│   ├── dashboard/
│   ├── schedule/
│   ├── trip/
│   ├── notifications/
│   └── ui/                     # App-specific UI primitives
│
├── hooks/                      # App-specific React hooks
├── lib/                        # App-specific utilities
├── public/                     # Static assets, icons
├── styles/                     # Global CSS
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # App dependencies
```

### 6.3 Domain Package Structure

```
packages/domains/drivers/
├── index.ts                    # Public API exports
├── registration.service.ts     # Registration business logic
├── claim.service.ts            # Claim flow business logic
├── availability.service.ts     # Availability management
├── profile.service.ts          # Profile CRUD
├── compliance.service.ts       # Document verification
├── events.ts                   # Domain event definitions
├── types.ts                    # Domain-specific types
├── validation.ts               # Zod schemas
└── __tests__/                  # Domain tests
```

---

## 7. Business Domains

### 7.1 Booking Domain

**Purpose:** Manage the complete lifecycle of a customer reservation.

**Entities:**
- `Booking` — The core reservation record
- `BookingItem` — Individual service items within a booking
- `BookingNote` — Special instructions or notes

**Value Objects:**
- `Route` — Pickup and dropoff locations with coordinates
- `Schedule` — Requested date/time with timezone
- `PassengerCount` — Number of passengers and luggage

**Events:**
- `BookingCreated` — New reservation submitted
- `BookingUpdated` — Reservation details changed
- `BookingCancelled` — Reservation cancelled
- `BookingConfirmed` — Payment verified, booking active

**Business Rules:**
- A booking cannot be created without valid pickup/dropoff
- Scheduled time must be at least 2 hours in the future
- Cancellation within 24 hours may incur a fee
- Bookings with return trips must have return date ≥ arrival date

### 7.2 Dispatch Domain

**Purpose:** Match available drivers to pending bookings efficiently.

**Entities:**
- `Assignment` — A dispatch attempt to match driver to booking
- `Queue` — Pending bookings awaiting assignment
- `MatchCriteria` — Driver matching rules and preferences

**Events:**
- `AssignmentCreated` — Driver matched to booking
- `AssignmentAccepted` — Driver accepted the assignment
- `AssignmentRejected` — Driver rejected the assignment
- `AssignmentExpired` — Timer ran out, assignment voided
- `AssignmentCancelled` — Dispatcher cancelled the assignment

**Business Rules:**
- Only Available + Approved drivers appear in dispatch
- Assignment timer is configurable (default: 45 seconds)
- A booking can have multiple assignments (rejection/reassignment)
- Smart matching considers VIP requirements, vehicle type, experience

### 7.3 Driver Domain

**Purpose:** Manage driver lifecycle from registration to active service.

**Entities:**
- `Driver` — Core driver profile
- `Document` — Compliance documents (license, SOAT, insurance)
- `AvailabilityLog` — Audit trail for availability changes
- `Session` — Active device/session tracking
- `EventHistory` — Complete event audit log

**Value Objects:**
- `PhoneNumber` — Primary identifier (UNIQUE)
- `License` — Driver license details
- `VehicleType` — Category classification

**Events:**
- `DriverRegistered` — New driver self-registered
- `DriverClaimed` — Existing driver claimed profile
- `DriverApproved` — Admin approved driver
- `DriverSuspended` — Admin suspended driver
- `AvailabilityChanged` — Driver toggled availability

**Business Rules:**
- Phone number is the primary identifier (UNIQUE constraint)
- One phone/email cannot exist in two different driver profiles
- Claim flow is prioritized over new registration
- Drivers cannot receive services until:
  - Account is Approved
  - All mandatory documents are completed
  - Terms and conditions are accepted
- Only Approved + Available drivers receive assignments

### 7.4 Trip Domain

**Purpose:** Track the execution of an accepted assignment from start to finish.

**Entities:**
- `Trip` — The executed journey
- `TripMilestone` — Status transitions with timestamps
- `TripEarning` — Financial record for the trip

**Events:**
- `TripStarted` — Driver heading to pickup
- `TripArrived` — Driver at pickup location
- `TripBoarded` — Passenger onboard
- `TripCompleted` — Trip finished successfully
- `TripCancelled` — Trip cancelled

**Business Rules:**
- One trip per accepted assignment (1:1 relationship)
- Each status transition records its timestamp
- Trip cannot be cancelled by driver once onboard
- COMPLETED triggers: earnings calculation, availability → available

### 7.5 Vehicle Domain

**Purpose:** Manage the vehicle registry independently of driver ownership.

**Entities:**
- `Vehicle` — Vehicle registry record
- `DriverVehicleAssignment` — N:M relationship between drivers and vehicles

**Business Rules:**
- Vehicles can be company-owned, shared, or rental
- Multiple drivers can use the same vehicle
- Each driver has one primary vehicle at a time
- Vehicle type determines service category eligibility

---

## 8. Application Layer

### 8.1 Application Portfolio

| Application | Target User | Framework | Delivery | Status |
|---|---|---|---|---|
| Admin Portal | Dispatchers, Managers | Next.js 15 | Web | Active |
| Driver Portal | Drivers | Next.js 15 | PWA | Building |
| Customer Portal | Travelers | Next.js 15 | PWA | Planned |
| Landing Website | Public | Next.js 15 | Web | Active |

### 8.2 Application Independence

Each application:
- Has its own `package.json` and dependencies
- Can be deployed independently
- Has its own UI components and hooks
- Shares business logic through packages/domains
- Shares infrastructure through packages/*

### 8.3 Application Rules

1. Applications never contain business logic
2. Applications never access the database directly
3. Applications consume packages/api for data operations
4. Applications consume packages/realtime for live updates
5. Applications can have app-specific UI components but not business logic

---

## 9. Platform Services

### 9.1 Service Architecture

```
┌─────────────────────────────────────────────────┐
│                  Platform Services               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ API      │  │ Auth     │  │ Database │      │
│  │ Service  │  │ Service  │  │ Service  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Realtime │  │ Storage  │  │ Workflow │      │
│  │ Service  │  │ Service  │  │ Service  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 9.2 Service Responsibilities

| Service | Package | Responsibility |
|---|---|---|
| API | packages/api | Endpoint orchestration, request handling |
| Auth | packages/auth | Identity verification, session management |
| Database | packages/db | Data persistence, migrations, queries |
| Realtime | packages/realtime | WebSocket connections, event broadcasting |
| Storage | packages/config | File uploads, media management |
| Workflow | (external) | n8n automation, WhatsApp integration |

---

## 10. Shared Packages

### 10.1 Package Catalog

| Package | Type | Purpose | Consumers |
|---|---|---|---|
| `packages/db` | Infrastructure | Turso + Drizzle ORM, migrations | domains, api |
| `packages/auth` | Infrastructure | Clerk sessions, OTP, role guards | api, apps |
| `packages/api` | Infrastructure | Next.js App Router handlers | apps |
| `packages/realtime` | Infrastructure | Socket.IO server + client | apps, domains |
| `packages/types` | Shared | TypeScript interfaces | All |
| `packages/validation` | Shared | Zod schemas | domains, api |
| `packages/utils` | Shared | Date, string, formatting | All |
| `packages/config` | Shared | Environment, feature flags | All |
| `packages/ui` | Shared | UI primitives (optional) | apps |

### 10.2 Package Rules

1. Packages never import from apps/*
2. Packages have clear, singular responsibilities
3. Packages expose public APIs through index.ts
4. Package dependencies flow downward only
5. No circular dependencies between packages

### 10.3 Package Interface Pattern

```typescript
// packages/domains/drivers/index.ts
export { registerDriver } from './registration.service';
export { claimDriver } from './claim.service';
export { updateAvailability } from './availability.service';
export { getDriverProfile } from './profile.service';

// Types exported from packages/types
export type { Driver, DriverStatus, AvailabilityStatus } from '@localplug/types';
```

---

## 11. UI Design System

### 11.1 Design Tokens

```css
/* Color Palette */
--color-primary: #fbbf24;        /* Gold — brand accent */
--color-primary-hover: #f59e0b;
--color-success: #22c55e;        /* Green — positive actions */
--color-danger: #ef4444;         /* Red — destructive actions */
--color-warning: #f97316;        /* Orange — warnings */
--color-info: #60a5fa;           /* Blue — informational */

/* Background */
--bg-primary: #0f172a;           /* Dark background */
--bg-secondary: #1e293b;         /* Card background */
--bg-tertiary: #334155;          /* Border, subtle bg */

/* Text */
--text-primary: #f8fafc;         /* Main text */
--text-secondary: #94a3b8;       /* Muted text */
--text-tertiary: #64748b;        /* Disabled text */

/* Typography */
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-display: 'Playfair Display', serif;

/* Spacing */
--space-unit: 4px;
--touch-target: 44px;            /* Minimum touch target */

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
```

### 11.2 Component Standards

| Component | Touch Target | States |
|---|---|---|
| Button | 44px height | default, hover, active, disabled, loading |
| Input | 44px height | default, focus, error, disabled |
| Card | N/A | default, selected, disabled |
| Toggle | 44px × 24px | on, off, disabled |

### 11.3 Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| Mobile | 375px+ | Primary (Driver Portal) |
| Tablet | 768px+ | Secondary |
| Desktop | 1024px+ | Admin Portal |

### 11.4 PWA Design Requirements

- Installable on Android and iOS
- Full-screen mode (no browser chrome)
- Splash screen with brand logo
- Offline indicator when connectivity lost
- Smooth transitions between screens
- Haptic feedback on critical actions (where supported)

---

## 12. Database Architecture

### 12.1 Technology Stack

- **Engine:** Turso (libSQL — SQLite-compatible edge database)
- **ORM:** Drizzle ORM (type-safe, lightweight)
- **Migrations:** Auto-migration system with versioned SQL files
- **Connection:** `@libsql/client` with configurable concurrency

### 12.2 Schema Design Principles

1. **UUID primary keys** — all tables use UUID v4
2. **Soft deletes** — `deleted_at` + `deleted_by` on all core tables
3. **Optimistic concurrency** — `version` + `updated_at` on frequently updated tables
4. **Audit timestamps** — `created_at` + `updated_at` on all tables
5. **Enum constraints** — use typed enums for status fields
6. **Unique constraints** — enforce business rules at database level
7. **Foreign keys** — explicit relationships between tables

### 12.3 Table Naming Convention

- Plural nouns: `drivers`, `trips`, `assignments`
- Snake_case: `driver_documents`, `trip_milestones`
- Junction tables: `{table_a}_{table_b}` (e.g., `driver_vehicle_assignments`)
- Log tables: `{entity}_{purpose}_log` (e.g., `driver_availability_log`)

### 12.4 Core Tables (MVP)

```
DRIVER DOMAIN
├── drivers
├── driver_documents
├── driver_availability_log
├── driver_event_history
└── driver_sessions

VEHICLE DOMAIN
├── vehicles
└── driver_vehicle_assignments

BOOKING DOMAIN
└── bookings

DISPATCH DOMAIN
└── assignments

TRIP DOMAIN
├── trips
└── driver_earnings

SHARED
├── users (Clerk-linked)
└── notifications
```

### 12.5 Migration Strategy

- Migrations stored in `packages/db/migrations/`
- Auto-migration system runs on first request
- Each migration is a numbered SQL file (e.g., `031-driver-portal.sql`)
- Migrations are additive — never modify existing files
- Rollback scripts required for production migrations

---

## 13. Event-Driven Architecture

### 13.1 Event Bus

The event bus is the backbone of cross-domain communication.

```
Domain publishes event → Event Bus → Realtime broadcasts → Connected clients
```

### 13.2 Event Categories

| Category | Examples | Target |
|---|---|---|
| Driver Events | status_changed, connected, disconnected | dispatch, admin |
| Assignment Events | new, accepted, rejected, expired, cancelled | driver, dispatch |
| Trip Events | status_changed, completed | dispatch, admin |
| Notification Events | new, read | driver, customer |
| Booking Events | created, updated, cancelled | dispatch, admin |
| Stats Events | update | admin |

### 13.3 Event Structure

```typescript
interface DomainEvent {
  type: string;                    // e.g., 'assignment:new'
  timestamp: number;               // Unix timestamp
  version: number;                 // Schema version
  payload: Record<string, unknown>; // Event-specific data
}
```

### 13.4 Event Rules

1. Events are immutable once published
2. Events are typed via `packages/types`
3. No business logic in event handlers
4. Event handlers must be idempotent
5. Failed events are logged but don't block the caller
6. Events include correlation IDs for tracing

---

## 14. Authentication

### 14.1 Auth Architecture

```
Driver Portal                    Admin Portal
     │                                │
     ▼                                ▼
  Custom UI                       Clerk UI
  (branded)                       (default)
     │                                │
     └──────────┬─────────────────────┘
                │
                ▼
          Clerk Backend
     (session, JWT, OTP)
                │
                ▼
          packages/auth
     (role guards, middleware)
```

### 14.2 Auth Flow — Driver Portal

1. Driver enters phone number
2. Backend checks for existing profile (claim vs register)
3. OTP sent via WhatsApp (Evolution API)
4. Driver enters OTP
5. Backend verifies OTP, creates/finds Clerk user
6. Clerk session created (JWT)
7. All subsequent requests include JWT
8. Middleware validates JWT and attaches driver context

### 14.3 Auth Flow — Admin Portal

1. Dispatcher opens admin portal
2. Redirected to Clerk sign-in (default UI)
3. Clerk handles authentication
4. Session created, JWT issued
5. Middleware validates JWT and attaches admin context

### 14.4 Auth Rules

- Phone is primary identifier for drivers (UNIQUE)
- Email is secondary (recovery only)
- Device change = re-OTP (same Clerk user, no re-registration)
- Sessions are managed by Clerk (refresh, expiry, device tracking)
- Auth never contains business logic — only identity verification

---

## 15. Authorization

### 15.1 Role-Based Access Control

| Role | Portals | Permissions |
|---|---|---|
| `admin` | Admin | Full access to all modules |
| `manager` | Admin | Access to operations modules |
| `concierge` | Admin | Access to customer-facing modules |
| `viewer` | Admin | Read-only access |
| `driver` | Driver Portal | Own profile, assignments, trips |
| `customer` | Customer Portal | Own bookings, profile |

### 15.2 Module-Level Permissions

Each admin module has CRUD permissions:

```
dashboard:read, dispatch:read, dispatch:write,
drivers:read, drivers:write, reservations:read,
reservations:write, ...
```

### 15.3 Driver Portal Authorization

- Drivers can only access their own data
- Drivers cannot access admin endpoints
- Drivers cannot modify other drivers' records
- Availability changes are scoped to the authenticated driver
- Assignment operations are scoped to assignments assigned to the driver

---

## 16. API Standards

### 16.1 Endpoint Naming

```
GET    /api/{resource}              # List
GET    /api/{resource}/:id          # Get one
POST   /api/{resource}              # Create
PUT    /api/{resource}/:id          # Update
DELETE /api/{resource}/:id          # Soft delete
POST   /api/{resource}/:id/action   # Action (accept, reject, etc.)
```

### 16.2 Request/Response Format

```typescript
// Request
POST /api/assignments/:id/accept
Authorization: Bearer <clerk_jwt>
Content-Type: application/json

// Response
{
  "success": true,
  "data": {
    "tripId": "uuid",
    "status": "accepted",
    "scheduledAt": "2026-07-11T14:30:00Z"
  },
  "meta": {
    "timestamp": 1689100000000,
    "version": 1
  }
}
```

### 16.3 Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "DRIVER_NOT_AVAILABLE",
    "message": "Driver must be available to accept assignments",
    "details": {
      "currentStatus": "busy"
    }
  }
}
```

### 16.4 API Rules

1. All endpoints require authentication (Clerk JWT)
2. Driver endpoints verify `account_status = approved`
3. Input validation via Zod schemas (`packages/validation`)
4. Business logic delegated to domain services
5. Events emitted for side effects (realtime, notifications)
6. Idempotent operations where possible

---

## 17. Coding Standards

### 17.1 TypeScript

- Strict mode enabled (`strict: true`)
- Explicit return types on public functions
- Avoid `any` — use `unknown` and type narrowing
- Use interfaces for object shapes, types for unions/intersections
- Prefer `readonly` for immutable data

### 17.2 React / Next.js

- Functional components only (no class components)
- Server Components by default, `'use client'` only when needed
- Extract complex logic into custom hooks
- Keep components under 200 lines
- One component per file

### 17.3 File Organization

```
ComponentName/
├── index.ts              # Public export
├── ComponentName.tsx     # Component implementation
├── ComponentName.test.ts # Tests
└── types.ts              # Component-specific types (if needed)
```

### 17.4 Import Order

```typescript
// 1. React/Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External packages
import { z } from 'zod';

// 3. Shared packages
import { db } from '@localplug/db';
import { requireAuth } from '@localplug/auth';

// 4. Domain services
import { registerDriver } from '@localplug/domains/drivers';

// 5. Local components
import { DriverForm } from './components/DriverForm';

// 6. Local utils
import { formatPhone } from './utils';
```

### 17.5 Comments

- No comments unless explicitly requested
- Code should be self-documenting
- Use descriptive variable and function names
- Complex algorithms get brief explanatory comments

---

## 18. Git Standards

### 18.1 Branch Naming

```
feat/driver-portal-registration     # New feature
fix/assignment-timer-race-condition # Bug fix
refactor/domain-event-bus           # Refactor
docs/api-endpoint-reference         # Documentation
chore/docker-compose-update         # Maintenance
```

### 18.2 Commit Messages

```
feat(drivers): add hybrid registration/claim flow

- Implement phone-based duplicate detection
- Add OTP verification via WhatsApp
- Create Clerk user on successful verification
- Support both claim and self-registration paths

Closes #123
```

### 18.3 PR Standards

- One feature/fix per PR
- Descriptive title and body
- Link to issue/ticket
- Screenshots for UI changes
- Tests pass before merge
- No `TODO` comments in merged code

---

## 19. Naming Conventions

### 19.1 Files

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `DriverCard.tsx` |
| Hooks | camelCase with `use` | `useAvailability.ts` |
| Services | camelCase with action | `registration.service.ts` |
| Types | PascalCase | `DriverProfile.ts` |
| Utils | camelCase | `formatPhone.ts` |
| Tests | `.test.ts` suffix | `registration.test.ts` |

### 19.2 Variables & Functions

| Type | Convention | Example |
|---|---|---|
| Variables | camelCase | `driverStatus` |
| Functions | camelCase | `registerDriver()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `DriverProfile` |
| Enums | PascalCase | `AvailabilityStatus` |

### 19.3 Database

| Type | Convention | Example |
|---|---|---|
| Tables | Plural, snake_case | `driver_documents` |
| Columns | snake_case | `account_status` |
| Primary keys | `id` | `id` |
| Foreign keys | `{table}_id` | `driver_id` |
| Timestamps | `{verb}_at` | `created_at` |

---

## 20. Realtime Architecture

### 20.1 Technology

- **Server:** Socket.IO (Node.js)
- **Transport:** WebSocket with HTTP fallback
- **Scaling:** Redis adapter for horizontal scaling
- **Deployment:** Persistent process (not serverless)

### 20.2 Connection Flow

```
Client connects → Verify Clerk JWT → Join rooms → Receive events
```

### 20.3 Room Structure

| Room | Purpose | Members |
|---|---|---|
| `driver:{id}` | Per-driver events | Single driver |
| `dispatch` | Dispatch panel events | All dispatchers |
| `admin` | Admin dashboard events | All admins |
| `all-drivers` | Broadcast to all drivers | All connected drivers |

### 20.4 Event Publishing

```
Domain Service → Event Bus → Socket.IO Server → Room Broadcast → Clients
```

### 20.5 Realtime Rules

1. No business logic in realtime layer
2. Events are typed and validated
3. Failed broadcasts are logged, not retried
4. Client reconnection handles missed events
5. Heartbeat monitoring for connection health

---

## 21. Infrastructure

### 21.1 Deployment Stack

| Component | Technology | Purpose |
|---|---|---|
| Compute | Hetzner Cloud | Application hosting |
| Orchestration | Docker + Coolify | Container management |
| Database | Turso (libSQL) | Edge database |
| Auth | Clerk | Identity management |
| WhatsApp | Evolution API | Business messaging |
| Workflow | n8n | Automation engine |
| CDN | Vercel (landing) | Static assets |

### 21.2 Docker Services

```yaml
services:
  admin-portal:        # Next.js admin dashboard
  driver-portal:       # Next.js driver PWA
  ws-server:           # Socket.IO real-time service
  n8n:                 # Workflow automation
  evolution-api:       # WhatsApp integration
  ollama:              # Local AI (optional)
```

### 21.3 Environment Management

```
.env.local            # Local development (not committed)
.env.development      # Development environment
.env.staging          # Staging environment
.env.production       # Production environment
```

---

## 22. Security

### 22.1 Authentication Security

- JWT tokens with short expiry (15 minutes)
- Refresh tokens managed by Clerk
- OTP expires after 5 minutes
- Maximum 3 OTP attempts before lockout
- Device fingerprinting for session management

### 22.2 API Security

- All endpoints require authentication
- Rate limiting on all public endpoints
- Input validation on all requests
- CORS configured per application
- No sensitive data in URLs or logs

### 22.3 Data Security

- Passwords never stored (Clerk handles)
- Phone numbers masked in logs
- API keys in environment variables, never in code
- Database connections use TLS
- Soft deletes preserve data for audit

### 22.4 WebSocket Security

- Clerk JWT required for connection
- Room access verified on join
- No sensitive data in event payloads
- Connection timeout after 30 minutes inactivity

---

## 23. Performance

### 23.1 Frontend

- Target: First Contentful Paint < 1.5s
- Target: Time to Interactive < 3s
- Code splitting per route
- Image optimization (WebP, lazy loading)
- Service worker caching for repeat visits

### 23.2 API

- Target: P95 response time < 200ms
- Database connection pooling (concurrency: 16)
- Query optimization with Drizzle
- Pagination for list endpoints
- Selective field fetching

### 23.3 Realtime

- Target: Event delivery < 500ms
- Room-based broadcasting (no broadcast storms)
- Event deduplication on client
- Batch updates for high-frequency events

### 23.4 Database

- Indexes on frequently queried columns
- Composite indexes for common filters
- Avoid N+1 queries
- Use selects instead of fetching all columns
- Connection retry with exponential backoff

---

## 24. Scalability

### 24.1 Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │ App 1  │  │ App 2  │  │ App 3  │
         └────────┘  └────────┘  └────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌──────────────┐
                    │   Turso DB   │
                    └──────────────┘
```

### 24.2 WebSocket Scaling

```
                    ┌──────────────┐
                    │ Redis Adapter│
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │ WS 1   │  │ WS 2   │  │ WS 3   │
         └────────┘  └────────┘  └────────┘
```

### 24.3 Scaling Rules

1. Applications scale horizontally (stateless)
2. WebSocket servers scale via Redis adapter
3. Database scales via Turso edge replicas
4. File storage scales via cloud providers
5. No application state in memory (use Redis/DB)

---

## 25. Testing

### 25.1 Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E Tests (critical paths)
      ╱    ╲
     ╱──────╲
    ╱        ╲      Integration Tests (API, DB)
   ╱          ╲
  ╱────────────╲
 ╱              ╲    Unit Tests (domain logic, utils)
╱────────────────╲
```

### 25.2 Test Types

| Type | Scope | Tools | Coverage Target |
|---|---|---|---|
| Unit | Domain logic, utils | Vitest | 80%+ |
| Integration | API routes, DB queries | Vitest + MSW | Critical paths |
| E2E | User workflows | Playwright | Happy paths |

### 25.3 Testing Rules

1. Test behavior, not implementation
2. Mock external services (Clerk, WhatsApp, n8n)
3. Use factory functions for test data
4. Each test is independent (no shared state)
5. Tests run in CI before merge

---

## 26. Deployment

### 26.1 Deployment Pipeline

```
Code Push → CI Build → Tests Pass → Docker Build → Deploy → Health Check
```

### 26.2 Environment Promotion

```
Local → Development → Staging → Production
```

### 26.3 Deployment Rules

1. No direct deploys to production
2. All changes go through CI/CD
3. Database migrations run before app deployment
4. Rollback capability required for all deployments
5. Health checks must pass before traffic routing

### 26.4 Zero-Downtime Deployment

1. Build new version alongside old version
2. Run database migrations (backward compatible)
3. Start new version
4. Health check new version
5. Route traffic to new version
6. Shutdown old version

---

## 27. Documentation

### 27.1 Documentation Types

| Document | Location | Audience |
|---|---|---|
| Master Spec | `MASTER_SPEC.md` | Architects, AI |
| API Reference | `docs/api/` | Developers |
| Setup Guide | `docs/setup.md` | New developers |
| Architecture | `docs/architecture.md` | Architects |
| Domain Models | `docs/domains/` | Domain experts |

### 27.2 Documentation Rules

1. Every architectural decision is documented
2. API endpoints have request/response examples
3. Domain models include business rules
4. Setup guides are tested quarterly
5. Documentation lives near the code it describes

---

## 28. AI Development Rules

### 28.1 Before Writing Code

Every time you generate code:

1. **First analyze** — understand the existing codebase
2. **Then explain** — describe what you're about to do and why
3. **Then design** — show the approach before implementing
4. **Only then implement** — write the code

### 28.2 Never Do This

- Never generate code without explaining why
- Never introduce new dependencies unless justified
- Never duplicate business logic
- Never place business rules inside React components
- Never access the database directly from UI
- Never bypass the domain layer
- Never skip the API layer
- Never ignore existing patterns

### 28.3 Always Do This

- Always document architectural decisions
- Always follow existing code patterns
- Always check for existing components/utils first
- Always validate inputs with Zod schemas
- Always emit events for cross-domain communication
- Always use soft deletes for core entities
- Always include error handling

### 28.4 Quality Gates

Before creating any file, answer:

```
□ Does this duplicate logic?
□ Does this belong to the correct domain?
□ Is there already a shared component?
□ Does this respect the monorepo?
□ Does this break the API?
□ Does this affect realtime?
□ Does this require migration?
□ Is this reusable?
□ Is this documented?
```

If any answer is NO:
- Stop implementation
- Explain why
- Propose the correct approach

### 28.5 Architecture Checklist

Before approving any implementation:

```
□ Business logic is in packages/domains/*
□ UI only contains presentation logic
□ API routes only orchestrate, not implement
□ Events are emitted for cross-domain effects
□ Database schema follows naming conventions
□ Tests cover critical paths
□ No secrets in code
□ No duplicate data storage
```

---

## 29. Migration Strategy

### 29.1 Current State

The existing LocalPlug codebase has:
- Admin portal with full RBAC
- Driver management (admin-only)
- Dispatch system with WhatsApp-based driver communication
- Booking system with Paddle payments
- AI chat support via n8n

### 29.2 Migration Approach

1. **Preserve existing functionality** — Admin portal remains unchanged
2. **Extract shared packages** — Move business logic to `packages/domains/*`
3. **Build Driver Portal** — New app consuming shared packages
4. **Add real-time layer** — Socket.IO server alongside existing polling
5. **Migrate incrementally** — One domain at a time, not big-bang

### 29.3 Migration Order

1. packages/types (shared TypeScript interfaces)
2. packages/db (extract Turso client + Drizzle schema)
3. packages/auth (extract Clerk helpers)
4. packages/domains/drivers (driver business logic)
5. packages/domains/dispatch (assignment logic)
6. packages/domains/trips (trip lifecycle)
7. packages/realtime (Socket.IO server)
8. apps/driver-portal (new PWA)
9. Update admin-portal to use shared packages

### 29.4 Backward Compatibility

- Existing API routes continue to work during migration
- New routes added alongside old ones
- Old routes deprecated after migration complete
- Database migrations are additive (no breaking changes)
- Feature flags control new vs old code paths

---

## 30. Future Vision

### 30.1 Platform Evolution

```
Phase 1 (Current)
├── Admin Portal (active)
├── Driver Portal (building)
└── Shared packages (extracting)

Phase 2 (Next 6 months)
├── Customer Portal
├── Real-time analytics
└── Advanced dispatch algorithms

Phase 3 (Next 12 months)
├── Mobile apps (React Native)
├── Multi-city expansion
├── AI-powered matching
└── Predictive analytics

Phase 4 (Year 2+)
├── API marketplace
├── Third-party integrations
├── White-label solution
└── International expansion
```

### 30.2 Technology Roadmap

| Area | Current | Future |
|---|---|---|
| Database | Turso (SQLite) | Turso + Postgres (complex queries) |
| Cache | In-memory | Redis (distributed) |
| Queue | In-process | BullMQ (persistent) |
| Search | Database queries | Meilisearch (full-text) |
| AI | Ollama (local) | GPT-4o (production) |
| Monitoring | Logs | OpenTelemetry + Grafana |

### 30.3 Success Metrics

| Metric | Target | Timeline |
|---|---|---|
| Driver Portal adoption | 80% of active drivers | 3 months post-launch |
| Assignment response time | < 30 seconds average | Immediate |
| System uptime | 99.9% | Ongoing |
| Event delivery latency | < 500ms P95 | Immediate |
| Code coverage | 80%+ | 6 months |

---

## Appendix A: Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 15.x |
| Language | TypeScript | 5.x |
| UI | React | 18.x |
| Styling | Tailwind CSS | 3.4 |
| Auth | Clerk | 7.4 |
| Database | Turso (libSQL) | Latest |
| ORM | Drizzle | Latest |
| Realtime | Socket.IO | 4.x |
| Payments | Paddle | Latest |
| Workflow | n8n | Self-hosted |
| WhatsApp | Evolution API | Self-hosted |
| Testing | Vitest | 4.x |
| Package Manager | pnpm | 10.x |
| Build Tool | Turborepo | Latest |
| Deployment | Docker + Coolify | Latest |
| Hosting | Hetzner | Cloud |

---

## Appendix B: Event Catalog

### Driver Events
- `driver:registered`
- `driver:claim_completed`
- `driver:approved`
- `driver:suspended`
- `driver:availability_changed`
- `driver:connected`
- `driver:disconnected`

### Assignment Events
- `assignment:new`
- `assignment:accepted`
- `assignment:rejected`
- `assignment:expired`
- `assignment:cancelled`
- `assignment:reassigned`

### Trip Events
- `trip:status_changed`
- `trip:completed`
- `trip:cancelled`

### Notification Events
- `notification:new`
- `notification:read`

### System Events
- `stats:update`

---

## Appendix C: API Endpoint Reference

### Auth
- `POST /api/auth/check-phone`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`

### Drivers
- `GET /api/drivers/me`
- `POST /api/drivers/register`
- `POST /api/drivers/claim`
- `PUT /api/drivers/availability`
- `PUT /api/drivers/profile`
- `POST /api/drivers/documents`

### Assignments
- `GET /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/assignments/:id/accept`
- `POST /api/assignments/:id/reject`

### Trips
- `GET /api/trips/schedule`
- `GET /api/trips/:id`
- `PUT /api/trips/:id/status`
- `GET /api/trips/history`

### Earnings
- `GET /api/earnings/summary`
- `GET /api/earnings/history`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

---

*This document is the single source of truth for the LocalPlug platform. All architectural decisions, implementation plans, and code reviews must align with this specification.*
