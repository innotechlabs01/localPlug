# ANALYTICS DOMAIN

> Business intelligence, metrics, reporting, and dashboards.

## Responsibility
- Owns: metrics, reports, dashboards, business intelligence, data aggregation
- Does NOT own: raw data (owned by other domains)

## Boundaries
- Inbound: Admin, API consumers
- Outbound: None (read-only, aggregates data from other domains)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 18%
- Extraction: Not started

## Domain Model
- Entities: Metric, Report, Dashboard, DashboardWidget
- Value Objects: MetricType, ReportPeriod, DashboardLayout, DataSource
- Aggregates: Report (root, invariants: calculation rules, data freshness)
- Events: metric.calculated, report.generated
- Policies: CalculationPolicy, AggregationPolicy, DataRetentionPolicy
