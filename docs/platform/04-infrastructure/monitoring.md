# Operations — Monitoring

## What we watch
- HTTP error rate and P95 latency per app (`../03-engineering/performance.md`).
- WebSocket connection count, reconnect rate, event delivery latency (< 500ms).
- DB connection pool usage (concurrency: 16).
- Container health (Coolify healthchecks).
- n8n / Evolution API uptime (external dependencies).

## Signals
- `stats:update` events feed live admin/dispatch dashboards.
- Room-based event volume is a leading indicator of load.

## Alerting
- Page on-call when error rate > threshold or latency budget breached.
- Alert when WebSocket delivery latency exceeds 500ms P95.
