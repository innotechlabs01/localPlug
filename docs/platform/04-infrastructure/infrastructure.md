# Operations — Infrastructure

## Components
| Component | Technology | Purpose |
|---|---|---|
| Compute | Hetzner Cloud | app hosting |
| Orchestration | Docker + Coolify | container management |
| Database | Turso (libSQL) | edge database |
| Auth | Clerk | identity management |
| WhatsApp | Evolution API | business messaging |
| Workflow | n8n | automation engine |
| CDN | Vercel (landing) | static assets |

## Environment management
```
.env.local        # local dev (not committed)
.env.development
.env.staging
.env.production
```

## Principles
- Persistent processes for WebSocket servers (not serverless).
- Stateless apps scale horizontally; state in Redis/DB.
- Secrets in env vars, injected by Coolify, never in code or images.
