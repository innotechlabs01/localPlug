# Research: Admin UI Alignment

## Overview

Analyze the gap between the project's current admin UI and the HTML reference files from `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/`.

## CSS Variable Audit

The HTML reference defines ~70 CSS custom properties in `admin-shared.css`. The project's `globals.css` already contains these from a previous copy but has ~56KB of admin CSS that may contain duplicates or unused classes. Key variable families:

| Category | Example Variables |
|----------|------------------|
| Background | `--bg`, `--surface`, `--surface-2`, `--card` |
| Text | `--text`, `--text-secondary`, `--text-muted` |
| Accent | `--accent`, `--accent-hover`, `--accent-soft` |
| Status | `--success`, `--warning`, `--danger`, `--info` |
| Border | `--border`, `--border-light` |

## Routing Audit

| Nav Label | Current Route | Reference Route | Fix |
|-----------|--------------|-----------------|-----|
| Fleet | `/admin/logistics` | `/admin/fleet` | Change sidebar + add redirect |
| Payments | `/admin/grid` | `/admin/payments` | Change sidebar + add redirect |
| Employees | `/admin/team` | `/admin/employees` | Change sidebar + add redirect |

## Missing Components Across Pages

### Layout Level
- Date navigation bar (prev/next, Today button, Day/Week/Month/Year toggle)

### By Page
| Page | Missing Elements |
|------|-----------------|
| **Reservations** | 6-column KPI grid with colored status bars, filter pills, res-table-section with table + timeline |
| **Analytics** | SVG line/bar charts with gradients, conversion funnel, top drivers table |
| **Fleet** | Fleet analytics (utilization ring, fuel efficiency, maintenance), vehicle detail modal with health indicators |
| **Drivers** | Driver condition score ring (conic gradient SVG) |
| **Payments** | Revenue grid, Stripe integration card |
| **Promotions** | Referral sources section |
| **Inventory** | Search bar on inventory table |

## Inline Style Audit

Scan of existing pages shows pervasive use of inline hex colors (`#0b0d14`, `#181b25`, `#10b981`, etc.) and JSX `style={}` objects that should be replaced with CSS class references and `var(--*)`.

## Constraints

1. All existing data fetching logic must be preserved
2. Event handlers, state management, and interactivity unchanged
3. No new database tables or API endpoints
4. SVG charts should use inline SVG (not a charting library dependency)
