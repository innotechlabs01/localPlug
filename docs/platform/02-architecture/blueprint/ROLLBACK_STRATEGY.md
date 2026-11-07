# ROLLBACK_STRATEGY

Every step has a known, rehearsed rollback. **No step is merged with an unknown rollback.**
Constitution §14: we migrate behavior, never change it — so rollback must restore the exact
prior behavior.

| # | ID | How to rollback | Data affected | Max downtime | Backward compat | Feature flag |
|---|---|---|---|---|---|---|
| 0 | B0 | revert config PR | none | 0 | full | — |
| 1 | B1 | revert PR | none | 0 | full | — |
| 2 | B2 | revert PR | none | 0 | full | — |
| 3 | B3 | revert PR | none | 0 | full | — |
| 4 | B4 | flip `use-drizzle` off → raw client | none (both clients same DB) | 0 | full (dual client) | `use-drizzle` |
| 5 | B5 | revert cutover flag → legacy auth | none | 0 | full (dual auth) | `use-domain-auth` |
| 6 | B6 | revert PR | none | 0 | full | — |
| 7 | B7 | revert PR | none | 0 | full | — |
| 8 | B8 | revert PR | none (no schema break) | 0 | full | — |
| 9 | B9 | revert PR | none | 0 | full | — |
| 10 | B10 | revert PR | none | 0 | full | — |
| 11 | B11 | revert PR | none | 0 | full | — |
| 12 | B12 | revert PR | none (read-only) | 0 | full | — |
| 13 | B13 | flip `use-domain-booking` off → legacy route | none | 0 | full | `use-domain-booking` |
| 14 | B14 | revert PR | none | 0 | full | — |
| 15 | B15 | drop new tables via back-migration | new tables only | <1 min (migration) | full (additive) | — |
| 16 | B16 | restore `payment-store.ts`; flip `use-domain-payments` off | none | 0 | full (dup kept until cutover) | `use-domain-payments` |
| 17 | B17 | flip `use-domain-notifications` off → legacy n8n | none | 0 | full (parallel send) | `use-domain-notifications` |
| 18 | B18 | revert PR | none | 0 | full | — |
| 19 | B19 | revert PR | none | 0 | full | — |
| 20 | B20 | flip `use-domain-dispatch` off → legacy route | none | 0 | full | `use-domain-dispatch` |
| 21 | B21 | revert PR (read-only view) | none | 0 | full | — |
| 22 | B22 | revert PR | none | 0 | full | — |
| 23 | B23 | flip `use-socketio` off → polling | none (worker optional) | 0 | full (both run) | `use-socketio` |
| 24 | B24 | revert envelope per route | none | 0 | full (incremental) | per-route |
| 25 | B25 | revert per route-group PR | none | 0 | full (grouped flags) | per-group |
| 26 | B26 | revert PR | none | 0 | full | — |
| 27 | B27 | revert PR (separate app) | none | 0 | full | — |
| 28 | B28 | revert PR (separate app) | none | 0 | full | — |
| 29 | B29 | undeploy new app | none | 0 | full (separate app) | — |

## Rules
- **Additive DB first.** Schema changes add tables/columns; back-migrations are written with
  every forward migration (never alter breaking).
- **Dual-run where risky** (B4, B5, B16, B17, B20, B23): old + new coexist behind a flag; the
  flag is the rollback.
- **Delete only after.** `Delete`-classified files (e.g., `payment-store.ts`) are removed only
  after the domain migration is merged and green.
- **Max downtime target: 0** for every step (no maintenance window). Destructive data reshape
  is explicitly avoided; if ever required, it gets its own approved change with a window.
- **Backward compatibility:** the external API contract (`12-quality/API_CHECKLIST.md`) and DB
  row shapes are preserved throughout; domains change internally, not observably.
