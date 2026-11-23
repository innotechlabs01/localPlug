# RISK_MATRIX

Risk = likelihood × impact. Levels Low/Med/High. Every High step has a flag + rehearsed
rollback (see `ROLLBACK_STRATEGY.md`).

| # | ID | Risk | Impact if fail | Complexity | Rollback | Mitigation |
|---|---|---|---|---|---|---|
| 0 | B0 | Low | build breaks | Low | Easy | small config PRs; CI blocks |
| 1 | B1 | Low | util import churn | Low | Easy | typecheck + tests |
| 2 | B2 | Low | UI drift | Low | Easy | visual diff in preview |
| 3 | B3 | Low–Med | wrong prices/config | Low | Easy | unit + manual price check |
| 4 | B4 | **High** | DB layer broken app-wide | High | Med (dual client) | dual-run; migrate 1 domain; flag `use-drizzle` |
| 5 | B5 | **High** | lockout / wrong RBAC | High | Med (dual auth) | dual auth; per-route cutover; integration tests |
| 6 | B6 | Low | map/geocode regress | Low | Easy | integration test |
| 7 | B7 | Low | comment leakage | Low | Easy | unit tests on filter |
| 8 | B8 | Low–Med | rating lost | Low | Easy | integration test |
| 9 | B9 | Med | hotel ops broken | Med | Easy–Med | integration + e2e |
| 10 | B10 | Low–Med | customer data | Low | Easy | integration test |
| 11 | B11 | Low | settings wrong | Low | Easy | unit test |
| 12 | B12 | Low | wrong dashboard | Low | Easy | read-only; integration |
| 13 | B13 | **High** | booking lost / wrong price | High | Med (flag) | flag `use-domain-booking`; **e2e booking** gate |
| 14 | B14 | Med | driver mgmt broken | Med | Easy–Med | integration + e2e |
| 15 | B15 | Med | assignment wrong | Med | Med (additive) | additive tables; back-migration |
| 16 | B16 | **High** | payment lost / wrong split | High | Med (dup) | keep `payment-store.ts` until cutover; **e2e payment** |
| 17 | B17 | **High** | WhatsApp outage / dup send | High | Med (parallel) | parallel send; flag `use-domain-notifications` |
| 18 | B18 | Med–High | chat lost | Med | Med | integration + e2e |
| 19 | B19 | Med | wrong AI reply | Med | Easy–Med | integration test |
| 20 | B20 | **High** | dispatch wrong / double assign | High | Med (flag) | flag `use-domain-dispatch`; **e2e dispatch** |
| 21 | B21 | Med | bad trip state | Med | Easy–Med | read-only derivation |
| 22 | B22 | Low–Med | case mgmt broken | Low | Easy | integration test |
| 23 | B23 | **High** | missed events / outage | High | Med (polling) | keep polling alongside; flag `use-socketio` |
| 24 | B24 | Med | API contract drift | Med | Easy–Med | incremental per-route envelope |
| 25 | B25 | **High** | admin broken (broad) | High | **Hard** → split | per-route-group PRs + flags; **e2e admin** |
| 26 | B26 | Low | admin client build | Low | Easy | unit test |
| 27 | B27 | Low | landing visual | Low | Easy | e2e landing |
| 28 | B28 | Med | customer booking | Med | Easy–Med | e2e customer booking |
| 29 | B29 | Med | driver flows (new app) | Med | Easy (separate) | e2e driver; isolated deploy |

## Aggregate risk posture
- **8 High steps**: B4, B5, B13, B16, B17, B20, B23, B25.
- **All High steps are dual-run or flag-gated** with a zero-downtime rollback.
- The monolith is never taken down in one release; risk is bounded per step.
