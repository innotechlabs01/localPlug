# UI — Component Inventory

Shared primitives live in `packages/ui` (optional) and are reused across portals.

## Primitives
- `Button` — primary/secondary/danger, loading state
- `Input` / `TextField` — 44px, error state
- `Card` — selected/disabled
- `Toggle` — 44×24px switch
- `Modal` / `Sheet` — bottom sheet for mobile
- `Toast` — via notification domain
- `Avatar` — driver/customer

## App-specific components
- Driver Portal: `AvailabilityToggle`, `AssignmentCard`, `TripTracker`,
  `EarningsSummary`, `NotificationList`
- Admin Portal: `DispatchBoard`, `DriverTable`, `BookingTable`, `StatsPanel`

## Rules
- UI contains presentation logic only — never business rules.
- Prefer shared primitives; duplicate only when visuals diverge.
- One component per file; keep under 200 lines.
- See `../03-engineering/coding-standards.md` and `ux-flows.md`.
