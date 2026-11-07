# Plan 005: Fix Chat Send Escalation SQL Args and ReleaseToAIMode Arg Order

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/chat/send/route.ts lib/services/chat-service.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

Two bugs in the chat system prevent proper escalation of low-confidence AI responses and block admin release of conversations back to AI mode:

1. **Escalation SQL (chat send route)**: When the AI returns a low-confidence response (< 0.5), the SQL to escalate has 1 placeholder but receives 2 arguments. The correct pattern on the same file (line 301-306 for the Ollama fallback) shows what it should be. Result: low-confidence AI responses are never escalated, leaving customers stuck with failing AI.

2. **Release to AI mode arg order (chat service)**: The `releaseToAIMode` function passes `[agentId, conversationId]` but the SQL expects `WHERE id = ? AND assigned_agent_id = ?`, meaning it needs `[conversationId, agentId]`. Result: releasing conversation back to AI fails.

## Current state

### Bug 1: Chat send route — escalation SQL args mismatch

`app/api/chat/send/route.ts`, lines 245-251:
```ts
if (n8nResult.confidence && n8nResult.confidence < 0.5) {
  await db.execute({
    sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now')
          WHERE id = ? AND status = 'ai_active'`,
    args: [n8nResult.confidence, convId],     // ← BUG: 2 args for 1 placeholder
  })
}
```

Correct pattern on lines 301-306 (Ollama fallback path):
```ts
if (ollamaResult.confidence < 0.5) {
  await db.execute({
    sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now')
          WHERE id = ? AND status = 'ai_active'`,
    args: [convId],                           // ← CORRECT: 1 arg for 1 placeholder
  })
}
```

### Bug 2: Chat service — releaseToAIMode args order

`lib/services/chat-service.ts`, lines 93-104:
```ts
const result = await getDb().execute({
  sql: `
    UPDATE conversations 
    SET status = 'ai_active', 
        assigned_agent_id = NULL, 
        assigned_at = NULL,
        updated_at = datetime('now')
    WHERE id = ? AND assigned_agent_id = ? AND status = 'human_active'
  `,
  args: [agentId, conversationId]            // ← BUG: Should be [conversationId, agentId]
})
```

SQL placeholder order: `id = ?` first, then `assigned_agent_id = ?`. Args should be `[conversationId, agentId]`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/api/chat/send/route.ts` — line 249 only
- `lib/services/chat-service.ts` — line 103 only

**Out of scope**:
- Other chat route logic
- The n8n webhook handler

## Git workflow

- Branch: `fix/005-chat-sql-args`
- Commit message: `fix: correct SQL argument order in chat escalation and releaseToAIMode`
- Do NOT push or open a PR

## Steps

### Step 1: Fix chat send route escalation args

In `app/api/chat/send/route.ts`, line 249, change:
```ts
args: [n8nResult.confidence, convId],
```
to:
```ts
args: [convId],
```

### Step 2: Fix chat service releaseToAIMode args

In `lib/services/chat-service.ts`, line 103, change:
```ts
args: [agentId, conversationId]
```
to:
```ts
args: [conversationId, agentId]
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all 57+ tests pass (chat tests are covered in Plan 010, but the fix should not break existing tests).
- Manual code review confirms no other similar arg-order mismatches in the same files.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `app/api/chat/send/route.ts` no longer passes 2 args to a 1-placeholder SQL on the escalation path
- [ ] `lib/services/chat-service.ts` passes `[conversationId, agentId]` not `[agentId, conversationId]`
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The code at the cited locations doesn't match the excerpts.
- You find additional arg-order bugs in the same files (document them and add to the scope).
- The type of `convId` or `agentId` doesn't match what `args` expects (they should be strings/numbers).

## Maintenance notes

- When adding new SQL queries, always match the placeholder order in SQL to the args array order.
- The Ollama fallback path in the same file (lines 301-306) shows the correct pattern for single-placeholder escalation.
