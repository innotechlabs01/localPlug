# State Machine — Trip

```
          ┌────────────────┐
          │ CREATED        │  on assignment accept
          └───────┬────────┘
                  │ driver heading
                  ▼
          ┌────────────────┐
          │ HEADING_PICKUP │
          └───────┬────────┘
                  │ arrived
                  ▼
          ┌────────────────┐
          │ AT_PICKUP      │
          └───────┬────────┘
                  │ boarded
                  ▼
          ┌────────────────┐
          │ ONBOARD        │
          └───────┬────────┘
        ┌─────────┼──────────┐
        │ complete│ cancel    │
        ▼         ▼           │
 ┌────────────┐ ┌──────────┐ │
 │ COMPLETED  │ │CANCELLED │ │
 └─────┬──────┘ └──────────┘ │
       │ earnings + avail    │
       ▼                     │
   (booking COMPLETED) ◄─────┘
```

## Transitions
- `CREATED → HEADING_PICKUP → AT_PICKUP → ONBOARD → COMPLETED`.
- `ONBOARD → CANCELLED` is **forbidden** (no cancel once onboard).
- `COMPLETED`: earnings calculated, driver availability → available.

## Guard rules
- One trip per accepted assignment.
- Each transition timestamps a `trip_milestone`.
