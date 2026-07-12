# ANALYTICS DOMAIN

> Business intelligence, metrics, reporting, and dashboards.

## Responsibility
- Owns: metrics, reports, dashboards, business intelligence
- Does NOT own: raw data (owned by other domains)

## Boundaries
- Inbound: Admin, API consumers
- Outbound: None (read-only, aggregates data from other domains)

## Status
- Maturity: 18%
- Extraction: Not started (8 inline SQL queries in API route)
- Portal: None

## Domain Model
- **Entities**: Metric, Report, Dashboard
- **Value Objects**: MetricType, ReportPeriod, DashboardWidget
- **Aggregates**: Metric (root: Metric, invariants: calculation rules)
- **Events**: metric.calculated, report.generated
- **Policies**: Calculation rules, aggregation periods, data retention

## Key Files
- `app/api/analytics/` — 1 API route with 8 inline queries
- `app/admin/analytics/` — Admin analytics page (SVG charts)

## Extraction Plan
1. Create Analytics domain package
2. Extract SQL queries to domain service
3. Create Analytics Portal (standalone)
