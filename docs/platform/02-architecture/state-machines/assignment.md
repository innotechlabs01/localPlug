# State Machine — Assignment

```
          ┌─────────┐
          │ CREATED │  assignment:new → driver
          └────┬────┘
     ┌─────────┼──────────┬──────────┐
     │ accept  │ reject    │ expire   │ cancel
     ▼         ▼           ▼          ▼
┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ACCEPTED  │ │REJECTED │ │EXPIRED  │ │CANCELLED│
└────┬─────┘ └─────────┘ └────┬────┘ └─────────┘
     │                        │
     │ trip created           │ re-match next driver
     ▼                        │ or escalate to dispatcher
┌──────────┐                  │
│FULFILLED │ ◄────────────────┘
└──────────┘
```

## Transitions
- `CREATED → ACCEPTED`: driver accepts (timer stopped, trip created).
- `CREATED → REJECTED`: driver rejects (re-match).
- `CREATED → EXPIRED`: timer elapsed (re-match or escalate).
- `CREATED → CANCELLED`: dispatcher cancels.
- `ACCEPTED → FULFILLED`: linked trip completed.

## Guard rules
- Timer default 45s (configurable).
- Only Approved + Available drivers receive `CREATED`.
- Acceptance scoped to assigned driver.
