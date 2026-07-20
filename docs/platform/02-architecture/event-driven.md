# Architecture — Event-Driven

The event bus is the backbone of cross-domain communication.

```
Domain publishes event → Event Bus → Realtime broadcasts → Connected clients
```

## Event categories
| Category | Examples | Target |
|---|---|---|
| Driver | status_changed, connected, disconnected | dispatch, admin |
| Assignment | new, accepted, rejected, expired, cancelled | driver, dispatch |
| Trip | status_changed, completed | dispatch, admin |
| Notification | new, read | driver, customer |
| Booking | created, updated, cancelled | dispatch, admin |
| Stats | update | admin |

## Event structure
```typescript
interface DomainEvent {
  type: string;                    // 'assignment:new'
  timestamp: number;               // unix ms
  version: number;                 // schema version
  payload: Record<string, unknown>;
}
```

## Rules
1. Events are immutable once published.
2. Events are typed via `packages/types`.
3. No business logic in event handlers.
4. Handlers must be idempotent.
5. Failed events are logged, never block the caller.
6. Events include correlation IDs for tracing.

## Full catalog
See Appendix B of `../MASTER_SPEC.md` for the complete event list.
