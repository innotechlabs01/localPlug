# SETTINGS DOMAIN

> System configuration, feature flags, and application settings.

## Responsibility
- Owns: system settings, feature flags, configuration management
- Does NOT own: domain-specific settings (e.g., hotel commission is Hotels)

## Boundaries
- Inbound: Admin, API consumers
- Outbound: All domains (read settings)

## Status
- Maturity: 30%
- Extraction: Not started (lib/settings.ts, 317L)
- Portal: None

## Domain Model
- **Entities**: Setting, FeatureFlag, SettingGroup
- **Value Objects**: SettingType, SettingScope, FeatureFlagStatus
- **Aggregates**: Setting (root: Setting, invariants: type safety, scope rules)
- **Events**: setting.updated, feature_flag.toggled
- **Policies**: Setting validation, feature flag rules, scope isolation

## Key Files
- `lib/settings.ts` — Settings service (317L, needs extraction)
- `app/admin/settings/` — Admin settings page (553L)
- `packages/db/src/domains/settings/` — settings table

## Extraction Plan
1. Create Settings domain package
2. Extract from lib/settings.ts
3. Add setting events
