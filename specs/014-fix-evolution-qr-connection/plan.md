# Implementation Plan: QR Evolution Manager Connection Fix

**Branch**: `014-fix-evolution-qr-connection` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-fix-evolution-qr-connection/spec.md`

## Summary

Diagnose and fix the Evolution API QR code connection failure at `https://api-message.innotechlabssas.lat/manager` so the WhatsApp instance `localplug-main` can reconnect and restore all WhatsApp-based messaging flows (payment confirmations, AI chat, driver notifications, delivery updates).

**Root Cause Identified**: Falta la variable de entorno `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` en el contenedor Docker de Evolution API en EasyPanel. Esta variable es **obligatoria** para Evolution API v2+ en Docker. Sin ella, el QR no se genera correctamente en el Manager UI.

**Fuente**: Video "Evolution API no genera QR - Noviembre 2025" de Pildoras de Programación (https://www.youtube.com/watch?v=gL4nNSnsRbc)

**Current Status**: Instance `localplug-main` está en estado "connecting" — nunca se conectó exitosamente porque el QR no se mostraba.

## Technical Context

**Language/Version**: N/A — this is infrastructure debugging, not new code

**Primary Dependencies**: Evolution API (`atendai/evolution-api:latest`), EasyPanel (container orchestration), PostgreSQL (session DB), Redis (cache), Cloudflare (DNS/SSL/proxy), n8n (workflow/webhook target)

**Storage**: PostgreSQL (`evolution-db`) for WhatsApp session persistence; Redis for temporary data/caching

**Testing**: Manual — verify QR scan → connection status → send test message → receive webhook

**Target Platform**: Docker (EasyPanel), Ubuntu Linux

**Project Type**: Infrastructure diagnosis + repair

**Performance Goals**: WhatsApp connection should remain stable for 24h+ after fix

**Constraints**: QR code expires in ~20 seconds; WebSocket required for real-time QR/connection; Cloudflare proxy may interfere with WebSocket upgrade

**Scale/Scope**: Single instance (`localplug-main`), single WhatsApp phone number

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

## Pre-Design (Phase 0)

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| No feature requires new app code not in spec | Yes — pure infra diagnostics | Same | ✅ PASS |
| No new dependencies introduced | Yes — uses existing stack | Same | ✅ PASS |
| No security/privacy violations | Yes — debugging own infra | Same | ✅ PASS |
| Constitution version compatibility | v1.1.0 — no conflicts | Same | ✅ PASS |

**No violations to justify.** This is an operational task on existing infrastructure.

## Post-Design (Phase 1)

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| No app code changes required | Yes — infra only | Confirmed | ✅ PASS |
| No sensitive data exposed | Yes — all diagnostic data is infrastructure-level | Confirmed | ✅ PASS |
| No WhatsApp numbers logged | Yes — diagnostics use API responses only | Confirmed | ✅ PASS |
| Backward compatible | Yes — no changes to existing services | Confirmed | ✅ PASS |

**Phase 1 findings confirm no constitution violations.** All diagnostics were performed via public API endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/014-fix-evolution-qr-connection/
├── plan.md              # This file
├── research.md          # Phase 0 — diagnostic findings
├── quickstart.md        # Phase 1 — reconnect instructions
├── checklist.md         # Phase 1 — diagnostic checklist
└── tasks.md             # Phase 2 — actionable steps
```

### Source Code (repository root)

No new source code. All changes are infrastructure-level (Evolution API config, n8n webhook config, environment variables).

## Complexity Tracking

No constitution violations.

---

## Phase 0: Research

Diagnostic tasks to identify root cause of QR failure:

1. **Check Evolution API server reachability**
   - Test HTTPS to `https://api-message.innotechlabssas.lat`
   - Test Manager UI: `https://api-message.innotechlabssas.lat/manager`
   - Check SSL certificate validity
   - Verify Cloudflare proxy status

2. **Check backend services**
   - Verify PostgreSQL (`evolution-db`) connectivity and health
   - Verify Redis connectivity and health
   - Check EasyPanel container status (CPU, memory, restarts)

3. **Check instance status via Evolution API**
   - Query instance `localplug-main` connection status
   - Check if instance exists or needs recreation
   - Review instance settings (webhook URL, anti-baneo config)

4. **Check QR/WebSocket functionality**
   - Test WebSocket endpoint for QR generation
   - Verify Cloudflare allows WebSocket connections (proxied mode)
   - Check if port 8080 WebSocket passthrough is configured

5. **Check n8n webhook target**
   - Verify `https://agent-ia.innotechlabssas.lat/webhook/evolution-events` is reachable
   - Check n8n workflow "Evolution Events - AI Agent" is active

## Phase 1: Design

1. Create diagnostic checklist (`checklist.md`)
2. Document reconnect procedure (`quickstart.md`)
3. Update `research.md` with findings and root cause

## Phase 2: Tasks

**Status**: ✅ Root cause identified, fix documented, ready for execution.

### Execution Steps

1. **Add environment variable in EasyPanel** (requires manual action)
   - Go to EasyPanel → evolution-api → Settings → Environment Variables
   - Add: `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510`
   - Restart container

2. **Restart instance via API** (automated)
   ```bash
   curl -X POST "https://api-message.innotechlabssas.lat/instance/restart/localplug-main" \
     -H "apiKey: evo_k1_localplug_2026_secure_key_here"
   ```

3. **Scan QR with WhatsApp** (requires manual action)
   - Open Manager UI
   - Find instance `localplug-main`
   - Click Connect
   - Scan QR with WhatsApp (Linked Devices → Link a Device)

4. **Configure anti-baneo settings** (requires manual action)
   - Apply settings via Manager UI after connection

5. **Verify end-to-end flow** (automated + manual)
   - Test payment → WhatsApp welcome message
   - Reply → appears in Admin IA Chat
   - Admin reply → WhatsApp delivery

6. **Monitor stability for 24h** (automated)
   - Check instance status remains "open"
   - Verify webhook delivery continues working
