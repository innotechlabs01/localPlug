# DEPLOYMENT_STRATEGY

**Rule:** every migration step must be **independently deployable**. No "big bang." If a step
cannot be deployed alone, it is **split** until it can.

| # | ID | Independently deployable? | If NO → how to split |
|---|---|---|---|
| 0 | B0 | YES | — |
| 1 | B1 | YES | — |
| 2 | B2 | YES | — |
| 3 | B3 | YES | — |
| 4 | B4 | **CONDITIONAL** | Ship Drizzle client **alongside** raw client (flag `use-drizzle`); migrate one domain; flip flag; remove raw client in a later step. |
| 5 | B5 | **CONDITIONAL** | Keep legacy auth path working during cutover; dual-write sessions; flip per-route. |
| 6 | B6 | YES | — |
| 7 | B7 | YES | — |
| 8 | B8 | YES | — |
| 9 | B9 | YES | — |
| 10 | B10 | YES | — |
| 11 | B11 | YES | — |
| 12 | B12 | YES | — |
| 13 | B13 | **CONDITIONAL** | Move logic behind domain; keep route returning identical shape; flag domain call. |
| 14 | B14 | YES | — |
| 15 | B15 | YES | Additive tables; safe alone. |
| 16 | B16 | **CONDITIONAL** | Keep `payment-store.ts` (dup) until migration merged + tests pass, then delete. |
| 17 | B17 | **CONDITIONAL** | Run new notifications alongside legacy n8n triggers; flag; cut over per channel. |
| 18 | B18 | YES | — |
| 19 | B19 | YES | — |
| 20 | B20 | **CONDITIONAL** | Flag new dispatch domain; legacy route stays until cutover. |
| 21 | B21 | YES | Read-only derivation; safe. |
| 22 | B22 | YES | — |
| 23 | B23 | **CONDITIONAL** | Keep polling **and** Socket.IO in parallel; clients subscribe to both; flip; remove polling. |
| 24 | B24 | YES | Envelope adoption can be incremental per route. |
| 25 | B25 | **NO (big)** | **Split into per-route-group PRs** (booking, drivers, payments, dispatch, chat, hotels, cases, settings, auth). Each PR is deployable; flag the thin-route cutover. |
| 26 | B26 | YES | — |
| 27 | B27 | YES | — |
| 28 | B28 | YES | — |
| 29 | B29 | YES | New app deploys independently (separate deploy unit). |

## Principles
- **Strangler pattern**: new structure runs next to the old; routes flip per feature behind a
  flag. The app is always deployable.
- **One concern per PR.** A PR that moves logic *and* changes UI *and* changes DB is split.
- **DB changes are additive** (new tables/columns, never alter existing in a breaking way).
  Back-migrations are written with every migration.
- **Feature flags** (`use-drizzle`, `use-socketio`, `use-domain-dispatch`, …) let a step ship
  dark and cut over when verified.
- **No big-bang deploy:** the monolith is never "switched off" in one release.
