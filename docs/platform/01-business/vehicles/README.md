# Business Domain — Vehicles

**Purpose:** Manage the vehicle registry independently of driver ownership.

## Entities
- `Vehicle` — vehicle registry record
- `DriverVehicleAssignment` — N:M relationship between drivers and vehicles

## Business Rules
- Vehicles can be company-owned, shared, or rental.
- Multiple drivers can use the same vehicle.
- Each driver has **one primary vehicle** at a time.
- Vehicle type determines service category eligibility.

## Related
- Domain package: `packages/domains/vehicles`
- See also: `01-business/drivers` (assignment of primary vehicle)
