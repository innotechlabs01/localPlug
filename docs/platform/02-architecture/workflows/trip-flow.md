# Workflow — Trip Flow

```
Trip created on assignment accept
      ↓
Driver navigates → trip:status_changed (heading_to_pickup)
      ↓
Arrived at pickup → trip:status_changed (arrived)
      ↓
Passenger boards → trip:status_changed (onboard)
      ↓
Dropoff → trip:completed
      ↓
Earnings calculated → driver.availability = available
      ↓
payment:earned  ──► payout aggregation
```

## Rules
- One trip per accepted assignment.
- Each transition timestamped in `trip_milestones`.
- Driver cannot cancel once onboard.
- Completion triggers earnings + availability reset.

## Related
- Domain: `01-business/trips`
- State machine: `../07-state-machines/trip.md`
- Earnings: `payment-flow.md`
