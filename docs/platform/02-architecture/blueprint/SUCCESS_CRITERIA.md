# SUCCESS_CRITERIA

Epic 2C is complete when **all** of the following hold. These are the gate to start Epic 2C's
execution and, later, the proof it finished without regression.

## Structural (Blueprint realized)
1. Monorepo with `apps/{admin,driver,customer,landing}` + the 17 domains in `packages/domains/*`
   + `packages/{api,db,auth,realtime,config,shared,ui}` exists and builds via Turborepo.
2. The 30 steps (B0–B29) are merged in an order consistent with `DEPENDENCY_EXECUTION_MATRIX.md`
   and `CRITICAL_PATH.md`.
3. `packages/*` never imports `apps/*` (enforced by CI boundary lint, B0).
4. Every domain depends only on `db/shared/config/realtime/auth`; cross-domain calls use typed
   events (`EVENT_OWNERSHIP.md`).
5. DB access goes through `packages/db` (Drizzle); the raw `@libsql/client` is removed; the
   client import is no longer in the browser bundle.

## Behavioral (no regression — Constitution §14)
6. External API contract (`12-quality/API_CHECKLIST.md`) is byte-for-byte preserved for all
   public/admin/webhook routes.
7. Customer and admin flows behave identically before/after (verified by e2e + manual parity).
8. WhatsApp (Evolution), Paddle, n8n, Clerk, Ollama integrations trigger and respond as before.
9. Real-time delivery (Socket.IO) reaches clients with no loss vs. legacy polling.

## Quality gates
10. `12-quality/` checklists all green: API, regression, data, i18n, performance (P95 ≤ +10% vs
    baseline), security.
11. Every High-risk step (B4, B5, B13, B16, B17, B20, B23, B25) shipped behind a flag with a
    rehearsed zero-downtime rollback (`ROLLBACK_STRATEGY.md`).
12. All migrations have back-migrations; no destructive schema change shipped unguarded.
13. `0` broken markdown links in `docs/platform/` (legacy `archive/spec-v1` excluded).

## Platform gate (enables later epics)
14. All 17 domains are **stable** and consumed by `apps/admin` via thin routes.
15. Shared infrastructure (`db/auth/realtime/api/config/shared/ui`) is in place and used.
16. Driver Portal gate (Epic 6) prerequisites met: domains stable + shared infra + Admin on new
    domains + 2C complete → `apps/driver` (B29) is buildable and e2e-green.

## Definition of Done per step (also in `EXECUTION_GUIDE.md`)
- PR merges behind flag where required; CI green; unit + integration (and e2e where listed) pass;
  manual behavior-parity confirmed; rollback known and documented; `FILE_CLASSIFICATION.md`
  updated (file moved/removed from source).
