# SETTINGS DOMAIN

> System configuration, feature flags, and application settings.

## Responsibility
- Owns: system settings, feature flags, configuration management, setting validation
- Does NOT own: domain-specific settings (e.g., hotel commission is Hotels)

## Boundaries
- Inbound: Admin, API consumers
- Outbound: All domains (read settings)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 30%
- Extraction: Not started

## Domain Model
- Entities: Setting, FeatureFlag, SettingGroup
- Value Objects: SettingType, SettingScope, FeatureFlagStatus
- Aggregates: Setting (root, invariants: type safety, scope rules)
- Events: setting.updated, feature_flag.toggled
- Policies: SettingValidationPolicy, FeatureFlagPolicy, ScopePolicy
