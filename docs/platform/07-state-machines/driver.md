# State Machine — Driver

Two independent dimensions. Do not confuse them.

## account_status (admin-controlled)
```
          ┌─────────┐
          │ PENDING │  registered / claimed
          └────┬────┘
       ┌───────┼─────────┐
       │ approve│ reject  │ suspend
       ▼        ▼         ▼
  ┌────────┐ ┌────────┐ ┌─────────┐
  │APPROVED│ │REJECTED│ │SUSPENDED│
  └────┬───┘ └────────┘ └────┬────┘
       │                     │ reinstate
       │                     ▼
       └──────────► APPROVED
```

## availability (driver-controlled)
```
   ┌─────────┐  toggle   ┌─────────┐
   │ OFFLINE │ ◄───────► │AVAILABLE│
   └─────────┘           └────┬────┘
                              │ accept assignment
                              ▼
                         ┌─────────┐
                         │  BUSY   │
                         └────┬────┘
                              │ trip completed
                              ▼
                         ┌─────────┐
                         │AVAILABLE│
                         └─────────┘
```

## Rules
- Only `APPROVED + AVAILABLE` drivers receive assignments.
- `availability` changes are scoped to the authenticated driver.
- `account_status` changes require admin action.
- Claim flow prioritized over new registration (prevents duplicates).
