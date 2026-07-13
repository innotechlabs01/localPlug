# Architecture — Realtime

## Technology
- **Server:** Socket.IO (Node.js)
- **Transport:** WebSocket with HTTP fallback
- **Scaling:** Redis adapter for horizontal scaling
- **Deployment:** Persistent process (NOT serverless)

## Connection flow
```
Client connects → Verify Clerk JWT → Join rooms → Receive events
```

## Rooms
| Room | Purpose | Members |
|---|---|---|
| `driver:{id}` | per-driver events | single driver |
| `dispatch` | dispatch panel events | all dispatchers |
| `admin` | admin dashboard events | all admins |
| `all-drivers` | broadcast to all drivers | all connected drivers |

## Publishing
```
Domain Service → Event Bus → Socket.IO Server → Room Broadcast → Clients
```

## Rules
1. No business logic in the realtime layer.
2. Events are typed and validated.
3. Failed broadcasts are logged, not retried.
4. Client reconnection handles missed events.
5. Heartbeat monitoring for connection health.

See `event-driven.md` and `../04-operations/monitoring.md`.
