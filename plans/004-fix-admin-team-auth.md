# Plan 004: Fix Admin Team GET Route — Missing Authentication Check

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/admin/team/route.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The `GET /api/admin/team` handler executes a database query returning all employees' names, email addresses, role names, and order assignment counts — without any authentication check. The POST handler on the same file correctly calls `auth()`. This means anyone who discovers the URL can enumerate the full employee roster. Admin routes are partially protected by the middleware (which uses Clerk), but this specific route's GET handler bypasses the intended check. Adding the auth guard matches the pattern used by every other admin API route.

## Current state

`app/api/admin/team/route.ts`, lines 5-26:
```ts
export async function GET() {
  const db = getDb()                                      // ← No auth() call!

  const result = await db.execute(`
    SELECT
      u.id, u.name, u.email, u.status, u.last_login_at, u.created_at,
      GROUP_CONCAT(r.name) as roles,
      (SELECT COUNT(*) FROM orders WHERE assigned_to = u.id) as orders_assigned
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
    ORDER BY u.name
  `)

  return NextResponse.json(result.rows)
}
```

Compare with the POST handler on the same file (lines 28-33):
```ts
export async function POST(req: Request) {
  try {
    const { userId } = await auth()                       // ← Auth check present
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/api/admin/team/route.ts` — GET handler only

**Out of scope**:
- Other admin API routes (each should already have auth — this is the only missing one found)
- The middleware.ts or Clerk configuration

## Git workflow

- Branch: `fix/004-admin-team-auth`
- Commit message: `fix: add missing auth check to admin team GET route exposing employee data`
- Do NOT push or open a PR

## Steps

### Step 1: Add auth check at the top of the GET handler

Change the GET handler from:
```ts
export async function GET() {
  const db = getDb()
```
to:
```ts
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all 57+ tests pass.
- No existing tests for this route — coverage is in Plan 009.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] The GET handler in `app/api/admin/team/route.ts` calls `auth()` and returns 401 if `userId` is falsy
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The code at the cited locations doesn't match the excerpts.
- `auth()` is already called in the GET handler (the drift check would show changes).
- The import for `auth` is missing from `@clerk/nextjs/server` (should already be there from the POST handler).
- A verification fails twice.

## Maintenance notes

- This was a simple omission — reviewer should confirm no other admin GET routes lack auth checks (spot-check a few).
- The `isAdminApiRoute` matcher in `middleware.ts` provides middleware-level protection, but the route should still self-protect as a defense-in-depth measure.
