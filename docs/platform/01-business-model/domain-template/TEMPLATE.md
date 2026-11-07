# DOMAIN_TEMPLATE

> This is the MANDATORY structure for every business capability in LocalPlug.
> Every domain MUST have exactly these files.
> No exceptions. No shortcuts. No "we'll add it later."

---

## Directory Structure

```
01-business/{capability}/
├── README.md                 ← Overview, responsibility, boundaries
├── DOMAIN_MODEL.md           ← Entities, value objects, aggregates
├── ENTITIES.md               ← Detailed entity definitions
├── VALUE_OBJECTS.md          ← Value objects and their rules
├── AGGREGATES.md             ← Aggregate roots and consistency boundaries
├── POLICIES.md               ← Business rules and domain policies
├── SERVICES.md               ← Domain services and their contracts
├── EVENTS.md                 ← Domain events produced and consumed
├── REPOSITORIES.md           ← Repository contracts and persistence
├── PERMISSIONS.md            ← RBAC, access control, ownership
├── API.md                    ← API routes and contracts
├── DATABASE.md               ← Tables, indexes, migrations
├── ROADMAP.md                ← Extraction and evolution plan
└── MATURITY.md               ← Current score and improvement plan
```

---

## File Specifications

### README.md

```markdown
# {Capability Name}

> One sentence describing what this capability does.

## Responsibility
- What this domain owns
- What this domain does NOT own

## Boundaries
- Inbound: what calls this domain
- Outbound: what this domain calls

## Status
- Maturity: X%
- Extraction: Not started / In progress / Complete
- Portal: None / Planned / In development / Live
```

### DOMAIN_MODEL.md

```markdown
# DOMAIN_MODEL ({Capability})

## Entities
- [Entity Name](ENTITIES.md#entity-name) — description

## Value Objects
- [Value Object Name](VALUE_OBJECTS.md#value-object-name) — description

## Aggregates
- [Aggregate Name](AGGREGATES.md#aggregate-name) — root entity + invariants

## Relationships
- Entity A ──1───* Entity B
- Entity C *───1 Entity A
```

### ENTITIES.md

```markdown
# ENTITIES ({Capability})

## Entity: {Name}

**Table**: `{table_name}`
**Aggregate Root**: Yes/No

### Fields
| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| id | UUID | ✅ | Primary key |
| ... | ... | ... | ... |

### Business Rules
- Rule 1: ...
- Rule 2: ...

### State Machine
```
State A → State B → State C
```

### Invariants
- Invariant 1: ...
- Invariant 2: ...
```

### VALUE_OBJECTS.md

```markdown
# VALUE_OBJECTS ({Capability})

## Value Object: {Name}

**Description**: ...

### Properties
| Property | Type | Validation |
|----------|------|------------|
| ... | ... | ... |

### Factory Methods
- `create(...)`: Creates validated instance
- `fromPrimitive(...)`: Reconstitutes from stored data

### Invariants
- ...
```

### AGGREGATES.md

```markdown
# AGGREGATES ({Capability})

## Aggregate: {Name}

**Root Entity**: {Entity}
**Invariants**: Rules that must hold true at all times

### Consistency Boundaries
- What changes atomically with this aggregate
- What can be eventually consistent

### Commands
| Command | Pre-conditions | State Change |
|---------|---------------|--------------|
| ... | ... | ... |

### Queries
| Query | Returns | Notes |
|-------|---------|-------|
| ... | ... | ... |
```

### POLICIES.md

```markdown
# POLICIES ({Capability})

## Policy: {Name}

**Description**: ...
**Trigger**: When ...
**Rule**: ...

### Implementation
```typescript
// packages/domains/{capability}/src/policies/{policy}.ts
```

### Business Rules
1. Rule 1
2. Rule 2

### Exceptions
- When X happens, do Y instead
```

### SERVICES.md

```markdown
# SERVICES ({Capability})

## Service: {Name}

**Responsibility**: ...

### Interface
```typescript
interface {Name}Service {
  method1(input: InputType): Promise<Result<OutputType>>
  method2(id: string): Promise<Result<Entity>>
}
```

### Methods
| Method | Input | Output | Side Effects |
|--------|-------|--------|-------------|
| ... | ... | ... | ... |

### Error Handling
| Error | Code | Action |
|-------|------|--------|
| ... | ... | ... |
```

