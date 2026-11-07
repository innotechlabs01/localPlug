# DOMAIN_MODEL (Customers)

## Entities

### Customer
**Table**: `customers`
**Aggregate Root**: Yes

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| name | TEXT | ✅ | Full name |
| email | TEXT | ✅ | Email (unique) |
| phone | TEXT | ❌ | Phone number |
| avatar_url | TEXT | ❌ | Profile photo |
| status | TEXT | ✅ | CustomerStatus enum |
| language | TEXT | ✅ | Preferred language (es, en) |
| currency | TEXT | ✅ | Preferred currency (USD, EUR) |
| created_at | TEXT | ✅ | ISO timestamp |
| updated_at | TEXT | ✅ | ISO timestamp |
| deactivated_at | TEXT | ❌ | Deactivation timestamp |

### CustomerPreference
**Table**: `customer_preferences`
**Aggregate Root**: No (belongs to Customer)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| customer_id | UUID | ✅ | FK → customers.id |
| notifications_booking | BOOLEAN | ✅ | Receive booking notifications |
| notifications_payment | BOOLEAN | ✅ | Receive payment notifications |
| notifications_promotion | BOOLEAN | ✅ | Receive promotion notifications |
| quiet_hours_start | TEXT | ❌ | Quiet hours start (HH:MM) |
| quiet_hours_end | TEXT | ❌ | Quiet hours end (HH:MM) |
| timezone | TEXT | ✅ | User timezone |

### CustomerAddress
**Table**: `customer_addresses`
**Aggregate Root**: No (belongs to Customer)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| customer_id | UUID | ✅ | FK → customers.id |
| label | TEXT | ✅ | Address label (home, work, other) |
| address | TEXT | ✅ | Full address |
| lat | REAL | ✅ | Latitude |
| lng | REAL | ✅ | Longitude |
| is_default | BOOLEAN | ✅ | Default address flag |

## Value Objects

### CustomerStatus
| Value | Description |
|-------|-------------|
| `active` | Customer is active |
| `inactive` | Customer is inactive |
| `deactivated` | Customer has deactivated account |

### Language
| Value | Description |
|-------|-------------|
| `es` | Spanish |
| `en` | English |

### ContactType
| Value | Description |
|-------|-------------|
| `email` | Email contact |
| `phone` | Phone contact |
| `whatsapp` | WhatsApp contact |

## Aggregates

### Customer (Aggregate Root)
**Root Entity**: Customer
**Invariants**:
1. Email must be unique
2. Profile must have name and email
3. Preferences must exist for every customer
4. Deactivated customers cannot create bookings

| Command | Pre-conditions | State Change |
|---------|---------------|--------------|
| createCustomer | Valid input, unique email | status → active |
| updateProfile | status = active | Profile updated |
| deactivateCustomer | status = active | status → deactivated |
| reactivateCustomer | status = deactivated | status → active |
| mergeCustomers | Both customers exist | Merge into one |

## Relationships

```
Customer ──1───* CustomerPreference
Customer ──1───* CustomerAddress
Customer ──1───* Booking (Booking domain)
Customer ──1───* Chat (Chat domain)
Customer ──1───* Rating (Ratings domain)
```
