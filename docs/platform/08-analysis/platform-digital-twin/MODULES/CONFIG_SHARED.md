# CONFIG_SHARED (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY in cross-cutting config, shared utils, i18n, resilience.
> No code changes.

## Real files & responsibilities
- **File:** `lib/config.ts`
  - ✔ Loads/validates environment (`validateEnv`), exposes typed config getters
  - ✔ **Problem:** imports the DB (`lib/db.ts`) transitively (env validation triggers DB
    client init) → confirmed circular dependency `lib/config.ts ↔ lib/db.ts`.
- **File:** `lib/pricing.ts`
  - ✔ Computes quotes, applies promotions, TRM/FX — the **single price source** (good).
- **File:** `lib/i18n/index.tsx`, `lib/i18n/locales/*`
  - ✔ i18n provider + en/es dictionaries. In-degree **56** (used everywhere).
- **File:** `lib/resilience/*`
  - ✔ Retry/circuit-breaker helpers used by queue + cron.
- **File:** `lib/logger.ts`, `lib/date-utils.ts`, `lib/phone-utils.ts`, `lib/string-utils.ts`,
  `lib/countries.ts`, `lib/language-utils.ts`, `lib/message.ts`, `lib/rate-limit.ts`
  - ✔ Shared utilities (in-degree 6–11 each).
- **File:** `lib/design-tokens.ts`
  - ✔ Design tokens consumed by UI.

## Module-level real responsibilities
- ✔ Bootstrap config + env validation
- ✔ Pricing/quote engine
- ✔ i18n + locale dictionaries
- ✔ Cross-cutting utilities (logger, date, phone, string, rate-limit, countries)

## Proposed split (target)
- `packages/config` — env validation + typed config (move `validateEnv` here; **break the
  config↔db cycle** by not importing db).
- `packages/shared` — logger, date/phone/string/country utils, i18n dictionaries, resilience,
  design tokens (Blueprint `PACKAGE_MAP`).
- Pricing → `domains/booking` (or `packages/config` if kept cross-domain) — never duplicated in
  booking handlers.

## Dependency observations (real)
- `lib/config.ts` ↔ `lib/db.ts` cycle (see `DEPENDENCIES/DEPENDENCY_GRAPH.md`).
- i18n is a near-universal leaf dependency (56 importers) — fine, it is true shared infra.
