# Vehicles (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities
There is **NO dedicated Vehicles module, package, service, route, or table** in the current monolith. A "vehicle" is not a managed entity — it is two free-text columns (`vehicle`, `plate`) stored on the **drivers** table and propagated by value through dispatch/notification payloads.

- **Embedding location 1 — `drivers.vehicle` and `drivers.plate` columns**
  - `app/api/admin/drivers/route.ts` (lines 5, 57, 63–87): vehicle/plate are admin-editable driver attributes (`ALLOWED_DRIVER_COLUMNS` includes `vehicle`, `plate`; create requires `name, vehicle, plate`; default `status='available'`, `rating=5.0`). There is no vehicle validation, no vehicle id, no separate lifecycle.
  - `app/api/admin/drivers/[id]/*` routes manage driver attributes including `vehicle`/`plate` (covered under the Driver domain, not a vehicle domain).
  - `lib/db/migrations/010_drivers_table.sql` defines `vehicle` and `plate` columns on `drivers`.

- **Embedding location 2 — order/driver join read models carry vehicle by value**
  - `app/api/admin/orders/[id]/route.ts` (line 16): joins `drivers d` to expose `d.vehicle as driver_vehicle`, `d.plate as driver_plate` on an order.
  - `app/api/admin/payments/route.ts` (line 85): payout query selects `d.vehicle as driver_vehicle`, `d.plate as driver_plate`.
  - `app/api/admin/dispatch/route.ts` (line 21): dispatch board selects `d.vehicle as driver_vehicle`.
  - `app/api/assignments/route.ts` (line 146) and `app/api/assignments/[id]/accept/route.ts` (line 27): assignment queries surface `d.vehicle`, `d.plate`.

- **Embedding location 3 — n8n/WhatsApp notification payloads**
  - `lib/n8n/client.ts`:
    - `triggerDriverAssigned` (lines 159–198) takes `vehicle: string` + `licensePlate: string` and sends them in the WhatsApp message and the n8n `driver` object.
    - `triggerDriverNewAssignment` (lines 404–464) builds a `vehicle: { id: '', plate, brand, model: '', color: '' }` object — note `id`/`model`/`color` are hardcoded empty strings because no vehicle entity exists.
    - `triggerClientDriverConfirmed` (lines 469–527) likewise sends `vehiclePlate`/`vehicleBrand` (model/color empty).
  - `app/api/bookings/driver-assigned/route.ts` (lines 7–26) receives `vehicle` + `licensePlate` from the request body and forwards them to `triggerDriverAssigned`.

- **Embedding location 4 — availability/assignment logic references vehicle only via driver**
  - `lib/dispatch/availability.ts` never references vehicle directly; blocking is per-driver, so a driver's vehicle is implicit. No vehicle capacity/scheduling logic exists.

## Module-level real responsibilities
- ✔ Store a driver's vehicle description (`vehicle`) and license plate (`plate`) as plain string attributes of the driver.
- ✔ Surface vehicle/plate by value in order, assignment, dispatch-board, and payout read models (joins on `drivers`).
- ✔ Include vehicle/plate in customer-facing WhatsApp/n8n notifications about driver assignment.

## Proposed split (target per Blueprint domains/packages)
- `VehicleService` / `VehicleRepository` — extract `vehicle`/`plate` (plus `model`, `color`, `year`, `capacity` which today live loosely on `drivers`) into a `vehicles` table with its own id, linked to a driver (→ `packages/domains/vehicle` or `packages/domains/driver`).
- `DriverVehicleLink` — a driver owns/operates one or more vehicles; the `id`/`model`/`color` currently hardcoded empty in `lib/n8n/client.ts` would be populated from the vehicle entity.
- `VehicleReadModel` — order/assignment/payout/dispatch queries join through the vehicle link rather than denormalizing `d.vehicle`/`d.plate`.

## Dependency observations (real)
- Vehicle data has no module of its own; it is a dependency surface of the Driver domain and a payload field of the Dispatch/Notification domain.
- Writers: `app/api/admin/drivers/route.ts` → `@/lib/db` (mutates `drivers.vehicle`/`plate`).
- Readers spread across `app/api/admin/orders/[id]/route.ts`, `app/api/admin/payments/route.ts`, `app/api/admin/dispatch/route.ts`, `app/api/assignments/route.ts`, `app/api/assignments/[id]/accept/route.ts` — all join `drivers` to read `vehicle`/`plate`.
- Notification producer: `lib/n8n/client.ts` imports nothing for vehicles (pure value passing); `app/api/bookings/driver-assigned/route.ts` imports `@/lib/n8n/client` and supplies `vehicle`/`licensePlate` from the request body.
- No file imports a vehicle service or vehicle table because none exists. The `vehicle`/`plate` columns on `drivers` are the entire "vehicle" implementation today.
