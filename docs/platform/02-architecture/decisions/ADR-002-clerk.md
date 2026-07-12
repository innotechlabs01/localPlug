# ADR-002 — Clerk for Identity

**Status:** Accepted
**Date:** 2026-07-11

## Context
We need secure auth with OTP, multi-app SSO, and session/device management. Building
this ourselves is high-risk and off-mission.

## Decision
Use **Clerk** for identity (sessions, JWT, OTP). Driver auth uses a branded OTP flow
via WhatsApp (Evolution API) on top of Clerk. `packages/auth` handles identity only —
authorization (RBAC) lives in domain services.

## Consequences
- ✅ Battle-tested auth, fast to integrate, multi-app SSO.
- ✅ Phone-as-primary with claim-first prevents duplicate driver profiles.
- ⚠️ External dependency for a core capability (acceptable; well-isolated in `packages/auth`).
- ⚠️ Per-seat cost at scale.
