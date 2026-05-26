# Quickstart: Admin UI Alignment

## Setup

```bash
git checkout 016-admin-ui-alignment
pnpm install
pnpm dev
```

## Reference Files

The HTML reference files are at:
```
/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/
```

Open the relevant HTML file for the page you're working on to see the target design.

## Key Principles

1. **Use CSS variables**: Replace `#0b0d14` → `var(--bg)`, `#10b981` → `var(--accent)`, etc.
2. **Use CSS classes**: Replace `style={{}}` with `.card`, `.badge`, `.btn`, `.input` classes from globals.css
3. **Preserve logic**: Don't touch data fetching, state management, event handlers
4. **No new dependencies**: Use inline SVG for charts, not charting libraries
5. **Verify against HTML**: Open the reference HTML in a browser to check visual fidelity

## Verification Checklist

- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — no lint errors
- [ ] Each page visually matches its HTML reference
