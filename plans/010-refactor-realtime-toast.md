# Plan 010: Refactor RealtimeProvider Nesting and Toast Duplication

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/admin/ lib/admin/realtime-context.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The admin layout wraps the entire shell in `<RealtimeProvider>` (15s polling for orders, conversations, notifications, stats), but 8 child pages independently wrap their content in a **second** nested `<RealtimeProvider>`. Each nested instance fires its own independent polling requests — doubling HTTP traffic. The dispatch page adds a **third** polling loop via its own `usePolling` hook (10s interval). Additionally, 10+ admin pages duplicate an inline `showToast` function with `setTimeout` auto-dismiss, while a proper `ToastProvider` already exists in the booking codebase but is never used by admin pages.

## Current state

### Problem 1: Nested RealtimeProvider + duplicate polling

`app/admin/layout.tsx` (around line 213) wraps:
```tsx
<RealtimeProvider>
  {children}
</RealtimeProvider>
```

Then these pages wrap their content in another `<RealtimeProvider>`:
- `app/admin/dispatch/page.tsx` (lines ~236, ~661)
- `app/admin/orders/page.tsx` (lines ~404, ~408)
- `app/admin/team/page.tsx` (lines ~134, ~485)
- `app/admin/reservations/page.tsx` (lines ~204, ~309)
- `app/admin/grid/page.tsx` (lines ~819, ~823)
- `app/admin/intelligence/page.tsx` (lines ~609, ~613)
- `app/admin/ia-chat/page.tsx` (lines ~837, ~917)
- `app/admin/agenda/page.tsx` (lines ~131, ~135)

Additionally, `app/admin/dispatch/` has its own `use-polling.ts` hook with a 10-second interval that poll the realtime API independently.

### Problem 2: Toast logic duplicated across 10+ admin pages

Each page defines its own variant:
```ts
// Typical inline toast pattern (drivers/page.tsx ~line 58):
const showToast = (msg: string) => {
  const id = Date.now()
  setNotif(p => [...p, { id, msg }])
  setTimeout(() => setNotif(p => p.filter(n => n.id !== id)), 3000)
}
```

This appears in `drivers/page.tsx`, `employees/page.tsx`, `team/page.tsx`, `payments/page.tsx`, `settings/page.tsx`, `intelligence/page.tsx`, `grid/page.tsx`, `promotions/page.tsx`, `inventory/page.tsx`, `customers/page.tsx` — with minor variations (3s vs 4s timeout, different state shapes).

### ToastProvider already exists

`app/components/booking/lib/toast.tsx` has a proper `ToastProvider` + `useToast` but is never imported in admin pages.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/admin/layout.tsx` — keep single RealtimeProvider
- Remove nested `<RealtimeProvider>` wrappers from: dispatch, orders, team, reservations, grid, intelligence, ia-chat, agenda page files
- `app/admin/dispatch/use-polling.ts` — delete or integrate into RealtimeProvider
- Create `lib/admin/toast.tsx` — ToastContext + ToastProvider (adapted from booking version)
- Update 10+ admin pages to use the shared toast instead of inline `showToast`
- `lib/admin/realtime-context.tsx` — optionally add dispatch-specific polling data if needed

**Out of scope**:
- Refactoring the dispatch page's own notification system (`addNotif`) — that's separate from the toast
- Styling changes to the toast component itself
- The booking app's toast components (leave unchanged)
- Admin UI redesign (ARCH-04 is a separate larger plan)

## Git workflow

- Branch: `refactor/010-realtime-toast-dedup`
- Commit per logical step; message style: conventional commits
- Do NOT push or open a PR

## Steps

### Step 1: Create shared toast provider

Create `lib/admin/toast-context.tsx`:
```tsx
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: string
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string) => {
    const id = Date.now().toString(36)
    setToasts(p => [...p, { id, message }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 2: Wire ToastProvider in admin layout

In `app/admin/layout.tsx`, import and wrap:
```tsx
import { ToastProvider } from '@/lib/admin/toast-context'

// Inside the return, wrap children:
<RealtimeProvider>
  <ToastProvider>
    {children}
  </ToastProvider>
</RealtimeProvider>
```

Also add a fixed-position toast container in the layout that renders `toasts` from `useToast()`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 3: Remove nested RealtimeProvider wrappers

For each of the 8 pages listed in "Current state", remove the inner `<RealtimeProvider>` wrapper — the layout already provides it. For example in `app/admin/dispatch/page.tsx`, change from:
```tsx
return (
  <RealtimeProvider>
    <div className=...
  </RealtimeProvider>
)
```
to:
```tsx
return (
  <div className=...
)
```

Also in dispatch, if `usePolling` is redundant with the RealtimeProvider's polling, remove the `use-polling.ts` import and calls. Note: the dispatch page's OWN `addNotif` system is separate and can remain.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 4: Replace inline toast with shared toast in admin pages

For each of the 10+ pages with inline `showToast`, replace the local implementation with:
```tsx
import { useToast } from '@/lib/admin/toast-context'
// ...
const { showToast } = useToast()
```

Remove the local `showToast` function and its state (`setNotif`, `notif` state if only used for toast).

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all 57+ tests pass (no admin page tests exist yet; those are Plan 008).
- The changes are structural (provider hierarchy, toast sharing) — no logic changes to the polling or data flow.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `lib/admin/toast-context.tsx` created with `ToastProvider` and `useToast`
- [ ] Admin layout wraps children in single `ToastProvider`
- [ ] No admin page has a nested `<RealtimeProvider>` wrapper (all 8 pages cleaned)
- [ ] `app/admin/dispatch/use-polling.ts` either removed or no longer actively polled alongside RealtimeProvider
- [ ] No inline `showToast` implementations remain in admin pages (they use the shared one)
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The dispatch page's `usePolling` hook serves data that `RealtimeProvider` doesn't provide — in that case, keep it but remove the `RealtimeProvider` nest only.
- Removing nested `RealtimeProvider` from a page causes a TypeScript error because the page relied on the nested provider's return value — check each page individually.
- A page's inline toast uses a different auto-dismiss timeout intentionally (e.g. 4s instead of 3s) — standardize to 3s or note the exception.
- A verification fails twice.

## Maintenance notes

- New admin pages should NOT wrap their content in `RealtimeProvider` — the layout handles it.
- The toast container rendering is expected to be done once in the layout. If pages need custom toast positioning, they can render their own toast list from `useToast()`.
- Reviewer: verify that the nested provider removal doesn't break any page's data access — React context nesting makes parent providers available to children automatically.
