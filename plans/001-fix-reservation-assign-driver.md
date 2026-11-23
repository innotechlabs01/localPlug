# Plan 001: Fix Reservation Assign-Driver Route — Path Params

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/admin/reservations/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The `[id]/assign-driver/route.ts` endpoint is the admin's primary mechanism for assigning drivers to reservations. A bug in how it reads the reservation ID means the route always returns 400 "Reservation ID required" — driver assignment from this endpoint is completely non-functional. This blocks the entire admin driver assignment workflow.

## Current state

**The buggy file**: `app/api/admin/reservations/[id]/assign-driver/route.ts`

Current handler (line 5-15):
```ts
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const reservationId = searchParams.get('id')
    
    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 })
    }
    // ... rest of handler
```

In Next.js App Router, dynamic route params (`[id]`) are passed as the second argument to the handler function — NOT via URL search params. `searchParams.get('id')` reads the query string, which is always empty since `id` is a path segment.

**Working example elsewhere**: `app/api/admin/drivers/[id]/route.ts` presumably uses the correct pattern (verify before editing).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no errors |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all 57+ pass |

## Scope

**In scope**:
- `app/api/admin/reservations/[id]/assign-driver/route.ts` — only file to modify

**Out of scope**:
- Any other reservation routes
- Any other assign-driver routes
- Changes to the driver assignment UI or data flow

## Git workflow

- Branch: `fix/001-reservation-assign-driver-params`
- Commit message style: conventional commits (`fix: correct assign-driver route to use path params instead of search params`)
- Do NOT push or open a PR

## Steps

### Step 1: Fix the handler signature to receive Next.js path params

Change the handler from:
```ts
export async function POST(req: Request) {
```
to:
```ts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
```

### Step 2: Replace searchParams.get('id') with params.id

Change lines 10-15 from:
```ts
const { searchParams } = new URL(req.url)
const reservationId = searchParams.get('id')

if (!reservationId) {
  return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 })
}
```
to:
```ts
const { id: reservationId } = await params

if (!reservationId) {
  return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 })
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0, no errors
**Verify**: `pnpm lint` → exit 0

## Test plan

- The existing test suite (`pnpm test`) covers other parts of the app — verify it still passes.
- No new tests for this fix (the route has no existing tests; adding them is covered in Plan 008).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `app/api/admin/reservations/[id]/assign-driver/route.ts` no longer references `searchParams`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:
- The code at the locations in "Current state" doesn't match the excerpts — the codebase may have drifted.
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.
- The `params` approach in Next.js 15 differs from what's described (Next.js 15.5 uses `Promise<{ id: string }>` for the params type; if your version differs, check the signature in a known working route handler).

## Maintenance notes

- If more reservation sub-routes are added, ensure they follow the same `params` pattern.
- Reviewer should verify the route now returns `{ success: true }` when called with a valid reservation ID and driver ID in the body.
