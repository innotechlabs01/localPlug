# API (Customers)

## Routes

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|------------|-------------|
| GET | /api/customers | ✅ | customers:list | List customers (admin) or self (customer) |
| GET | /api/customers/:id | ✅ | customers:read | Get customer details |
| POST | /api/customers | ✅ | customers:create | Create new customer |
| PUT | /api/customers/:id | ✅ | customers:update | Update customer profile |
| DELETE | /api/customers/:id | ✅ | customers:delete | Delete customer (admin only) |
| POST | /api/customers/:id/deactivate | ✅ | customers:deactivate | Deactivate account |
| POST | /api/customers/:id/reactivate | ✅ | customers:reactivate | Reactivate account |
| POST | /api/customers/merge | ✅ | customers:merge | Merge duplicate accounts |
| GET | /api/customers/:id/preferences | ✅ | customers:preferences:read | Get preferences |
| PUT | /api/customers/:id/preferences | ✅ | customers:preferences:update | Update preferences |
| GET | /api/customers/:id/addresses | ✅ | customers:addresses:list | List addresses |
| POST | /api/customers/:id/addresses | ✅ | customers:addresses:create | Add address |
| PUT | /api/customers/:id/addresses/:addrId | ✅ | customers:addresses:update | Update address |
| DELETE | /api/customers/:id/addresses/:addrId | ✅ | customers:addresses:delete | Remove address |
| POST | /api/customers/:id/export | ✅ | customers:export | Export data (GDPR) |

## RBAC

| Role | Read | Create | Update | Delete | Merge | Export |
|------|:----:|:------:|:------:|:------:|:-----:|:------:|
| Admin | All | ✅ | All | ✅ | ✅ | Any |
| Customer | Self | ✅ | Self | Self | ❌ | Self |
| Support | All | ❌ | ❌ | ❌ | ❌ | ❌ |

## Thin Orchestrator Rule
API routes MUST NOT contain business logic.
Validate → Call domain service → Return result.
