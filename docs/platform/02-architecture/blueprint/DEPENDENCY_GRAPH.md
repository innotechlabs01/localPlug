# DEPENDENCY_GRAPH

Allowed dependency directions after the refactor. Solid arrows = allowed compile/runtime
dependency. Dashed = event subscription (async, no compile dependency).

```mermaid
graph TD
  subgraph apps["Applications (interfaces)"]
    A[apps/admin]
    D[apps/driver]
    C[apps/customer]
    L[apps/landing]
  end
  subgraph domains["packages/domains/*"]
    B[booking] Dsp[dispatch] Dr[drivers] T[trips] V[vehicles]
    Cu[customers] P[payments] N[notifications] Ch[chat] AI[ai]
    An[analytics] S[settings] Cs[cases] H[hotels] R[ratings] M[moderation] MP[maps]
  end
  subgraph infra["Cross-cutting packages"]
    API[packages/api] DB[packages/db] AUTH[packages/auth]
    RT[packages/realtime] CFG[packages/config] SH[packages/shared] UI[packages/ui]
  end

  A --> API
  D --> API
  C --> API
  L --> API
  API --> domains
  domains --> DB
  domains --> SH
  domains --> CFG
  domains -. emit/subscribe .-> RT
  RT -. broadcast .-> apps
  AUTH --> SH
  API --> AUTH
  UI --> SH
  apps --> UI

  classDef noborder fill:#fff,stroke:#ccc;
```

## Rules (enforced by lint in Epic 4)
1. `apps/*` → `packages/*` + `packages/domains/*` (never the reverse).
2. `packages/domains/*` → `db`, `shared`, `config`, `realtime` (emit) only.
3. `packages/domains/*` → **another domain only via events**, never via direct import
   (except `analytics` which is read-only and may read published read models).
4. `packages/api` may orchestrate any domain but holds no business logic itself.
5. `packages/realtime` holds **no** business logic; it is a pure transport + outbox.
6. `packages/*` never import `apps/*`.

Violations of 1, 2, 5, 6 are hard errors; violations of 3 are flagged for event extraction.
