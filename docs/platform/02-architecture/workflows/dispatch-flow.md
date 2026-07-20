# Workflow — Dispatch Flow

```
Booking in queue (confirmed)
      ↓
Match engine filters: Approved + Available drivers
      ↓
Rank by VIP, vehicle type, experience
      ↓
Create Assignment → assignment:new  ──► driver room
      ↓
[wait timer: default 45s]
   ├── Accepted  → assignment:accepted  → trip created
   ├── Rejected  → assignment:rejected  → next driver / re-match
   ├── Expired   → assignment:expired   → re-match or escalate
   └── Cancelled → assignment:cancelled → dispatcher action
```

## Rules
- Only Approved + Available drivers are candidates.
- A booking can receive multiple assignments (rejection/reassignment).
- Expiry escalates to dispatcher if no acceptance.

## Related
- Domain: `01-business/dispatch`
- State machine: `../07-state-machines/assignment.md`
- Sub-flow: `assignment-flow.md`
