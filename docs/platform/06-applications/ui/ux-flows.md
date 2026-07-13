# UI — UX Flows

Driver Portal flows (mobile-first PWA). Each is a guided experience, not a form.

## Onboarding
```
Splash → Phone entry → OTP (WhatsApp) → Claim or Register
       → Documents (if claim) → Pending approval
```

## Daily operation
```
Availability ON → Incoming Assignment (push + sound)
   → Accept → Trip Tracker (heading → pickup → onboard → complete)
   → Earnings updated → Availability returns to ON
```

## Principles (from Constitution)
- Build workflows, not screens.
- Minimize friction: fewest interactions to complete a task.
- Intentional actions, not buttons.
- Decision-support, not dashboards.

See `06-workflows/` for the underlying business flows and `design-system.md`
for tokens. State transitions: `07-state-machines/`.
