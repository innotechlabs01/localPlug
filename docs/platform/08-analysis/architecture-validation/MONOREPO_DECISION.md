# MONOREPO_DECISION (Epic 2B.5)

> Confirms the **single Next.js monorepo with route-group app split** (Blueprint) is the right
> structure for the Platform, vs alternatives. Validates against the real constraint set.

## Options considered
| Option | Pros | Cons | Verdict |
|---|---|---|---|
| A. Single monorepo, route-group apps (`(admin)`, `(driver)`, `(customer)`, `(public)`) | Shares `lib/`, single deploy, one `next build`, easiest incremental flag rollout | One build artifact; blast radius shared | **CHOSEN** (Blueprint §Repo) |
| B. Separate repos per app | Independent deploys | Duplicated `lib/`, version drift, no shared ownership — violates §14 | ✖ rejected |
| C. Turborepo / multi-package monorepo | Clear package boundaries | Heavy tooling; premature for 4 apps; slows 2C | ✖ deferred (revisit at scale, Epic 4) |

## Decision drivers (from reality)
1. **Shared domain code** lives in `lib/` already extracted per-domain → apps are thin shells
   (Blueprint `03-architecture/REPO_STRUCTURE.md`). Single repo keeps domains single-sourced.
2. **Flag-driven rollout** (B4/B5/B13/B16/B17/B20/B23) requires all apps in one build to share
   flags from `lib/config` / `settings`. Option B/C break this.
3. **Single deploy** matches current Vercel `next build` (no infra change until Epic 4).
4. **Ownership** (§14): one repo ⇒ one `SOURCE_OF_TRUTH` per concept; package boundaries can be
   enforced later via `lint` without restructuring.

## Constraints satisfied
- ✔ Build: one `next build`; route groups isolate UI; `middleware.ts` (B5) routes by host/role.
- ✔ Testing: per-domain jest + per-app e2e (TESTING_STRATEGY) run in the same repo.
- ✔ Rollback: flags read at runtime → any app's rollout reversible without redeploy of others.

## When to revisit
- If >4 apps or independent release cadence needed → migrate to Turborepo packages (Epic 4,
  not blocking 2C). The domain `lib/` layout is already package-ready.

## Verdict
Monorepo-by-route-group decision is consistent with reality and the lowest-risk path →
**Gate 8 ✔**.
