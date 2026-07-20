# OWNERSHIP_VALIDATION (Epic 2B.5)

> **ID note:** B-refs below use pre-2B.5 IDs. Translate via the traceability map in
> `blueprint/MIGRATION_BACKLOG.md` v2 (e.g. booking B13→B13, trips B21→B16, vehicles B15→B17,
> config B3/B11→B3/B21). Analysis unchanged.

> For each important concept, who may **modify** it. ✔ = allowed writer, ✖ = forbidden.
> Cross-checks `SOURCE_OF_TRUTH_MATRIX.md` (real) against Blueprint ownership (target). A cell
> marked ✖ that is **currently happening** is a **conflict** to resolve in 2C.

## Rules (Blueprint)
- Exactly **one** writer per concept (Constitution §14).
- Cross-domain change = emit a **typed event**; never a direct write.

## Concept × writer
| Concept | Booking | Dispatch | Driver | Trips | Vehicles | Payments | Customers | Hotels | Auth | Settings | Conflict today? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Booking status | ✔ | ✖ | ✖ | ✖ | ✖ | ✖(read) | ✖ | ✖ | ✖ | ✖ | ⚠️ today `orders_new` status also written by dispatch (assign) + payments (status) inline → fix in B13/B20 |
| Booking record | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖(ref) | ✖ | ✖ | ✖ | ⚠️ booking logic split across booking + admin/orders routes → B13/B25 |
| Assignment | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (assignments table owned by dispatch) |
| Driver availability | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (lib/dispatch/availability) |
| Driver record | ✖ | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖(auth) | ✖ | ✔ clean |
| Vehicle | ✖ | ✖ | ✖ | ✖ | ✔(new) | ✖ | ✖ | ✖ | ✖ | ✖ | ❌ no owner today (columns on drivers) → create in B15 |
| Trip state | ✖ | ✖ | ✖ | ✔(new) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ❌ no owner today (embedded) → create in B21 |
| Price / quote | ✔(pricing) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (lib/pricing single source) |
| Promotion | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✖ | ✔ clean |
| Payment / split | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | ✔ clean (payment-service/paddle) |
| Customer record | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✖ | ✖ | ✔ clean |
| Rating | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (rating-service) |
| Chat session | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (chat-service) |
| AI reply | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (ollama-service) |
| WhatsApp outbound | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (notifications) |
| RBAC / permissions | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✔ clean (auth) |
| Config (env) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ⚠️ dual source with settings table → split B3/B11 |
| Config (runtime) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ⚠️ dual source with env → split B3/B11 |
| Hotel / room | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✖ | ✔ clean |
| Case | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (cases routes) |
| Geocode | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ clean (maps) |

## Conflicts to resolve in 2C
1. **Booking status multi-writer** — dispatch (assign-driver) and payments write `orders_new`
   status inline. → B13/B20: only Booking domain writes; Dispatch/Payments emit typed events.
2. **Trip state / Vehicle** have **no** owner → B21 / B15 create first-class domains.
3. **Config dual source** (env `lib/config` + DB `settings`) → B3/B11 split static vs runtime.

## Result
- 18/21 concepts already single-sourced and conflict-free (preserve in 2C).
- 3 conflicts are **exactly** the 2C extraction targets (booking status boundary, trips,
  vehicles, config split). No hidden ownership ambiguity remains → **Gate 3 ✔**.
