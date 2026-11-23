# Plan 011: Add Chat Rating Endpoint and Admin Finalize Button (Spec 017 Completion)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/chat/ app/admin/ia-chat/ lib/services/rating-service.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 005 (chat send args fix) — chat must escalate correctly for ratings to matter
- **Category**: direction
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The ChatWidget already shows a 5-star survey screen when a conversation closes or becomes inactive. The ratings table (`conversation_ratings`) and migration (`021_ratings_table.sql`) exist. But the POST `/api/chat/rating` endpoint is missing — survey submissions fail with 404. Users fill out the rating form and see a silent failure. Additionally, the admin IA chat page lacks a "finalize" button to mark conversations as resolved, so admins cannot clean up closed conversations.

## Current state

- ChatWidget renders SurveyScreen when conversation closes → calls POST `/api/chat/rating` → gets 404
- No `app/api/chat/rating/` directory exists
- `lib/services/rating-service.ts` already has rating CRUD functions (file exists)
- `lib/db/migrations/021_ratings_table.sql` already creates the `conversation_ratings` table
- Migration `022_conversation_response_time.sql` adds response time tracking columns
- Admin IA chat page (`app/admin/ia-chat/page.tsx`) has no "finalize" or close conversation button in the message area
- Spec `017-real-time-support-chat/plan.md` documents the full spec with all implementation details

**Existing rating service** (`lib/services/rating-service.ts` — verify the exact exported functions):
- Likely has `createRating`, `getRatings`, `getRatingStats` functions
- Uses `getDb()` to query/manage the `conversation_ratings` table

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- Create `app/api/chat/rating/route.ts` — POST endpoint for survey submission
- `app/admin/ia-chat/page.tsx` — add finalize button for closing conversations
- `middleware.ts` — add `/api/chat/rating` to public routes if needed

**Out of scope**:
- ChatWidget changes (it already calls the endpoint correctly)
- Admin pages other than ia-chat
- The ratings admin page or analytics integration

## Git workflow

- Branch: `feat/011-chat-rating-endpoint`
- Commit per step; message: `feat: add chat rating POST endpoint` + `feat: add finalize button to admin chat page`
- Do NOT push or open a PR

## Steps

### Step 1: Create chat rating API route

Create `app/api/chat/rating/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversationId, rating, comment } = body

    if (!conversationId || !rating) {
      return NextResponse.json({ error: 'conversationId and rating are required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `INSERT INTO conversation_ratings (conversation_id, rating, comment, created_at)
            VALUES (?, ?, ?, datetime('now'))`,
      args: [conversationId, rating, comment || null],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Rating API] error:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
```

Check `lib/services/rating-service.ts` for an existing `createRating` function — if it already exists, use it instead of inline SQL.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 2: Expose rating route in middleware

If `app/api/chat/rating` needs to be publicly accessible (unauthenticated web chat users), add it to the `isPublicRoute` matcher in `middleware.ts`:
```ts
'/api/chat/rating',
```

Check the existing public routes at `middleware.ts:4-16` — `/api/chat/start` and `/api/chat/send` are already there; add `/api/chat/rating` if it should be unauthenticated.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 3: Add finalize button to admin chat page

In `app/admin/ia-chat/page.tsx`, find the conversation detail panel and add a "Finalizar" or "Close" button that calls:
```ts
await fetch(`/api/chat/close`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversationId: selectedConv.id }),
})
```
This button should appear when the conversation is in `ai_active`, `escalated`, or `human_active` status. After clicking, update the local conversation status to `closed` and show a toast.

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all existing tests pass.
- Manual verification: the ChatWidget survey submit flow now returns 200 instead of 404.
- Admin can close conversations from ia-chat page.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `app/api/chat/rating/route.ts` exists and accepts POST with `{ conversationId, rating, comment? }`
- [ ] Admin IA chat page has a finalize/close button for active conversations
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The ChatWidget's survey submission URL doesn't match `/api/chat/rating` — check `ChatWidget.tsx` for the exact endpoint and adjust accordingly.
- `lib/services/rating-service.ts` exports a different function signature for rating creation — prefer using the existing service function over inline SQL.
- A close conversation endpoint (`/api/chat/close`) already exists — use it instead of creating another one.
- A verification fails twice.

## Maintenance notes

- The rating endpoint is a simple INSERT — if analytics dashboards are added later, they'll query this table.
- The finalize button triggers `conversation_ratings` insertion via the ChatWidget's existing survey flow.
- Spec 017 has additional detail on the expected conversation close flow — reference it if the close endpoint needs more sophistication (e.g. inactivity cleanup, n8n notification).
