# VEHICLES DOMAIN

> Vehicle registration, documentation, and fleet management.

## Responsibility
- Owns: vehicle profiles, documents, maintenance, fleet management
- Does NOT own: driver assignment (Drivers), trip vehicles (Trips)

## Boundaries
- Inbound: Admin, Driver Portal, API consumers
- Outbound: Drivers (assign), Dispatch (vehicle availability)

## Status
- Maturity: 48%
- Extraction: Complete (B17)
- Portal: Driver Portal (vehicle management section)

## Domain Model
- **Entities**: Vehicle, VehicleDocument, VehicleMaintenance
- **Value Objects**: VehicleType, DocumentType, MaintenanceStatus
- **Aggregates**: Vehicle (root: Vehicle, invariants: document validity)
- **Events**: vehicle.registered, vehicle.document_verified, vehicle.maintenance_scheduled
- **Policies**: Document expiry rules, maintenance schedules

## Key Files
- `packages/domains/vehicles/` — Domain package (B17)
- `packages/db/src/domains/vehicles/` — DB schema

## Status
Extracted in B17. Enhance with events and tests.
