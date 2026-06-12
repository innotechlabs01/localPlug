# Plan 002: Fix Dashboard Driver Assignment — Sends Name Instead of Driver ID

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/admin/page.tsx app/api/admin/dispatch/route.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The admin dashboard's driver assignment modal passes the driver's **name string** (e.g. "Carlos Mendoza") as `driverId` to the dispatch API. The dispatch API then queries `WHERE id = ?` expecting a numeric database ID. Driver assignment from the main dashboard always fails with "Driver not found" — the primary admin action is broken.

## Current state

`app/admin/page.tsx`, lines 196-210:
```ts
const handleConfirmAssignment = useCallback(async () => {
  if (!selectedDriver || !assignedBookingRef) {
    setToast({ message: 'Please select a driver' })
    return
  }
  try {
    const driverObj = drivers.find(d => d.name === selectedDriver)
    const res = await adminFetch('/api/admin/dispatch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'assign', 
        orderId: parseInt(assignedBookingRef.replace('ORD-', '') || assignedBookingRef),
        driverId: driverObj?.name   // ← BUG: sends name string, not DB id
      })
    })
```

The `drivers` array is fetched from the dispatch API and likely has `id` and `name` properties. `driverObj?.name` returns the driver's display name.

The dispatch API at `app/api/admin/dispatch/route.ts` expects a numeric driver ID:
```ts
// line ~102
sql: `SELECT * FROM drivers WHERE id = ?`,
args: [driverId]
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no errors |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/admin/page.tsx` — fix the driver ID being sent

**Out of scope**:
- The dispatch API route (`app/api/admin/dispatch/route.ts`) — it correctly expects an ID
- Other admin pages that assign drivers
- The driver data model

## Git workflow

- Branch: `fix/002-dashboard-driver-assignment-id`
- Commit message: `fix: send driver DB id instead of driver name in dashboard assignment`
- Do NOT push or open a PR

## Steps

### Step 1: Fix the driverId payload

In `app/admin/page.tsx`, line 209, change:
```ts
driverId: driverObj?.name
```
to:
```ts
driverId: driverObj?.id
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all passing tests should continue to pass.
- Manually verify the fix compiles correctly (typecheck already confirms `driverObj` has an `id` property).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] Line `driverId: driverObj?.name` no longer exists in `app/admin/page.tsx` — replaced with `driverObj?.id`
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The code at the cited lines doesn't match (the drivers data model may have changed).
- `driverObj` doesn't have an `id` property — check the `drivers` fetch response and the `Booking` interface at the top of the file.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If the drivers API response ever changes its primary key name from `id` to something else, this needs updating.
- The same pattern may exist in other admin pages — this plan covers only the main dashboard page.
