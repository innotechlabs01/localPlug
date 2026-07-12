# ADR-004 — Socket.IO Realtime

**Status:** Accepted
**Date:** 2026-07-11

## Context
Real-time dispatch requires sub-500ms delivery and live dashboards. Polling the
existing admin API is insufficient and does not scale.

## Decision
Adopt **Socket.IO** as a persistent realtime service from day one. Rooms:
`driver:{id}`, `dispatch`, `admin`, `all-drivers`. Horizontal scaling via Redis
adapter. Deployed as a persistent container (Hetzner + Coolify), never serverless.

## Consequences
- ✅ Real-time dispatch and live ops dashboards.
- ✅ Clear event-driven boundary; no business logic in the realtime layer.
- ⚠️ A persistent stateful service to operate (mitigated by Redis adapter + healthchecks).
