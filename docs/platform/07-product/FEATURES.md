# Features

Breakdown of the highest-priority Epics into Features. Each Feature is later split into
Stories (`USER_STORIES.md`) and Tasks. Driver Portal (Epic 2) is defined as a **product**,
not a list of screens.

## Epic 2 — Driver Portal (product modules)

| Module | Covers |
|---|---|
| Authentication | Phone login, OTP via WhatsApp, session |
| Registration | Self-registration flow |
| Claim Account | Claim existing profile by phone (priority over register) |
| Availability | Toggle available/offline/busy |
| Assignments | Receive, accept, reject, expire |
| Trip | heading → pickup → onboard → complete → cancel |
| Schedule | Upcoming/past trips |
| Earnings | Summary + history + payout status |
| Dashboard | Operational home |
| Notifications | In-app + push + WhatsApp |
| Settings | Profile, documents, preferences |
| Support | Help, contact, escalation |

Each module is specified with: **UX · API · WebSocket · States · Events · DB · Validations · Edge cases · Permissions · Metrics**.

## Epic 1 — Platform Foundation (Features)
- Monorepo packages (`db`, `auth`, `api`, `realtime`, `types`, `validation`, `domains/*`)
- CI quality gates (lint, typecheck, test)
- Constitution enforcement in review

## Other Epics
Features for Epics 3–10 are defined after the Platform Audit confirms current state.
See `PRODUCT_BACKLOG.md` and `SPRINTS.md`.
