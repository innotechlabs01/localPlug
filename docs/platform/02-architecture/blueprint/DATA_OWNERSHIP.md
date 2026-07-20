# DATA_OWNERSHIP

Every business data concept has exactly one owning domain. No shared mutable state across
domains; cross-domain reads go through events or read models.

| Data concept | Owner domain | Notes |
|---|---|---|
| Orders / reservations | **booking** | Central entity linking booking → trip → payment |
| Assignments | **dispatch** | Created by dispatch; references order + driver |
| Driver availability | **dispatch** (+ **drivers**) | Dispatch owns matching; drivers owns the flag |
| Drivers + documents + compliance | **drivers** | `drivers`, `driver_compliance`, documents |
| Vehicles + assignments | **vehicles** | Separate aggregate from drivers (today merged on `drivers`) |
| Customers | **customers** | `customers` |
| Payments + splits + refunds | **payments** | `payments` |
| Outgoing messages + WhatsApp events | **notifications** | `outgoing_messages`, `whatsapp_events` |
| Conversations / messages / agents | **chat** | `conversations`, `messages`, `support_agents`, `chat_sessions` |
| AI session state | **ai** | Concierge engine state |
| Analytics read models | **analytics** | Derived (read-only) from events |
| Settings | **settings** | `settings` table |
| Cases + tasks + documents | **cases** | `cases*`, `case_*` |
| Hotels / rooms / promotions | **hotels** | `hotels`, `rooms`, `promotions`, `room_bookings` |
| Ratings / testimonials | **ratings** | `ratings`, `conversation_ratings` |
| Users / roles / permissions | **auth** | `users`, `roles`, `user_roles`, `modules`, `role_permissions` |
| Audit/order status history | **booking** (origin) + event log | `order_status_history` belongs to booking; events feed analytics |

## Rule
A domain may read its own tables directly (via `packages/db`). To use another domain's data,
it subscribes to that domain's events or calls a read model — it does **not** query another
domain's tables.
