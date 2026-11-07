# STATE_MACHINE (Customers)

## Entity: Customer

### States
```
┌──────────┐      ┌──────────┐
│ inactive │─────►│  active  │
└──────────┘      └────┬─────┘
                       │ deactivate
                       ▼
                  ┌──────────────┐
                  │ deactivated  │
                  └──────────────┘
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| inactive | active | register | Valid input, unique email | Publish `customer.created` |
| active | deactivated | deactivate | Customer request | Publish `customer.deactivated` |
| deactivated | active | reactivate | Customer request | Publish `customer.reactivated` |

### Invalid Transitions
- inactive → deactivated: NEVER (must be active first)
- deactivated → inactive: NEVER (must reactivate first)

---

## Entity: CustomerAddress

### States
```
┌──────────┐      ┌──────────┐
│ inactive │─────►│  active  │
└──────────┘      └──────────┘
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| inactive | active | addAddress | Valid address | None |
| active | inactive | removeAddress | Not default | None |

### Invariants
- Exactly one default address per customer
- Default address cannot be removed (must set new default first)
