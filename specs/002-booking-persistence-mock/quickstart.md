# Quickstart: Booking Persistence & UI Polish

## What this feature adds

1. **Mock persistence layer** — saves booking drafts to localStorage on each
   step; restores on page refresh; queues failed submissions for retry
2. **Toast notification system** — non-blocking feedback for success, error,
   warning, and info events
3. **Error boundary** — wraps the booking form so a crash never breaks the page
4. **Responsive/accessibility polish** — 44px touch targets, focus rings,
   ARIA attributes

## Key files

| File | Purpose |
|------|---------|
| `app/components/booking/lib/persistence.ts` | Async mock persistence with localStorage |
| `app/components/booking/lib/toast.tsx` | Toast context, provider, and component |
| `app/components/booking/booking-form.tsx` | Updated with persistence + toast + error boundary |

## Testing

```bash
pnpm test          # Vitest component tests
pnpm test:watch    # Watch mode
```

## Development

To simulate API failures during development:

```js
localStorage.setItem('__mock_fail', 'true')
```

To clear all persisted data:

```js
localStorage.removeItem('booking_draft')
localStorage.removeItem('booking_queue')
```

## Design tokens used

- Colors: Slate Navy, Mountain Emerald, Golden Sol, Cool Slate
- Typography: Plus Jakarta Sans (headlines), Inter (body)
- Spacing: 8px base, 16px/24px/32px stacks
- Radii: 8px default, rounded-lg for cards
- Shadows: Level 1 (cards), Level 2 (hover)
