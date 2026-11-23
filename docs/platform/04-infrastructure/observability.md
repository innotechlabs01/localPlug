# Operations — Observability

## Three pillars
- **Logs** — structured JSON logs; no sensitive data (phones masked, see `../03-engineering/security.md`).
- **Metrics** — request latency, error rate, realtime delivery, pool usage.
- **Traces** — correlation IDs on every domain event for end-to-end tracing.

## Roadmap
| Area | Current | Future |
|---|---|---|
| Monitoring | Logs | OpenTelemetry + Grafana |
| Cache | In-memory | Redis (distributed) |
| Queue | In-process | BullMQ (persistent) |
| Search | DB queries | Meilisearch (full-text) |

## Rules
- Every cross-domain event carries a correlation ID.
- Logs never contain secrets or PII beyond masked identifiers.
- Dashboards derive from read models (`01-business/analytics`), not hot tables.
