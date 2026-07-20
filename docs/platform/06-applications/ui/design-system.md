# UI — Design System

## Design Tokens
```css
/* Color */
--color-primary: #fbbf24;        /* Gold — brand accent */
--color-primary-hover: #f59e0b;
--color-success: #22c55e;
--color-danger: #ef4444;
--color-warning: #f97316;
--color-info: #60a5fa;

/* Background (dark theme) */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-tertiary: #334155;

/* Text */
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-tertiary: #64748b;

/* Typography */
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-display: 'Playfair Display', serif;

/* Spacing */
--space-unit: 4px;
--touch-target: 44px;

/* Radius */
--radius-sm: 8px;  --radius-md: 12px;
--radius-lg: 16px; --radius-xl: 20px;
```

## Component Standards
| Component | Touch Target | States |
|---|---|---|
| Button | 44px | default, hover, active, disabled, loading |
| Input | 44px | default, focus, error, disabled |
| Card | N/A | default, selected, disabled |
| Toggle | 44×24px | on, off, disabled |

## Responsive
| Breakpoint | Width | Target |
|---|---|---|
| Mobile | 375px+ | Primary (Driver Portal) |
| Tablet | 768px+ | Secondary |
| Desktop | 1024px+ | Admin Portal |

## PWA Requirements
Installable (Android/iOS), full-screen, splash screen, offline indicator, smooth
transitions, haptic feedback on critical actions.

See `../05-decisions/ADR-005-pwa.md` and `ux-flows.md`.
