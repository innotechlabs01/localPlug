# Plan 012: Fix Admin Sidebar Route Mismatches and Deduplicate Chat Pages

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/admin/layout.tsx app/admin/support/ app/admin/logistics/ app/admin/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The admin sidebar has 5 route mismatches where the navigation label points to a URL that shows either a different page or a "Coming Soon" placeholder. This confuses admins and undermines trust. Additionally, there are two separate chat pages: `/admin/support` (156 lines of hardcoded mock data) and `/admin/ia-chat` (919 lines, real DB integration). The sidebar links to `ia-chat` for support, but `/admin/support` is still accessible — anyone navigating there sees fake conversations.

## Current state

### Route mismatches in `app/admin/layout.tsx`

The page title map (around line 250) maps:
- `t.admin.nav.reservations` → `/admin/orders` but there's a real `/admin/reservations` page
- `t.admin.nav.fleet` → `/admin/logistics` (Coming Soon placeholder) but `/admin/fleet` exists
- `t.admin.nav.employees` → `/admin/team` but `/admin/employees` exists
- `t.admin.nav.analytics` → `/admin/intelligence` (Coming Soon placeholder) but `/admin/analytics` exists
- `t.admin.nav.payments` → `/admin/grid` (Coming Soon placeholder) but `/admin/payments` exists

The `next.config.js` already has redirects:
```js
async redirects() {
  return [
    { source: '/admin/logistics', destination: '/admin/fleet', permanent: true },
    { source: '/admin/grid', destination: '/admin/payments', permanent: true },
    { source: '/admin/team', destination: '/admin/employees', permanent: true },
  ]
},
```

So the redirects exist but the sidebar labels still point to the wrong (redirected) URLs.

### Chat page duplication

`app/admin/support/page.tsx` (~156 lines): Hardcoded mock conversations, never connects to DB.
`app/admin/ia-chat/page.tsx` (~919 lines): Real database integration with status filters, agent assignment, AI takeover/release.

### Coming Soon placeholders still in i18n

`lib/i18n/locales/en.ts` lines 1009-1019 define placeholder text for: intelligence, logistics, grid, and dispatch. Dispatch is fully functional.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/admin/layout.tsx` — fix sidebar hrefs to point to correct pages
- `app/admin/support/page.tsx` — add redirect to `/admin/ia-chat`
- `app/admin/logistics/page.tsx` — already redirected in next.config.js but mark as handled

**Out of scope**:
- Adding content to Coming Soon placeholder pages (separate feature work)
- Refactoring the navigation data structure
- Creating a shared nav config

## Git workflow

- Branch: `fix/012-admin-sidebar-routes`
- Commit per step; message: `fix: correct admin sidebar navigation hrefs` + `fix: redirect /admin/support to /admin/ia-chat`
- Do NOT push or open a PR

## Steps

### Step 1: Fix sidebar hrefs in admin layout

In `app/admin/layout.tsx`, update the nav items to point to correct URLs:

| Current href | Current label | New href | New label |
|-------------|---------------|----------|-----------|
| `/admin/orders` | Reservations | `/admin/reservations` | Reservations |
| `/admin/logistics` | Fleet | `/admin/fleet` | Fleet |
| `/admin/team` | Employees | `/admin/employees` | Employees |
| `/admin/intelligence` | Analytics | `/admin/analytics` | Analytics |
| `/admin/grid` | Payments | `/admin/payments` | Payments |

Find the nav section definitions (around lines 18-160 in `app/admin/layout.tsx`) and update the `href` values. The `labelKey` values can stay the same — they pull from i18n which already has the correct labels.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 2: Redirect /admin/support to /admin/ia-chat

Replace the entire content of `app/admin/support/page.tsx` with a redirect:
```tsx
import { redirect } from 'next/navigation'

export default function SupportPage() {
  redirect('/admin/ia-chat')
}
```

Alternatively, add a redirect in `next.config.js`:
```js
{ source: '/admin/support', destination: '/admin/ia-chat', permanent: true },
```

The `next.config.js` approach is cleaner — it works for all HTTP methods and doesn't render. Choose the redirect approach.

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

### Step 3: Update i18n placeholders (optional)

In `lib/i18n/locales/en.ts` and `es.ts`, update the `placeholders` section to remove `dispatch` from the coming-soon list since it's now fully functional. Change:
```ts
dispatch: 'Real-time dispatch and team coordination',
dispatchDesc: '...',
```
to an empty string or remove the keys if they're no longer referenced. Check first that no page references `t.admin.placeholders.dispatch` before removing.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

## Test plan

- Run `pnpm test` — all existing tests pass.
- Manual verification: clicking each sidebar link takes you to the correct page.
- Manual verification: navigating to `/admin/support` redirects to `/admin/ia-chat`.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] Sidebar "Reservations" href → `/admin/reservations`
- [ ] Sidebar "Fleet" href → `/admin/fleet`
- [ ] Sidebar "Employees" href → `/admin/employees`
- [ ] Sidebar "Analytics" href → `/admin/analytics`
- [ ] Sidebar "Payments" href → `/admin/payments`
- [ ] `/admin/support` redirects to `/admin/ia-chat`
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- Some of the "new" hrefs don't exist yet (e.g. `/admin/reservations` is a real page already — verify by checking the directory exists at `app/admin/reservations/`).
- The nav section structure has been refactored since this plan was written — find the correct location of href definitions in `layout.tsx`.
- A verification fails twice.

## Maintenance notes

- When adding new admin pages: add the sidebar link with the correct href from the start.
- The `next.config.js` redirects for `/admin/logistics`, `/admin/grid`, and `/admin/team` become fallbacks — they'll still work if someone has the old URLs bookmarked.
- Reviewer: check that the "Coming Soon" placeholder pages (`/admin/logistics`, `/admin/grid`, `/admin/intelligence`) either have real content or a redirect. Currently `/admin/logistics` still has a placeholder despite being linked as "Fleet" in the sidebar — verify the redirect works.
