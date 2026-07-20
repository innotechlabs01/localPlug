# CRITICAL_PATH

Every step is independently deployable, but the **earliest finish** of Epic 2C is bounded by the
chain of steps that other steps depend on. Those on the longest dependency chain = **Critical
Path**. Steps off it can be parallelized.

## Classification

| # | ID | Class | Depends on |
|---|---|---|---|
| 0 | B0 | **Critical Path** | — |
| 1 | B1 | **Critical Path** | B0 |
| 2 | B2 | Independent | B1 |
| 3 | B3 | Independent | B1 |
| 4 | B4 | **Critical Path** | B1 |
| 5 | B5 | **Critical Path** | B1, B4 |
| 6 | B6 | Parallelizable | B4 |
| 7 | B7 | Parallelizable | B1 |
| 8 | B8 | Parallelizable | B1, B4 |
| 9 | B9 | Parallelizable | B4 |
| 10 | B10 | Parallelizable | B4, B5 |
| 11 | B11 | Parallelizable | B3, B4 |
| 12 | B12 | Independent (deferrable) | B4 |
| 13 | B13 | **Critical Path** | B4, B3, B9, B10 |
| 14 | B14 | Parallelizable | B4, B5 |
| 15 | B15 | Parallelizable | B14, B4 |
| 16 | B16 | **Critical Path** | B4, B13 |
| 17 | B17 | **Critical Path** | B1, B4, B5 |
| 18 | B18 | Parallelizable | B4, B17, B7 |
| 19 | B19 | Parallelizable | B18, B17 |
| 20 | B20 | **Critical Path** | B13, B14, B15 |
| 21 | B21 | Parallelizable | B20, B13, B16 |
| 22 | B22 | Parallelizable | B14, B5 |
| 23 | B23 | **Critical Path** | B17, B1 |
| 24 | B24 | **Critical Path** | B5 |
| 25 | B25 | **Critical Path** | B13–B24 |
| 26 | B26 | Independent | B25 |
| 27 | B27 | Independent | B2 |
| 28 | B28 | Independent | B13, B2, B16 |
| 29 | B29 | Independent (gate consumer) | B14, B20, B21, B16, B17, B23, B5 |

## The Critical Path (longest chain)
```
B0 → B1 → B4 → B5 → B13 → B16 → B17 → B23 → B24 → B25 → [GATE] → B29
                    │                  ↘ (B20 depends B13,B14,B15)
```
- B13 (booking) is a hub: B16 (payments), B20 (dispatch) branch from it.
- B17 (notifications) gates B23 (realtime) and feeds B18/B19 (chat/ai), B20.
- B25 (admin) is the last structural step and consumes all domains — it sits at the path end.
- B29 (driver) is the consumer gate: it cannot start until B14, B20, B21, B16, B17, B23, B5
  (drivers/dispatch/trips/payments/notifications/realtime/auth) are stable.

## Implication for scheduling
- **Do not start B25 until B13–B24 (esp. B13,B16,B17,B23,B24) are merged.** B25 is the
  bottleneck — keep those feeding steps flowing first.
- **Parallelizable leaf domains** (B2,B3,B6,B7,B8,B9,B10,B11,B12,B14,B15,B18,B19,B21,B22) can be
  batched in separate PRs/branches running concurrently with the critical path.
- **B27 (landing) and B28 (customer) are independent** of the admin/driver gates; they can
  proceed anytime after their prerequisites with no impact on the critical path.
