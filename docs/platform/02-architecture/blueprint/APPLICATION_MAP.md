# APPLICATION_MAP

Applications are **interfaces only**. They render UI, call domains through `packages/api`
(orchestrated routes), and subscribe to `packages/realtime`. They contain **no business logic**.

| App | Future path | Consumes | Auth | Status |
|---|---|---|---|---|
| **admin** | `apps/admin` | Every domain (operations console) | Clerk (employee roles) | Exists → refactored onto domains (Epic 5) |
| **driver** | `apps/driver` | drivers, dispatch, trips, payments, notifications, vehicles, auth | Clerk + WhatsApp OTP (driver) | **New** (Epic 6) |
| **customer** | `apps/customer` | booking, payments, customers, notifications, trips | Clerk + WhatsApp OTP (customer) | Exists as `app/booking` → extracted (Epic 7) |
| **landing** | `apps/landing` | content (read-only), concierge/chat, ratings, hotels | public | Exists as `app/page.tsx` + sections → extracted (Epic 6) |

## What moves where (current → app)
- `app/admin/*` → `apps/admin` (UI becomes domain consumer; embedded logic Split to domains).
- `app/booking/*` + `app/components/booking/*` → `apps/customer` (UI); logic → `domains/booking`.
- `app/page.tsx` + `app/components/{hero,pricing,experiences,how-it-works,testimonials,stats,cta,about,layout,concierge}/*` + `app/hooks/*` + public shell → `apps/landing`.
- `app/sign-in`, `app/reset-password` → `apps/admin` (auth shell) — or a shared auth route.
- Shared UI primitives (`app/components/ui/*`, ratings) → `packages/ui`.

## Driver Portal dependency gate (Epic 6)
Driver Portal is built **only after**:
1. Business Domains are stable (Epic 3).
2. Shared Infrastructure exists — `db`/Drizzle, `auth`, `realtime`/Socket.IO, `api` (Epic 4).
3. Admin Portal consumes the new domains (Epic 5).
4. Platform Refactoring (2C) is complete.

Until then, Driver Portal is a spec only (`archive/spec-v1/`, `01-business/drivers/`).

See `FOLDER_OWNERSHIP.md` for the full current→target folder mapping.
