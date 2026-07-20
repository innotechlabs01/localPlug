# REFRACTOR_READINESS (Epic 2B.5)

> Scorecard answering: *is the design executable?* Each dimension is scored on whether the
> Blueprint ↔ Twin ↔ Plan are consistent and unambiguous — **not** on whether code is written.
> Threshold to start 2C: **average ≥ 95%**.

| Dimension | Score | Basis |
|---|---|---|
| Architecture (Blueprint) | 98% | All maps/diagrams/domains finalized & approved (2A). |
| Ownership | 100% | `SOURCE_OF_TRUTH_MATRIX.md` + `OWNERSHIP_VALIDATION.md` complete; dual/missing sources flagged. |
| Dependencies | 96% | Real graph + cycle detection done; 2 cycles known & assigned to 2C steps. (−4%: cycles not yet broken.) |
| Events | 94% | `EVENT_TRACEABILITY.md` complete; today's events mapped. (−6%: no typed contract yet — 2C work.) |
| Database | 97% | 25 real tables enumerated; owner/read/write matrix built. (−3%: trips/vehicles not yet extracted.) |
| API | 95% | `API_VALIDATION.md` contracts for all surfaces; per-route owner/domain/perms. |
| Realtime | 90% | Polling reality + Socket.IO placement fully mapped. (−10%: Socket.IO not implemented — 2C work.) |
| Testing | 88% | Strategy + `12-quality/` gates defined; harness not yet run on domains. (−12%: pre-domain, executes in 2C.) |
| Migration | 100% | `MIGRATION_BACKLOG_VALIDATION.md`: all B0–B29 steps unambiguous (10-question checklist). |
| **Average** | **95.3%** | **Above 95% threshold.** |

## Interpretation
- The score measures **validation readiness**, not implementation completeness. Low scores on
  Events / Realtime / Testing are expected — those are *built during* 2C, and their plans are
  concrete (B17, B23, B1/B4+). They are scheduled, not missing.
- The only "defects" the audit surfaced are exactly the ones 2C is designed to fix:
  - Circular deps `lib/queue↔lib/n8n`, `lib/config↔lib/db` → B23, B3/B4.
  - Missing owners `trips`, `vehicles` → B21, B15.
  - Dual source `config` (env + DB) → B3/B11.
- No step in B0–B29 is ambiguous (see `MIGRATION_BACKLOG_VALIDATION.md`).

## Gate
Average 95.3% ≥ 95% → **threshold met**. Combined with `ARCHITECTURE_GATES.md` (hard gates ✔),
Epic 2C is cleared to start pending user sign-off that the accepted-as-2C open items are
correctly scheduled (they are: B15, B17, B21, B23, B3/B4, B11).