### EVENTS.md

```markdown
# EVENTS ({Capability})

## Events Produced

| Event | Producer | Payload | Consumers |
|-------|----------|---------|-----------|
| {capability}.created | {Service} | {...} | Notifications, Analytics |
| {capability}.updated | {Service} | {...} | Analytics |

## Events Consumed

| Event | Handler | Action |
|-------|---------|--------|
| {external}.event | {Handler} | ... |

## Event Schema
```typescript
interface {Capability}CreatedEvent {
  type: '{capability}.created'
  aggregateId: string
  payload: { ... }
}
```
```

### REPOSITORIES.md

```markdown
# REPOSITORIES ({Capability})

## Repository: {Name}

**Aggregate**: {Aggregate}
**Table**: {table}

### Interface
```typescript
interface {Name}Repository {
  findById(id: string): Promise<Entity | null>
  findMany(filters: Filters): Promise<PaginatedResult<Entity>>
  create(data: CreateInput): Promise<Entity>
  update(id: string, data: UpdateInput): Promise<Entity>
  delete(id: string): Promise<void>
}
```

### Custom Queries
| Query | Purpose | Performance |
|-------|---------|-------------|
| ... | ... | ... |
```

### PERMISSIONS.md

```markdown
# PERMISSIONS ({Capability})

## RBAC

| Role | Read | Create | Update | Delete | Special |
|------|:----:|:------:|:------:|:------:|---------|
| Admin | ✅ | ✅ | ✅ | ✅ | All |
| Manager | ✅ | ✅ | ✅ | ❌ | Own only |
| Viewer | ✅ | ❌ | ❌ | ❌ | Read only |

## Ownership Rules
- Entity X belongs to User Y via field Z
- Scoped access: users can only see their own

## Audit
- All changes logged with user_id, timestamp, action
```

### API.md

```markdown
# API ({Capability})

## Routes

| Method | Path | Auth | Permission | Description |
|--------|------|:----:|------------|-------------|
| GET | /api/{capability} | ✅ | {capability}:view | List |
| POST | /api/{capability} | ✅ | {capability}:create | Create |
| PUT | /api/{capability}/:id | ✅ | {capability}:update | Update |
| DELETE | /api/{capability}/:id | ✅ | {capability}:delete | Delete |

## Request/Response Schemas
- See packages/validation/src/{capability}/

## Thin Orchestrator Rule
API routes MUST NOT contain business logic.
They validate input → call domain service → return result.
```

### DATABASE.md

```markdown
# DATABASE ({Capability})

## Tables

### {table_name}
| Column | Type | Index | Notes |
|--------|------|:-----:|-------|
| id | TEXT | PK | UUID |
| ... | ... | ... | ... |

## Migrations
| Migration | Description | Date |
|-----------|-------------|------|
| ... | ... | ... |

## Relationships
```sql
{table} FK → {other_table}
```

## Seed Data
- Default records if any
```

### ROADMAP.md

```markdown
# ROADMAP ({Capability})

## Current State
- Maturity: X%
- Biggest gap: ...

## Extraction Plan
| Step | Task | Depends On | Effort |
|------|------|-----------|--------|
| 1 | ... | ... | X days |
| 2 | ... | ... | X days |

## Portal Plan (if applicable)
- Phase 1: ...
- Phase 2: ...

## Dependencies
- What this capability needs from others
- What others need from this capability
```

### MATURITY.md

```markdown
# MATURITY ({Capability})

## Current Score: X/100

| Dimension | Score | Evidence | Target |
|-----------|:-----:|----------|:------:|
| Business Domain | X | ... | 8 |
| Architecture | X | ... | 8 |
| Engineering | X | ... | 8 |
| Infrastructure | X | ... | 8 |
| Application | X | ... | 8 |
| Portal | X | ... | 8 |
| Tests | X | ... | 8 |
| Events | X | ... | 8 |
| API | X | ... | 8 |
| Documentation | X | ... | 10 |
| **Total** | **X%** | | **80%** |

## Improvement Plan
| Dimension | Current | Target | Action | ETA |
|-----------|:-------:|:------:|--------|-----|
| ... | ... | ... | ... | ... |
```
