# NOTIFICATION_METRICS (Observability)

> Measure everything. If you can't measure it, you can't improve it.
> Communication metrics feed into the platform dashboard.

---

## Core Metrics

### Delivery Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `notification.sent` | counter | Total messages sent |
| `notification.delivered` | counter | Total messages confirmed delivered |
| `notification.failed` | counter | Total delivery failures |
| `notification.read` | counter | Total messages read |
| `notification.expired` | counter | Total messages expired |
| `notification.dlq` | counter | Total messages moved to DLQ |

### Timing Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `notification.latency.ms` | histogram | Time from event to send |
| `notification.delivery.time.ms` | histogram | Time from event to delivery confirmation |
| `notification.render.time.ms` | histogram | Template rendering time |
| `notification.route.time.ms` | histogram | Routing decision time |

### Provider Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `notification.provider.{channel}.sent` | counter | Sent per provider |
| `notification.provider.{channel}.failed` | counter | Failed per provider |
| `notification.provider.{channel}.latency.ms` | histogram | Latency per provider |
| `notification.provider.{channel}.circuit` | gauge | Circuit breaker state (0=closed, 1=open) |

### Queue Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `notification.queue.length` | gauge | Current queue size |
| `notification.queue.processing` | gauge | Currently processing count |
| `notification.queue.age.ms` | gauge | Age of oldest unprocessed message |

### Cost Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `notification.cost.{channel}.usd` | counter | Cost per provider in USD |
| `notification.cost.total.usd` | counter | Total cost |
| `notification.cost.{recipient_type}.usd` | counter | Cost per recipient type |

---

## Alerting Rules

### Critical Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| DLQ spike | DLQ entries > 10 in 5 minutes | Page on-call |
| Provider down | Circuit open > 10 minutes | Page on-call |
| Delivery failure rate | Failure rate > 20% in 1 hour | Page on-call |
| Queue backlog | Queue length > 100 for 5 minutes | Page on-call |

### Warning Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Delivery slowdown | P95 latency > 30 seconds | Slack notification |
| Cost spike | Daily cost > $50 | Slack notification |
| DLQ growth | DLQ entries growing for 24 hours | Slack notification |

---

## Dashboard Queries

### Delivery Success Rate (last 24h)

```sql
SELECT
  channel,
  COUNT(*) as total,
  SUM(CASE WHEN state = 'delivered' THEN 1 ELSE 0 END) as delivered,
  ROUND(100.0 * SUM(CASE WHEN state = 'delivered' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM delivery_states
WHERE transitioned_at > datetime('now', '-24 hours')
GROUP BY channel;
```

### Cost per Channel (last 7 days)

```sql
SELECT
  channel,
  COUNT(*) as messages,
  SUM(cost_usd) as total_cost,
  ROUND(SUM(cost_usd) / COUNT(*), 4) as cost_per_message
FROM notification_costs
WHERE created_at > datetime('now', '-7 days')
GROUP BY channel;
```

### DLQ Health

```sql
SELECT
  channel,
  event_type,
  COUNT(*) as unresolved,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM notification_dlq
WHERE resolved_at IS NULL
GROUP BY channel, event_type
ORDER BY unresolved DESC;
```

---

## Provider Cost Reference

| Provider | Cost per Message | Notes |
|----------|-----------------|-------|
| WhatsApp (Evolution API) | $0.005 - $0.05 | Depends on country |
| Email (SMTP) | ~$0.0001 | Infrastructure cost |
| Email (SES) | $0.0001 | AWS SES rate |
| Push (Firebase) | Free | Up to limits |
| SMS (Twilio) | $0.0075 | US number, varies by country |
| WebSocket | Free | Infrastructure cost |
| InApp | Free | Database storage |

---

## Observability Stack

```
Communication Events
    ↓
Metrics Collector (Prometheus/StatsD)
    ↓
Time Series DB (InfluxDB/Prometheus)
    ↓
Dashboards (Grafana)
    ↓
Alerts (PagerDuty/Slack)
```

For MVP: Use structured logging (`logger.info('notification.sent', {...})`)
and parse logs for metrics.
