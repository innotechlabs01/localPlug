# DATABASE_OWNERSHIP_MATRIX (Epic 2B.5)

> **ID note:** B-refs below use pre-2B.5 IDs. Translate via the traceability map in
> `blueprint/MIGRATION_BACKLOG.md` v2 (e.g. orders_new B13/B20/B16→B13/B14/B19; settings B3/B11→
> B3/B21; vehicles B15→B17; trips B21→B16). Analysis unchanged.

> Table → owning domain, with **read** and **write** access. Goal: prevent multiple domains
> writing the same table uncontrolled. Built from `../platform-digital-twin/DATABASE/DATABASE.md`
> (25 real tables) + Blueprint `DATABASE_OWNERSHIP.md`.

## Rule
- Exactly **one writer** per table (the owner domain). Other domains may **read** (or subscribe
  to events), never write.
- A table with >1 writer today = **conflict** to fix in 2C.

| Table | Owner (write) | Readers (today, real) | Conflict? |
|---|---|---|---|
| `orders_new` | Booking | Booking, Dispatch (assign), Payments (status), Admin (poll) | ⚠️ multi-writer → B13/B20/B16: only Booking writes; others emit events |
| `assignments` | Dispatch | Dispatch, Driver (future), Booking (read) | ✔ clean |
| `drivers` | Drivers | Drivers, Dispatch (read avail), Auth | ✔ clean |
| `customers` | Customers | Customers, Booking (read) | ✔ clean |
| `promotions` | Hotels | Hotels, Booking/pricing (read) | ✔ clean |
| `hotels` | Hotels | Hotels, Booking (read) | ✔ clean |
| `rooms` / `room_bookings` | Hotels | Hotels, Booking (read) | ✔ clean |
| `payments` (split cols on orders) | Payments | Payments, Booking (read) | ✔ clean (split cols owned by Payments) |
| `outgoing_messages` | Notifications (outbox) | Notifications worker, Realtime (future) | ✔ clean (becomes generic outbox) |
| `whatsapp_events` | Notifications | Notifications | ✔ clean |
| `conversations` / `messages` | Chat | Chat, AI (read), Agent | ✔ clean |
| `chat_sessions` / `support_agents` / `conversation_ratings` | Chat | Chat, AI | ✔ clean |
| `cases` / `case_events` / `case_tasks` / `case_documents` | Cases | Cases, Notifications | ✔ clean |
| `ratings` | Ratings | Ratings, Booking (read) | ✔ clean |
| `modules` / `role_permissions` | Auth | Auth, all admin routes | ✔ clean |
| `employee_*` | Auth | Auth, Drivers (read) | ✔ clean |
| `settings` | Settings | Settings, Config (read) | ⚠️ env+DB dual → B3/B11 |
| `vehicle` (cols on drivers) | **none** → Vehicles (B15) | Dispatch, Drivers | ❌ no owner → B15 |
| `trips` (embedded) | **none** → Trips (B21) | Booking, Dispatch | ❌ no owner → B21 |

## Conflicts to resolve in 2C
1. **`orders_new` multi-writer** — Dispatch (assign-driver) and Payments write status/split
   inline. → B13/B20/B16: Booking is sole writer; Dispatch/Payments emit `BookingStatusChanged` /
   `PaymentConfirmed`.
2. **`settings` dual source** — env vs DB. → B3/B11 split.
3. **`vehicle` / `trips` no owner** — extract in B15 / B21.

## Result
- 22/25 tables already single-writer and conflict-free.
- 3 conflicts = the 2C extraction targets. After B13/B15/B16/B20/B21 the matrix is fully clean.
  → supports **Gate 3 ✔** and **Database 97%**.
