# Business Domain — Drivers

**Purpose:** Manage driver lifecycle from registration to active service.

## Entities
- `Driver` — core driver profile
- `Document` — compliance documents (license, SOAT, insurance)
- `AvailabilityLog` — audit trail for availability changes
- `Session` — active device/session tracking
- `EventHistory` — complete event audit log

## Value Objects
- `PhoneNumber` — primary identifier (**UNIQUE**)
- `License` — driver license details
- `VehicleType` — category classification

## Events
- `driver:registered`, `driver:claim_completed`, `driver:approved`
- `driver:suspended`, `driver:availability_changed`
- `driver:connected`, `driver:disconnected`

## Business Rules
- Phone number is the primary identifier (`UNIQUE` constraint).
- One phone/email cannot exist in two different driver profiles.
- **Claim flow is prioritized over new registration** (prevents duplicates).
- Drivers cannot receive services until: Account **Approved** + all mandatory documents complete + terms accepted.
- Only **Approved + Available** drivers receive assignments.
- Availability changes are scoped to the authenticated driver.

## Dual-status model
- `account_status` (admin): `pending | approved | suspended | rejected`
- `availability` (driver): `available | offline | busy`

## Related
- Workflow: `../../06-workflows/assignment-flow.md`
- State machine: `../../07-state-machines/driver.md`
- Domain package: `packages/domains/drivers`
