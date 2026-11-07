# Code Review Checklist

Apply to every PR. Derived from `../00-CONSTITUTION.md` and `../03-engineering/quality-gates.md`.

## Architecture
- [ ] Business logic is in `packages/domains/*` (not UI, not API routes)
- [ ] UI only contains presentation logic
- [ ] API routes orchestrate, do not implement
- [ ] Events emitted for cross-domain effects
- [ ] No circular dependencies; `packages/*` never import `apps/*`

## Quality gates (per `../03-engineering/quality-gates.md`)
- [ ] Does not duplicate logic
- [ ] Belongs to the correct domain
- [ ] Reuses existing shared component/package
- [ ] Respects the monorepo
- [ ] Does not break the API
- [ ] Handles realtime impact
- [ ] Migration considered if schema changed
- [ ] Reusable / documented

## Code
- [ ] TypeScript strict mode; no `any`
- [ ] Explicit return types on public functions
- [ ] Components < 200 lines, one per file
- [ ] Import order correct (`../03-engineering/coding-standards.md`)
- [ ] No secrets in code

## Tests
- [ ] Unit tests for domain logic (Vitest)
- [ ] Critical paths covered
- [ ] Tests green in CI

## Docs
- [ ] Behavior change updates relevant `docs/platform/` file
- [ ] New decision → ADR in `05-decisions/` or entry in `../11-product-management/DECISION_LOG.md`
