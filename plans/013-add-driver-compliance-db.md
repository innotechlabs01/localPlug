# Plan 013: Add Driver Compliance Database Columns (Spec 012 Phase 2)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- lib/db/migrations/ lib/db.ts scripts/migrate.ts app/admin/drivers/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The admin drivers page already renders compliance status badges (valid/expiring/expired) and has UI panels for document compliance, driver eligibility, and compliance alerts. But the underlying database columns for document expiry dates (`license_expiry`, `soat_expiry`, `tech_inspection_expiry`, `insurance_expiry`) don't exist yet — the compliance UI is purely decorative. Drivers are the core operational unit for a Medellín tourism platform (airport pickups, VIP services, tours). Without real compliance tracking, the admin cannot verify driver eligibility before assignment.

## Current state

**Drivers page UI** (`app/admin/drivers/page.tsx`):
- Renders compliance status per driver (valid/expiring/expired) using hypothetical document dates
- Shows compliance alerts panel with counts
- Displays driver eligibility (airport pickup, VIP, restricted)
- Has a 6-step create modal with fields for: license expiry, SOAT expiry, tech inspection expiry, insurance expiry (step 5)

**Current database schema** (from `lib/db/migrations/013_fix_orders_assigned_fk.sql` — only `orders` table shown; drivers table was created in an earlier migration):
- The `drivers` table likely has basic columns: id, name, phone, email, vehicle, plate, category, status, etc.
- It does NOT have: `license_expiry`, `soat_expiry`, `tech_inspection_expiry`, `insurance_expiry`, `doc_status`, `compliance_score`, `last_compliance_check`

**Existing migration pattern**: Each migration is a `.sql` file in `lib/db/migrations/` numbered sequentially (current last: `022_conversation_response_time.sql`).

**Existing migrations script**: `scripts/migrate.ts` reads `.sql` files from `lib/db/migrations/` and executes them against Turso.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Migration | `pnpm db:migrate` | applies new migration |

## Scope

**In scope**:
- Create `lib/db/migrations/023_driver_compliance.sql` — add compliance columns to drivers table
- Update `app/api/admin/drivers/` routes to read/write new columns (if they don't already reference them)
- Update `app/api/admin/dispatch/route.ts` if it queries driver compliance

**Out of scope**:
- Changes to the admin drivers page UI (it already renders compliance badges — the data will just start being real)
- Document upload functionality (Phase 3 of Spec 012)
- Performance/analytics tracking (Phase 4)
- Fleet integration (Phase 5)

## Git workflow

- Branch: `feat/013-driver-compliance-db`
- Commit per step; message style: `feat(db): add driver compliance columns` + `fix: wire driver compliance columns into API`
- Do NOT push or open a PR

## Steps

### Step 1: Create migration for driver compliance columns

Create `lib/db/migrations/023_driver_compliance.sql`:
```sql
-- Migration: Add driver compliance and document tracking columns
-- Phase 2 of Spec 012: Document Compliance

ALTER TABLE drivers ADD COLUMN license_expiry TEXT;
ALTER TABLE drivers ADD COLUMN soat_expiry TEXT;
ALTER TABLE drivers ADD COLUMN tech_inspection_expiry TEXT;
ALTER TABLE drivers ADD COLUMN insurance_expiry TEXT;
ALTER TABLE drivers ADD COLUMN doc_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN compliance_score INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN last_compliance_check TEXT;
ALTER TABLE drivers ADD COLUMN emergency_contact TEXT;
ALTER TABLE drivers ADD COLUMN emergency_phone TEXT;
ALTER TABLE drivers ADD COLUMN vehicle_year INTEGER;
ALTER TABLE drivers ADD COLUMN vehicle_capacity TEXT;
ALTER TABLE drivers ADD COLUMN city TEXT DEFAULT 'Medellín';
ALTER TABLE drivers ADD COLUMN experience_level TEXT DEFAULT 'standard';
ALTER TABLE drivers ADD COLUMN photo_url TEXT;
ALTER TABLE drivers ADD COLUMN internal_notes TEXT;

-- Indexes for compliance queries
CREATE INDEX IF NOT EXISTS idx_drivers_doc_status ON drivers(doc_status);
CREATE INDEX IF NOT EXISTS idx_drivers_compliance_score ON drivers(compliance_score);
```

**Note**: Turso/LibSQL uses SQLite under the hood. SQLite does not support `IF NOT EXISTS` for `ALTER TABLE ADD COLUMN` — the migration script handles duplicate column errors gracefully (see `scripts/migrate.ts` line 53: `msg.includes('duplicate column')` → continue).

### Step 2: Update driver API routes for compliance columns

Check `app/api/admin/drivers/route.ts` and related routes. Ensure they:
1. Read the new columns in SELECT queries
2. Accept the new columns in INSERT/UPDATE payloads
3. Compute `doc_status` and `compliance_score` based on expiry dates

Example logic for doc_status computation (add to the GET handler if not already there):
```ts
function computeDocStatus(driver: any): string {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const fields = ['license_expiry', 'soat_expiry', 'tech_inspection_expiry', 'insurance_expiry']
  for (const field of fields) {
    if (!driver[field]) return 'pending'
    const expiry = new Date(driver[field] + 'T23:59:59')
    if (expiry < now) return 'expired'
    if (expiry < in30) return 'expiring'
  }
  return 'valid'
}
```

**Important**: Read the actual driver route file first to understand its current structure — don't apply this logic blindly. The compliance score/doc_status might already be partially implemented.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 3: Run migration

```bash
pnpm db:migrate
```
Expected: migration 023 runs successfully, "duplicate column" errors are skipped if columns already exist.

**Verify**: `pnpm db:status` → shows migration 023 as applied

## Test plan

- Run `pnpm test` — all existing tests pass.
- Manually verify: the drivers page renders real compliance statuses (not just decorative).
- Verify API returns new columns: `curl` or test the GET `/api/admin/drivers` endpoint.

## Done criteria

- [ ] `lib/db/migrations/023_driver_compliance.sql` exists with all compliance columns
- [ ] `pnpm db:migrate` runs successfully
- [ ] `pnpm db:status` shows migration 023 applied
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] Driver API routes handle the new columns in queries

## STOP conditions

Stop and report back if:
- The drivers table schema has already been migrated with these columns (check by looking at the existing migration files and the `drivers` table schema).
- `pnpm db:migrate` fails with an unexpected error — report the error and stop.
- The `app/api/admin/drivers/route.ts` already handles compliance columns (in which case only the migration is needed).
- A verification fails twice.

## Maintenance notes

- The `drivers` table creation SQL may be in an early migration (001-006) that's not in this repo. The alter-statements pattern is designed to be idempotent.
- Phase 3 (document upload) will add file storage columns. Phase 4 (performance analytics) adds revenue/rating aggregation. Those are separate plans.
- Reviewer: verify that existing driver INSERT/UPDATE code doesn't break due to the new NOT NULL DEFAULT columns.
