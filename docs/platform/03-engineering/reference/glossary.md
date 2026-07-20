# Reference — Glossary

| Term | Definition |
|---|---|
| Booking | A customer reservation (pickup/dropoff, schedule, passengers). |
| Assignment | A dispatch attempt matching a driver to a booking. |
| Trip | The executed journey from an accepted assignment (1:1). |
| Dispatch | The engine that matches drivers to bookings. |
| Claim | A driver taking ownership of an existing (pre-registered) profile via phone. |
| Account status | Admin-controlled lifecycle: pending/approved/suspended/rejected. |
| Availability | Driver-controlled state: available/offline/busy. |
| Domain | An isolated business capability with its own data and logic. |
| Event | An immutable, typed message emitted by a domain. |
| Realtime | Socket.IO broadcast layer; no business logic. |
| PWA | Installable Progressive Web App. |
| ADR | Architecture Decision Record (in `05-decisions/`). |
| Soft delete | Row retained with `deleted_at`/`deleted_by` for audit. |
| LocalPlug | The Business Platform described by this documentation. |
