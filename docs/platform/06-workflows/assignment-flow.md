# Workflow — Assignment Flow

```
Driver receives assignment:new (push + in-app + WhatsApp)
      ↓
Driver taps Accept / Reject / Ignore
      ↓
Accept  → assignment:accepted
           → driver.availability = busy
           → Trip created (1:1)  → trip:status_changed
Reject  → assignment:rejected
           → next candidate or re-match
Ignore  → timer expires → assignment:expired
           → next candidate or escalate to dispatcher
```

## Rules
- Acceptance is scoped to the assigned driver only.
- On accept, availability flips to `busy` until trip completes.
- One accepted assignment yields exactly one trip.

## Related
- Domain: `01-business/dispatch`
- State machine: `../07-state-machines/assignment.md`
