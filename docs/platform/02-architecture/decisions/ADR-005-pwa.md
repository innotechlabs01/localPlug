# ADR-005 — Driver Portal as PWA

**Status:** Accepted
**Date:** 2026-07-11

## Context
Drivers are mobile-first in the field. A native app is costly to maintain across
platforms; a responsive website alone lacks installability and offline indicators.

## Decision
Build the **Driver Portal as an installable PWA** (Next.js 15). Requirements:
installable on Android/iOS, full-screen, splash screen, offline indicator, smooth
transitions, haptic feedback on critical actions. Customer Portal will follow the
same PWA pattern.

## Consequences
- ✅ Native-like experience without app-store overhead.
- ✅ Shared design system and domains with other portals.
- ⚠️ PWA iOS limitations (e.g., push) require WhatsApp/Evolution fallback for
  critical notifications (`01-business/notifications`).
