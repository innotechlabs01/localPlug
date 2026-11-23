# EXTRACTION_TRACKS (Platform + Business)

> Two parallel work lines that never conflict.
> Platform builds infrastructure. Business builds capabilities.
> They share the Event Bus and DB schema but change different files.

---

## Platform Line (Infrastructure)

**Goal**: Build the runtime that all business capabilities consume.
**Owner**: Platform team (or same developer, different context).
**Rule**: No business logic. No domain-specific code. Pure infrastructure.

### Track

```
B11B Communication Runtime    ← Build notification channels (WhatsApp, Email, SMS)
    ↓
B12 Booking State Machine     ← Build state machine infrastructure
    ↓
B5B  Payment Integration      ← Build payment abstraction (Stripe, PayPal, Crypto)
    ↓
B22  Admin Dashboard v2       ← Build dashboard infrastructure (widgets, analytics)
    ↓
B19  Maps Integration         ← Build mapping abstraction (Google, Mapbox, OSRM)
```

### Dependencies
- B11B depends on: B11A (done), B10 (done)
- B12 depends on: B11B (notification triggers)
- B5B depends on: B10 (events), Stripe SDK
- B22 depends on: B10 (events), B11B (notifications)
- B19 depends on: Google Maps API key

### Rules
1. No business logic in platform code
2. Platform provides abstractions, not implementations
3. Business capabilities register their handlers
4. Platform never knows about specific domains

---

## Business Line (Capabilities)

**Goal**: Extract business capabilities from Admin into domain packages.
**Owner**: Business domain owner (or same developer, different context).
**Rule**: Move behavior, never copy. Constitution §14.

### Track (by priority score ascending)

```
1. Hotels    (28%)  ← Largest embedded domain, 935-line page
    ↓
2. Customers (25%)  ← Schema discrepancy fix first
    ↓
3. Ratings   (28%)  ← Consolidate 2 tables
    ↓
4. Cases     (22%)  ← Clean boundaries, 4 tables
    ↓
5. Chat      (22%)  ← Most complex, AI coupling
    ↓
6. AI        (18%)  ← Extract with Chat
    ↓
7. Analytics (18%)  ← Read-only, lowest effort
    ↓
8. Settings  (30%)  ← High coupling, extract carefully
```

### Dependencies
- Hotels: B11B (notification triggers for hotel events)
- Customers: None (schema fix only)
- Ratings: Chat (ratings are part of chat flow)
- Cases: Chat (cases are chat escalations)
- Chat: AI (tightly coupled)
- AI: Chat (tightly coupled)
- Analytics: All other domains (reads their data)
- Settings: None (key-value store)

### Rules
1. Each capability fully extracted before starting next
2. No partial extraction (all 13 files or don't start)
3. API routes are thin orchestrators always
4. Events published for all state changes
5. Documentation updated after each extraction

---

## Merge Strategy

### When Platform and Business change the same area

| Situation | Resolution |
|-----------|------------|
| Both need Event Bus changes | Platform wins. Business adapts. |
| Both need DB schema changes | Platform provides migration, Business adapts. |
| Both need API route changes | Platform provides middleware, Business adapts. |
| Business needs notification | Business defines intent, Platform delivers. |
| Platform needs business event | Business publishes, Platform consumes. |

### Merge Order
1. Platform changes merged first (infrastructure)
2. Business extraction on top (uses infrastructure)
3. Never both changing the same file simultaneously
4. If conflict: platform wins, business adapts

### Branch Strategy
```
main
├── feature/platform-b11b      ← Communication Runtime
├── feature/platform-b12       ← Booking State Machine
├── feature/platform-b5b       ← Payment Integration
├── feature/business-hotels    ← Hotel Domain Extraction
├── feature/business-customers ← Customer Domain Extraction
└── feature/business-chat      ← Chat Domain Extraction
```

Each branch is independent. Merge when ready. No blocking.

---

## Coordination Points

These are the ONLY places where Platform and Business touch:

| Coordination | Platform Role | Business Role |
|--------------|--------------|---------------|
| Event Bus | Provides bus, routing | Defines events, publishes |
| DB Schema | Provides migrations | Defines tables |
| API Routes | Provides middleware | Defines endpoints |
| Notifications | Provides channels | Defines intents |
| Auth | Provides RBAC | Defines permissions |
| Validation | Provides schemas | Defines contracts |

Everything else is independent.
