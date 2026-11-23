# BUSINESS_CAPABILITY_MAP (Real — Digital Twin)

> Enterprise-architecture view: what business capabilities LocalPlug provides **today**, mapped
> to the real modules that implement them. This is the capability tree the Blueprint's domains
> must each own. No code changes. Derived from `MODULES/*.md` + `OWNERSHIP_MATRIX.md`.

```
LocalPlug (Business Platform)
│
├── Booking
│   ├── Create booking            → app/api/booking + lib/services/booking-service
│   ├── Flight validation         → app/api/flights/validate
│   ├── Search                     → app/api/bookings/search
│   ├── Pricing / quote           → lib/pricing.ts (+ lib/trm.ts FX)
│   └── Promotion apply           → lib/pricing.ts + app/api/promotions/validate
│
├── Dispatch
│   ├── Availability              → lib/dispatch/availability.ts
│   ├── Create assignment         → app/api/admin/dispatch + lib/dispatch
│   ├── Accept / decline          → app/api/assignments/[id]/{accept,decline}
│   └── Driver assignment         → app/api/admin/reservations/[id]/assign-driver
│
├── Driver Operations
│   ├── Onboarding / documents    → app/api/admin/drivers/* + lib/admin/auth
│   ├── Ranking / performance     → app/api/admin/drivers/[id]/{ranking,performance,history}
│   ├── Availability toggle       → lib/dispatch/availability.ts
│   └── Vehicles (embedded)       → drivers.vehicle / plate columns  ❌ not a module yet
│
├── Fleet  (→ Vehicles domain, future)
│   └── Vehicle record            → embedded in drivers  ❌ extract in 2C
│
├── Customers
│   ├── Customer record           → app/api/admin/customers + customers table
│   └── Customer lookup           → app/api/admin/customers
│
├── Payments
│   ├── Create intent             → app/api/payments/create-intent + lib/paddle
│   ├── Confirm / webhook         → app/api/webhooks/paddle + lib/paddle
│   ├── Split                     → lib/paddle (orders_new split cols)
│   └── Refund                    → app/api/admin/payments/refund
│
├── Notifications
│   ├── WhatsApp outbound         → lib/services/whatsapp-service + lib/n8n/client
│   ├── WhatsApp inbound          → app/api/webhooks/evolution → lib/queue
│   └── Outbox                    → outgoing_messages table
│
├── Chat
│   ├── Sessions / messages       → lib/services/chat-service + app/api/chat/*
│   ├── Agents                    → lib/services/agent-service
│   └── Moderation                → lib/moderation/comment-filter
│
├── AI
│   ├── AI reply                  → lib/services/ollama-service + app/api/chat/ai-response
│   └── Escalation → case         → app/api/chat/escalate → n8n
│
├── Analytics
│   └── Dashboards / reports      → app/api/admin/analytics + app/admin/analytics
│
├── Cases
│   ├── Case mgmt                 → app/api/admin/cases/*
│   └── Case events / tasks       → case_events / case_tasks tables
│
├── Hotels (Supply)
│   ├── Hotels / rooms            → app/api/admin/hotels, rooms + lib/admin/hotel-auth
│   └── Promotions                → app/api/admin/promotions + promotions table
│
├── Ratings
│   └── Submit / stats            → lib/services/rating-service + app/api/ratings
│
├── Maps
│   └── Geocode                   → app/api/geocode
│
├── Realtime  (today: polling)
│   └── Live refresh              → use-polling.ts + realtime-context.tsx + cron/process-queue
│
├── Auth & Access
│   ├── RBAC / permissions        → lib/admin/permissions + modules/role_permissions
│   ├── Team / employees / roles  → app/api/admin/{team,employees,roles,modules}
│   ├── Clerk sync                → app/api/webhooks/clerk
│   └── Webhook auth              → lib/webhook-auth
│
└── Settings & Config
    ├── Runtime settings          → settings table + app/api/admin/settings
    └── Env config                → lib/config.ts  ⚠️ dual source with settings
```

## Reading it
- Each leaf maps to a **real** file/module — this is verifiable, not aspirational.
- Capabilities with `❌` (Vehicles, Fleet, Trip state) have **no first-class owner today**; the
  Blueprint creates `domains/vehicles` and `domains/trips` to own them.
- `Settings & Config` is the one capability with a **dual source** (env + DB) — resolve before 2C
  (see `SOURCE_OF_TRUTH_MATRIX.md`).
- This tree is the parent of `INTERACTION_MATRIX.md` (capability ↔ capability links) and
  `OWNERSHIP_MATRIX.md` (capability → owner file).
