# Plan 008: Add Test Coverage for Highest-Churn Admin API Routes

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/admin/dispatch/ app/api/admin/reservations/ app/api/admin/payments/ app/api/admin/orders/ app/api/admin/team/ app/api/admin/drivers/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plan 003 (payments division fix) — test will need correct values
- **Category**: tests
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

There are 34 admin API route files across 15 directories with zero test coverage. These routes handle all data mutation for dispatch (driver assignment), reservations (CRUD), payments (KPI aggregation, financials), orders, drivers (compliance, vehicle management), and team management. They have the highest churn in git history — meaning the highest risk of regression. A test suite for the top 5 most critical routes provides a safety net for the most operationally sensitive admin functions.

## Current state

**Highest-priority routes to test**:

| Route | Lines | Churn | Risk if broken |
|-------|-------|-------|----------------|
| `app/api/admin/dispatch/route.ts` | 221 | 5 commits | Can't assign/unassign drivers, no n8n triggers |
| `app/api/admin/reservations/route.ts` | 222 | heavy | Can't manage bookings |
| `app/api/admin/payments/route.ts` | 151 | med | Wrong financial KPIs |
| `app/api/admin/orders/route.ts` | 42 | med | Can't query orders |
| `app/api/admin/team/route.ts` | 71 | low | Employee CRUD broken |

**Existing test pattern**: `tests/app/api/webhooks/n8n/route.test.ts` uses `vi.mock()` for `@/lib/db` and `@clerk/nextjs/server`:
```ts
vi.mock('@/lib/db', () => ({ getDb: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(() => ({ userId: 'test-user' })) }))
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Tests | `pnpm test` | all pass |
| Run specific | `pnpm test -- tests/app/api/admin/` | targeted tests pass |

## Scope

**In scope**:
- Create `tests/app/api/admin/dispatch/route.test.ts`
- Create `tests/app/api/admin/reservations/route.test.ts`
- Create `tests/app/api/admin/payments/route.test.ts`
- Create `tests/app/api/admin/orders/route.test.ts`
- Create `tests/app/api/admin/team/route.test.ts`

**Out of scope**:
- Admin page component tests (22 admin page directories — out of scope for this plan)
- Lower-churn admin routes (agenda, analytics, cases, customers, employees, ia-chat, settings, stats)
- Production code changes

## Git workflow

- Branch: `tests/008-admin-api-routes`
- Commit per route suite; message: `test: add admin {route} API test suite`
- Do NOT push or open a PR

## Steps

### Step 1: Create dispatch route test

Create `tests/app/api/admin/dispatch/route.test.ts`.

Mock: `@/lib/db` (return controlled rows), `@clerk/nextjs/server` (return userId), `@/lib/n8n/client` (return ok).

Test cases for GET:
1. Returns orders and drivers sorted by dispatch_status filter
2. Filters by search term (customer_name, flight_number)
3. Returns counts (pending, assigned, enroute)
4. Returns empty arrays when no data matches

Test cases for PUT with `action: 'assign'`:
1. Assigns a driver to an order → returns success, updates DB
2. Driver not found → returns 404
3. Order not found → returns 404
4. Auth fails → returns 401

Test cases for PUT with `action: 'unassign'`:
1. Unassigns successfully
2. Order not found → returns 404

Test cases for PUT with `action: 'status'`:
1. Updates status from pending → enroute → pickedup → completed
2. Invalid status transition → returns 400

**Verify**: `pnpm test -- tests/app/api/admin/dispatch/` → all pass

### Step 2: Create reservations route test

Create `tests/app/api/admin/reservations/route.test.ts`.

Mock the same dependencies. Test GET with various query filters, POST creating a reservation, PUT updating, DELETE.

Key test cases:
1. GET returns all reservations with correct joins
2. GET filters by date range, status, search
3. POST creates reservation with validation
4. POST missing required fields → 400
5. PUT updates reservation fields
6. DELETE soft-deletes or removes reservation

**Verify**: `pnpm test -- tests/app/api/admin/reservations/` → all pass

### Step 3: Create payments route test

Create `tests/app/api/admin/payments/route.test.ts`.

Key test cases (after Plan 003 fix is applied):
1. GET returns all KPI values with correct formatting
2. `totalRevenue` = completed payments SUM / 100 (payments.amount is cents)
3. `driverPayouts` = SUM(package_price) without division (orders.package_price is dollars)
4. `stripeBalance` = totalRevenue - driverPayouts
5. Revenue breakdown by service (package_name grouping)
6. Transaction list with status filter
7. Empty data edge case (no payments yet)

**Verify**: `pnpm test -- tests/app/api/admin/payments/` → all pass

### Step 4: Create orders and team route tests

Create `tests/app/api/admin/orders/route.test.ts` and `tests/app/api/admin/team/route.test.ts`.

Orders: GET with filters, pagination, status counts.
Team (with post-Plan 004 fix): GET returns 401 when unauthenticated, GET returns employee list when authenticated, POST creates employee with validation.

**Verify**: `pnpm test` → all tests (old + new) pass

## Test plan

- ~40-60 new tests across 5 test files
- All use `vi.mock()` for DB and auth — no real database
- Mock return shapes should match what the routes expect (examine the route's query results and response JSON)
- Run full suite to confirm no regressions

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0 with increased test count (57 + ~40-60 new)
- [ ] Each test file covers: auth rejection (401), success path, each error path
- [ ] No production code files are modified
- [ ] Team route test confirms Plan 004 fix (GET returns 401 without auth)

## STOP conditions

Stop and report back if:
- The route implementations have changed significantly (drift).
- Mocking `getDb()` for complex SQL JOIN queries proves impractical — in that case, mock at the raw query result level (return an array of row objects).
- A test file exceeds 300 lines — split into multiple files per route section.
- A verification fails twice.

## Maintenance notes

- These characterization tests serve as regression guards. When routes are refactored, update the expected shapes.
- The dispatch route has the most complex state machine (assign → enroute → pickedup → completed) — test all transitions.
- Reviewer: ensure the payments test verifies the correct division behavior (the bug fixed in Plan 003).
