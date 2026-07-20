# Architecture — Deployment

## Stack
| Component | Technology | Purpose |
|---|---|---|
| Compute | Hetzner Cloud | app hosting |
| Orchestration | Docker + Coolify | container management |
| Database | Turso (libSQL) | edge database |
| Auth | Clerk | identity |
| WhatsApp | Evolution API | business messaging |
| Workflow | n8n | automation |
| CDN | Vercel (landing) | static assets |

## Pipeline
```
Code Push → CI Build → Tests Pass → Docker Build → Deploy → Health Check
```

## Environment promotion
```
Local → Development → Staging → Production
```

## Rules
1. No direct deploys to production.
2. All changes through CI/CD.
3. DB migrations run before app deployment.
4. Rollback capability required.
5. Health checks must pass before traffic routing.

## Zero-downtime
1. Build new version alongside old.
2. Run backward-compatible migrations.
3. Start new version; health check.
4. Route traffic; shut down old.

See `04-operations/` for infra, docker, coolify, monitoring, backup, observability.
