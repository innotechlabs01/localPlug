# Plan 006: Fix Rate Limiter — Add Periodic Map Cleanup and Document Limitations

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- lib/rate-limit.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The `lib/rate-limit.ts` module uses a module-level `Map<string, { count, resetAt }>` that never prunes expired entries. Every unique IP that hits the rate-limited booking endpoint adds an entry that lives forever. On a single-instance deployment this is a slow memory leak; on Vercel's serverless (multi-instance) architecture, each cold-start instance has its own independent Map, making the rate limit effectively per-instance rather than global — a determined actor can hit each instance 20 req/s by cycling through IPs.

## Current state

`lib/rate-limit.ts`:
```ts
const requestCounts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}
```

The Map is never cleaned up. Over hours of operation with many unique visitors, it grows unbounded.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `lib/rate-limit.ts` — add periodic cleanup and inline documentation

**Out of scope**:
- Replacing the rate limiter with an external store (Redis/Upstash) — that's a future concern
- Adding tests for the rate limiter (can be done alongside this fix or in a separate plan)
- Changing the rate limit window or max request values

## Git workflow

- Branch: `fix/006-rate-limiter-cleanup`
- Commit message: `fix: add periodic cleanup to rate limiter Map to prevent memory leak`
- Do NOT push or open a PR

## Steps

### Step 1: Add cleanup function and periodic interval

Add the following code after the `const MAX_REQUESTS` declaration at line 4:

```ts
// Periodically purge expired entries to prevent unbounded Map growth.
// This is a single-instance limiter — in multi-instance deployments (Vercel),
// each instance has its own independent Map, making the rate limit
// per-instance rather than global. For production multi-instance,
// replace with an external store (Upstash/Redis).
const CLEANUP_INTERVAL = 60_000 // match the window

function cleanupExpired(): void {
  const now = Date.now()
  for (const [ip, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(ip)
    }
  }
}
```

### Step 2: Start the cleanup interval

Add after the `cleanupExpired` function:
```ts
// Use setInterval if available (Node.js/browser); no-op in edge runtime
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, CLEANUP_INTERVAL)
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all 57+ tests pass. No existing tests for the rate limiter exist, but the function is a pure state transformation that doesn't depend on the cleanup interval.
- The `setInterval` is guarded by `typeof setInterval !== 'undefined'` so it won't throw in edge runtime environments where it's not available.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `lib/rate-limit.ts` contains a `cleanupExpired` function that deletes Map entries whose `resetAt` is in the past
- [ ] A periodic interval calls `cleanupExpired` every 60s when `setInterval` is available
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The module already has cleanup logic (drift).
- The `setInterval` guard causes type issues — in that case, use a conditional `if (typeof globalThis.setInterval === 'function')` instead.
- A verification fails twice.

## Maintenance notes

- This is a tactical fix. If the app scales to multiple instances, replace with Upstash Ratelimit or similar.
- The comment blocks serve as a TODO marker for the production improvement.
