# Data Model: Admin Dashboard with Order Queue & i18n

## Entities

### Order

A customer booking record in the admin queue.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `order_number` | string | yes | unique, format ORD-YYYY-NNN | Generated on creation |
| `booking_reference` | string | yes | unique | Links to booking |
| `customer_name` | string | yes | min 2 chars | |
| `customer_email` | string | yes | valid email | |
| `customer_phone` | string | no | | |
| `customer_country` | string | no | | |
| `package_id` | string | yes | one of: smooth-landing, first-24, full-insider | |
| `package_name` | string | yes | | Human-readable |
| `package_price` | integer | yes | > 0 | Amount in cents |
| `currency` | string | yes | ISO 4217 | Default: usd |
| `flight_number` | string | no | | |
| `airline` | string | no | | |
| `arrival_date` | string | no | ISO date | |
| `arrival_time` | string | no | HH:MM | |
| `destination_address` | string | no | | |
| `destination_has_place` | integer | no | 0 or 1 | Default: 1 |
| `additional_trips` | string | no | JSON array | |
| `traveler_profile` | string | no | one of: family, celebration, nomad, medical | |
| `status` | string | yes | one of: new, confirmed, in_progress, on_hold, completed, cancelled | Default: new |
| `priority` | string | yes | one of: low, normal, high, urgent | Default: normal |
| `assigned_to` | integer | no | FK → users.id | |
| `assigned_at` | string | no | ISO timestamp | |
| `payment_status` | string | yes | one of: pending, completed, failed, refunded | Default: pending |
| `payment_id` | integer | no | FK → payments.id | |
| `internal_notes` | string | no | | |
| `customer_notes` | string | no | | |
| `status_changed_at` | string | no | ISO timestamp | |
| `status_changed_by` | integer | no | FK → users.id | |
| `created_at` | string | yes | ISO timestamp | Default: datetime('now') |
| `updated_at` | string | yes | ISO timestamp | Default: datetime('now') |

**State transitions**: `new` → `confirmed` → `in_progress` → `completed` | `on_hold` → `in_progress` | any → `cancelled`

### User

Admin or team member account.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `email` | string | yes | unique, valid email | |
| `name` | string | yes | min 2 chars | |
| `password_hash` | string | yes | | Bcrypt hash |
| `avatar_url` | string | no | URL | |
| `phone` | string | no | | |
| `status` | string | yes | one of: active, inactive, suspended | Default: active |
| `last_login_at` | string | no | ISO timestamp | |
| `created_at` | string | yes | ISO timestamp | |
| `updated_at` | string | yes | ISO timestamp | |

### Role

Named permission group for RBAC.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `name` | string | yes | unique | e.g., admin, manager |
| `description` | string | no | | |
| `created_at` | string | yes | ISO timestamp | |

**Seeded roles**: admin (17/17 permissions), manager (10), concierge (5), viewer (2)

### Permission

Granular access control entry.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `name` | string | yes | unique | e.g., orders.view |
| `description` | string | no | | |
| `resource` | string | yes | e.g., orders, users | |
| `action` | string | yes | e.g., view, create | |
| `created_at` | string | yes | ISO timestamp | |

**Permission pattern**: `{resource}.{action}` (e.g., orders.view, users.create)

### OrderStatusHistory

Audit trail for order status changes.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `order_id` | integer | yes | FK → orders.id | |
| `old_status` | string | no | | Previous status |
| `new_status` | string | yes | | New status |
| `changed_by` | integer | no | FK → users.id | |
| `notes` | string | no | | |
| `created_at` | string | yes | ISO timestamp | |

### OrderComment

Internal or customer-facing comments on orders.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | integer | yes | auto-increment | Primary key |
| `order_id` | integer | yes | FK → orders.id | |
| `user_id` | integer | yes | FK → users.id | |
| `content` | string | yes | min 1 char | |
| `is_internal` | integer | no | 0 or 1 | Default: 1 |
| `created_at` | string | yes | ISO timestamp | |

## Relationships

```
users ──< user_roles >── roles
roles ──< role_permissions >── permissions
users ──< orders (assigned_to)
orders ──< order_status_history
orders ──< order_comments
users ──< order_comments
orders ──< payments (payment_id)
```

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| orders | idx_orders_status | status |
| orders | idx_orders_priority | priority |
| orders | idx_orders_assigned_to | assigned_to |
| orders | idx_orders_created_at | created_at |
| orders | idx_orders_order_number | order_number |
| orders | idx_orders_booking_reference | booking_reference |
| users | idx_users_email | email |
| users | idx_users_status | status |
| order_status_history | idx_order_history_order_id | order_id |
| order_comments | idx_order_comments_order_id | order_id |
