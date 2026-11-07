# Research: QR Evolution Manager Connection Fix

## Diagnostic Findings

### 1. Manager UI Reachability ✅
- `https://api-message.innotechlabssas.lat/manager/` → HTTP 200
- React SPA loads correctly (Evolution Manager)
- JS bundle: `/assets/index-CFAZX6IV.js`, CSS: `/assets/index-DNOCacL_.css`
- Manager is operational

### 2. Instance Status: Stuck in "connecting" ❌
```
Instance: localplug-main
ID: e0f3e9e5-dd5d-4e85-939a-94cc2be4b5e2
Status: "connecting"  ← NEVER successfully connected
Number: null
OwnerJid: null
Created: 2026-05-21T13:09:34Z
Last Updated: 2026-05-23T03:09:13Z  ← still trying
```

### 3. QR Generation Working ✅
`POST /instance/restart/localplug-main` returned a valid `base64` PNG QR code. The Evolution API generates QR codes correctly. The instance simply needs to be scanned.

**Root cause identified via video analysis**: Falta la variable de entorno `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` en el contenedor Docker de Evolution API. Esta variable es **obligatoria** para Evolution API v2+ en Docker. Sin ella, el QR no se genera correctamente en el Manager UI.

**Fuente**: Video "Evolution API no genera QR - Noviembre 2025" de Pildoras de Programación (https://www.youtube.com/watch?v=gL4nNSnsRbc)

**Solución**: Agregar `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` como variable de entorno en EasyPanel → evolution-api → Settings → Environment Variables → Reiniciar contenedor.

### 4. Anti-Baneo Settings Not Configured ❌
| Setting | Current | Expected |
|---------|---------|----------|
| `rejectCall` | `false` | `true` |
| `alwaysOnline` | `false` | `true` |
| `readMessages` | `false` | `true` |
| `readStatus` | `false` | `true` |
| `groupsIgnore` | `false` | `true` |
| `syncFullHistory` | `false` | `false` (OK) |

### 5. Direct REST API
- `POST /instance/restart/localplug-main` ✅ — generates new QR
- `GET /instance/fetchInstances` ✅ — lists all instances
- `POST /instance/connect/localplug-main` ❌ — 404 (not the right endpoint)
- `POST /instance/logout/localplug-main` ❌ — 404

### 6. Infrastructure
- SSL valid ✅ (verified with curl)
- Cloudflare proxied ✅ (responds via CF)
- Evolution API container responding ✅
- PostgreSQL/Redis: assumed healthy (instance data is returned, meaning DB is accessible)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| QR fix approach | Agregar variable de entorno `CONFIG_SESSION_PHONE_VERSION` + reiniciar contenedor + reiniciar instancia + escanear QR | Variable obligatoria faltante para Evolution API v2+ en Docker |
| Anti-baneo | Configurar después de conectar | Settings se gestionan en Manager UI → Instance Settings |
| Verificación | Disparar test payment → verificar delivery WhatsApp | Test end-to-end del pipeline completo |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Delete and recreate instance | Menos disruptivo; restart preserva instance ID y webhook config |
| Change API key | No es el problema; API key funciona correctamente |
| Re-deploy Evolution API container | Innecesario; container está saludable y respondiendo |
| Restart instance sin agregar variable | No resuelve el problema raíz; la variable es obligatoria |
