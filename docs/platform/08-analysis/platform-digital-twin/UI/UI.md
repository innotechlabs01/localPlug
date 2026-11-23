# UI (Real — Digital Twin)

> Source of truth for the **real** UI surface today (Next.js App Router pages + components under
> `app/`, `app/components/`, `app/admin/`, `app/hooks/`). No code changes. Derived from
> `FILES/INVENTORY.md` (UI group, 30 files) + `MODULES/*.md`.

## Pages (real)
| Area | Real files | Embeds business logic? |
|---|---|---|
| Landing | `app/page.tsx` (+ `app/components/hero`, `booking`, `pricing`, `testimonials`, `how-it-works`, `stats`, `about`, `experiences`, `cta`, `layout`) | Light (booking-form is heavy — 16 out-edges) |
| Booking (customer) | `app/booking/page.tsx`, `app/booking/confirmation/page.tsx`, `app/components/booking/*` | **Yes** — `booking-form.tsx` holds validation + persistence + pricing display |
| Admin shell | `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/grid/page.tsx` | Shell only |
| Admin sections | `app/admin/{reservations,orders,dispatch,drivers,customers,hotels,rooms,promotions,payments,cases,agenda,intelligence,logistics,support,settings,team,employees,roles,analytics,fleet,inventory,ia-chat}/*` | **Yes** — many pages call admin-fetch + contain orchestration that belongs in domains |
| Auth | `app/sign-in/[[...sign-in]]`, `app/reset-password` | Clerk UI |
| Errors | `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` | — |

## Components (real)
- `app/components/ui/*` — shared UI primitives (button in-degree 6). → `packages/ui`.
- `app/components/booking/*` — booking form + lib/types (in-degree 7). → `apps/customer` + `domains/booking`.
- `app/components/ratings/*`, `app/components/chat/*`, `app/components/admin/*` — feature UI.
- `app/components/{hero,pricing,testimonials,...}` — landing sections. → `apps/landing`.

## Hooks / context (real)
- `app/hooks/use-scroll-reveal.ts` (in-degree 7) — presentation only.
- `lib/admin/realtime-context.tsx`, `lib/admin/toast-context.tsx`, `lib/admin/date-filter-context.tsx`
  — admin cross-cutting state (realtime = polling; see `WEBSOCKETS.md`).

## Observations (real)
- Admin pages are the **thickest UI**: they fetch via `lib/admin/admin-fetch` and embed flow
  logic that, in 2C, moves into domains and thin Server Components (`apps/admin` becomes a
  consumer only — Epic 5).
- `booking-form.tsx` is a hotspot (16 outgoing imports): booking validation/state/persistence
  live in the component today; 2C extracts them to `domains/booking` + `apps/customer`.
- UI imports `lib/db.ts`? No — but `app/admin/*` pages reach DB indirectly through API routes;
  the risk is the **browser bundle importing `lib/db.ts`** directly (in-degree 78 includes some
  client components) — tracked in `DATABASE/DATABASE.md`.
