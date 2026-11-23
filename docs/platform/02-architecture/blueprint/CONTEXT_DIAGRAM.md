# CONTEXT_DIAGRAM

The platform in its environment: who/what interacts with it.

```mermaid
graph TD
  subgraph Users
    AD[Admin / Employee]
    DR[Driver]
    CU[Customer]
    VI[Visitor]
  end
  subgraph LocalPlugPlatform["LocalPlug Business Platform"]
    APPS[Applications: admin / driver / customer / landing]
    DOM[Business Domains]
    INF[Shared Infra: api db auth realtime config]
  end
  subgraph External
    CL[Clerk]
    TURSO[(Turso)]
    N8N[n8n]
    EVO[Evolution API / WhatsApp]
    PADDLE[Paddle]
    NOM[Nominatim]
    COOL[Coolify / Hetzner]
  end

  AD --> APPS
  DR --> APPS
  CU --> APPS
  VI --> APPS
  APPS --> DOM
  APPS --> INF
  INF --> TURSO
  INF --> CL
  DOM --> N8N
  N8N --> EVO
  DOM --> PADDLE
  DOM --> NOM
  COOL -. deploys .-> APPS
```

## Context notes
- **Identity** is always Clerk; OTP via WhatsApp (Evolution) is a branded second factor.
- **WhatsApp** is inbound/outbound through n8n + Evolution; it is a *notification* and *chat*
  channel, not a domain itself.
- **Payments** go through Paddle; payouts to drivers are computed by the payments domain.
- **Maps/geocoding** use Nominatim; stateless, owned by the maps domain.
- **Deployment** is Coolify on Hetzner; the realtime server is a persistent container.
