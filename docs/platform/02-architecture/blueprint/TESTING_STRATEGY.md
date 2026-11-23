# TESTING_STRATEGY

**Nothing moves without verification.** Each step defines the test types it requires. The
overall level (per `12-quality/`) is the regression gate for Epic 2C.

| # | ID | Unit | Integration | E2E | Manual | Performance |
|---|---|---|---|---|---|---|
| 0 | B0 | CI config | build | — | deploy preview | — |
| 1 | B1 | utils | import graph | — | — | — |
| 2 | B2 | components | render | — | visual check | — |
| 3 | B3 | config load | env | — | price check | — |
| 4 | B4 | schema | **db query** | — | migrate dry-run | query P95 |
| 5 | B5 | guards | **auth flow** | login/RBAC | — | — |
| 6 | B6 | — | geocode | — | map render | geocode latency |
| 7 | B7 | filter | — | — | — | — |
| 8 | B8 | service | db | — | rating submit | — |
| 9 | B9 | — | db | hotel ops | — | — |
| 10 | B10 | — | db | customer CRUD | — | — |
| 11 | B11 | — | db | settings toggle | — | — |
| 12 | B12 | — | read models | dashboard | — | dashboard load |
| 13 | B13 | pricing/validation | db | **booking flow** | — | booking P95 |
| 14 | B14 | — | db | driver mgmt | — | — |
| 15 | B15 | assign logic | db | vehicle assign | — | — |
| 16 | B16 | split calc | db | **payment + refund** | — | pay P95 |
| 17 | B17 | templating | **send/recv** | WhatsApp round-trip | — | notify P95 |
| 18 | B18 | service | db | chat thread | — | — |
| 19 | B19 | respond | — | AI reply/escalate | — | ai latency |
| 20 | B20 | availability | db | **assign + accept** | — | dispatch P95 |
| 21 | B21 | transitions | db | trip lifecycle | — | — |
| 22 | B22 | — | db | case flow | — | — |
| 23 | B23 | emit | **socket delivery** | push received | — | event < 500ms |
| 24 | B24 | envelope | route | — | — | — |
| 25 | B25 | — | route→domain | **full admin flows** | admin smoke | — |
| 26 | B26 | client | — | — | — | — |
| 27 | B27 | — | — | **landing** | visual | — |
| 28 | B28 | — | — | **customer booking** | — | — |
| 29 | B29 | — | — | **driver flows** | device check | — |

## Definitions
- **Unit** — domain/service logic, pure functions, validation (Vitest).
- **Integration** — domain ↔ DB (Drizzle), domain ↔ notifications/events, auth guards.
- **E2E** — full user flow through the (thin) route + domain (Playwright against preview).
- **Manual** — behavior-parity check by a human (Constitution §14: no behavior change).
- **Performance** — P95 vs current baseline; no regression beyond +10%.

## Gate
A step is mergeable only when its required cells are green **and** a manual behavior-parity
check confirms the user sees no change. A detected behavior change = regression (fix or
explicitly plan).
