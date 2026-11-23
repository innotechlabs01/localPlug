# DOMAIN_TEMPLATE (Uniform Structure)

> Every business domain MUST have exactly these 9 files.
> No exceptions. No shortcuts. No "we'll add it later."

---

## File Specifications

### 1. README.md

```markdown
# {DOMAIN} DOMAIN

> One sentence describing what this domain does.

## Responsibility
- Owns: [what this domain owns]
- Does NOT own: [what this domain does NOT own]

## Boundaries
- Inbound: [what calls this domain]
- Outbound: [what this domain calls]

## Status
- Stage: Capability / Domain / Runtime / Application / Portal
- Maturity: X%
- Extraction: Not started / In progress / Complete

## Domain Model
- Entities: [list]
- Value Objects: [list]
- Aggregates: [list]
- Events: [list]
- Policies: [list]
```

### 2. DOMAIN_MODEL.md

```markdown
# DOMAIN_MODEL ({DOMAIN})

## Entities

### {Entity Name}
**Table**: `{table_name}`
**Aggregate Root**: Yes/No

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| ... | ... | ... | ... |

### Value Objects

#### {Value Object Name}
| Property | Type | Validation |
|----------|------|------------|
| ... | ... | ... |

### Aggregates

#### {Aggregate Name}
**Root Entity**: {Entity}
**Invariants**: [rules that must hold]

| Command | Pre-conditions | State Change |
|---------|---------------|--------------|
| ... | ... | ... |

### Relationships
- Entity A ──1───* Entity B
- Entity C *───1 Entity A
```

### 3. EVENTS.md

```markdown
# EVENTS ({DOMAIN})

## Events Produced

| Event | Producer | Payload | Consumers |
|-------|----------|---------|-----------|
| {domain}.created | {Service} | {...} | [list] |
| {domain}.updated | {Service} | {...} | [list] |

## Events Consumed

| Event | Source | Handler | Action |
|-------|--------|---------|--------|
| {event} | {domain} | {Handler} | [what it does] |

## Event Schema
```typescript
interface {Domain}CreatedEvent {
  type: '{domain}.created'
  aggregateId: string
  payload: { ... }
}
```

## Integration with Event Bus
- Publisher: [who publishes]
- Consumers: [who consumes]
- Correlation: [how events are correlated]
```

### 4. POLICIES.md

```markdown
# POLICIES ({DOMAIN})

## Policy: {Name}
**Description**: ...
**Trigger**: When ...
**Rule**: ...

### Business Rules
1. Rule 1
2. Rule 2

### Exceptions
- When X happens, do Y instead

### Invariants
- Invariant 1: must always be true
- Invariant 2: must never be violated

## Policy: {Name 2}
...
```

### 5. API.md

```markdown
# API ({DOMAIN})

## Routes

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|------------|-------------|
| GET | /api/{domain} | ✅ | {domain}:view | List |
| POST | /api/{domain} | ✅ | {domain}:create | Create |
| PUT | /api/{domain}/:id | ✅ | {domain}:update | Update |
| DELETE | /api/{domain}/:id | ✅ | {domain}:delete | Delete |

## Request/Response Schemas
- See packages/validation/src/{domain}/

## RBAC

| Role | Read | Create | Update | Delete | Special |
|------|:----:|:------:|:------:|:------:|---------|
| Admin | ✅ | ✅ | ✅ | ✅ | All |
| Manager | ✅ | ✅ | ✅ | ❌ | Own only |
| Viewer | ✅ | ❌ | ❌ | ❌ | Read only |

## Thin Orchestrator Rule
API routes MUST NOT contain business logic.
Validate → Call domain service → Return result.
```

### 6. STATE_MACHINE.md

```markdown
# STATE_MACHINE ({DOMAIN})

## Entity: {Name}

### States
```
State A → State B → State C
              ↓
           State D (terminal)
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| State A | State B | {action} | {condition} | {effect} |
| State B | State C | {action} | {condition} | {effect} |
| State B | State D | {action} | {condition} | {effect} |

### Invalid Transitions
- From State A to State C: NEVER (must go through B)
- From State D to any: NEVER (terminal state)

### Persistence
- State stored in: {table}.{column}
- State changes are audited
```

### 7. WORKFLOWS.md

```markdown
# WORKFLOWS ({DOMAIN})

## Workflow: {Name}

### Trigger
{What starts this workflow}

### Steps
1. {Step 1} → {Domain/Service}
2. {Step 2} → {Domain/Service}
3. {Step 3} → {Domain/Service}

### Events
- {event 1} published at step {N}
- {event 2} published at step {N}

### Error Handling
- If step {N} fails: {recovery}
- If step {N} fails: {recovery}

### Timeout
- Max duration: {X}
- Timeout action: {what happens}

---

## Workflow: {Name 2}
...
```

### 8. UI.md

```markdown
# UI ({DOMAIN})

## Applications Using This Domain

| Application | Pages | Components | Notes |
|-------------|-------|------------|-------|
| Admin | {pages} | {components} | {notes} |
| Driver Portal | {pages} | {components} | {notes} |
| Customer Portal | {pages} | {components} | {notes} |
| Hotel Portal | {pages} | {components} | {notes} |

## Admin Pages

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| {Page} | /admin/{domain} | {list} | API → Domain Service |

## Portal Pages (Planned)

| Page | Path | Components | Data Source |
|------|------|------------|-------------|
| {Page} | /portal/{domain} | {list} | API → Domain Service |

## Components

| Component | Purpose | Used By |
|-----------|---------|---------|
| {Component} | {purpose} | {pages} |
```

### 9. MIGRATION.md

```markdown
# MIGRATION ({DOMAIN})

## Current State
- Location: {where the logic currently lives}
- Tables: {existing tables}
- API Routes: {existing routes}
- Admin Pages: {existing pages}
- Dependencies: {what depends on this}

## Extraction Plan

| Step | Task | Depends On | Effort | Status |
|------|------|-----------|--------|--------|
| 1 | Create domain package | — | X days | ⬜ |
| 2 | Extract entities | Step 1 | X days | ⬜ |
| 3 | Extract services | Step 2 | X days | ⬜ |
| 4 | Extract repositories | Step 3 | X days | ⬜ |
| 5 | Create events | Step 4 | X days | ⬜ |
| 6 | Refactor API routes | Step 5 | X days | ⬜ |
| 7 | Refactor Admin page | Step 6 | X days | ⬜ |
| 8 | Add tests | Step 7 | X days | ⬜ |
| 9 | Update documentation | Step 8 | X days | ⬜ |

## Dependencies
- What this domain needs from others
- What others need from this domain

## Risk Assessment
- Risk 1: {description} → Mitigation: {action}
- Risk 2: {description} → Mitigation: {action}

## Rollback Plan
- If extraction fails: {how to rollback}
- Feature flag: {flag name}
```
