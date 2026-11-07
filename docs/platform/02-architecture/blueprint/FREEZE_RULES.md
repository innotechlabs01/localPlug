# FREEZE_RULES

During Epic 2C, the **monolith's observable behavior is frozen**. These rules make the migration
safe per Constitution §14 (move behavior, never change it). A violation = regression unless
explicitly approved as an Epic item.

## 1. Behavior freeze (no user-visible change)
- API request/response **shapes** for all public + admin + webhook routes are frozen. `12-quality/API_CHECKLIST.md` is the contract; any drift blocks the step.
- Customer-facing flows (booking, payment, WhatsApp, chat, driver dispatch) must look and behave
  identically after migration. Detected difference → fix or explicitly plan.
- External integrations (Paddle, Evolution/WhatsApp, n8n, Clerk, Ollama) keep the same triggers
  and message content.

## 2. Data freeze (no destructive change)
- No column/table is **altered or dropped** in a breaking way. All schema changes are additive;
  back-migrations shipped with every forward migration.
- Row data is never reshaped in place. New tables are created; old ones retired only after the
  domain consuming them is verified.
- Seed/lookup data (countries, hotels, promotions) is not modified.

## 3. Dependency-direction freeze
- `packages/*` **never** import `apps/*`. This is enforced by CI boundary lint (B0). Any PR that
  violates it is rejected automatically.
- Cross-domain calls go only through **typed events** (`EVENT_OWNERSHIP.md`), never direct domain
  imports.
- A domain may depend only on `db/shared/config/realtime/auth` (per `DEPENDENCY_GRAPH.md`).

## 4. Naming / ownership freeze at cutover
- File ownership moves only as classified in `FILE_CLASSIFICATION.md` (Keep/Move/Split/Merge/
  Replace/Delete). A `Delete` is executed only after its replacement merges and tests pass.
- No new domain or package is introduced beyond the `PACKAGE_MAP` / `DOMAIN_MAP` approved set.

## 5. No scope creep
- 2C implements the Blueprint **as written**. New features, new API surface, new UI, new
  business logic belong to later epics (3–10), not here.
- If a step reveals missing behavior, record it in `PRODUCT_BACKLOG.md` / `TECH_DEBT.md`; do not
  implement inline.

## 6. Freeze exceptions (require explicit approval)
- A behavior change **if** it is a documented bug fix and approved as an Epic item.
- A schema **drop** only after a domain is fully migrated and verified (the `Delete` step).
- Any deviation from the approved `DEPENDENCY_EXECUTION_MATRIX` order (only if re-validated
  against `CRITICAL_PATH.md`).

## 7. Enforcement
- CI runs: build, lint, **boundary lint**, unit, integration per step.
- `12-quality/` checklists gate every merge (API, regression, data, i18n, perf, security).
- A step cannot merge with an **unknown rollback** (`ROLLBACK_STRATEGY.md` must cover it).
