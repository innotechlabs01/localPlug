# DRIVERS DOMAIN

> Driver lifecycle management, profiles, documents, and availability.

## Responsibility
- Owns: driver profiles, documents, onboarding, availability, bank accounts, payouts
- Does NOT own: vehicle assignment (Vehicles), trip assignment (Dispatch)

## Boundaries
- Inbound: Admin, Driver Portal, API consumers
- Outbound: Vehicles (assign), Dispatch (availability), Notifications (status updates)

## Status
- Maturity: 72% ⭐ (reference implementation)
- Extraction: Complete
- Portal: Driver Portal (first new application)

## Domain Model
- **Entities**: Driver, DriverDocument, DriverAvailability, DriverPayout, DriverBankAccount
- **Value Objects**: DriverStatus, DocumentType, AvailabilityStatus, PayoutStatus
- **Aggregates**: Driver (root: Driver, invariants: document validity, status transitions)
- **Events**: driver.onboarded, driver.status_changed, driver.document_verified
- **Policies**: Document expiry rules, availability windows, payout thresholds

## Key Files
- `packages/domains/drivers/` — Full domain package
- `packages/domains/_services/src/driver.ts` — Service
- `apps/driver/` — Driver Portal

## Reference Pattern
This domain is the reference implementation for all other domains.
Follow this structure exactly.
