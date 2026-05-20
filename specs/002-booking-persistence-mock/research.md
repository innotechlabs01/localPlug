# Research: Booking Data Persistence & UI Polish

**Date**: 2026-05-15

## Decisions

### Toast Notification Strategy

| Aspect | Decision |
|--------|----------|
| **Pattern** | React Context + reducer pattern for global toast state |
| **Placement** | Fixed bottom-right on desktop, bottom-center on mobile |
| **Auto-dismiss** | Success/info: 5s; Warning: 8s; Error: manual dismiss only |
| **Animation** | CSS `translate` + `opacity` transitions (200ms enter, 300ms exit) |
| **Z-index** | `z-50` (above header) |
| **Max visible** | 3 concurrent toasts; overflow queued |

**Rationale**: No external toast library needed. A lightweight context-based
approach (under 1KB gzipped) keeps the bundle small and avoids dependency risk.
The auto-dismiss times follow UX research showing 4-6 seconds for non-critical
messages and manual dismiss for errors that require user attention.

**Alternatives considered**: react-hot-toast, Sonner — rejected to keep zero
external runtime dependencies.

### Persistence Layer Strategy

| Aspect | Decision |
|--------|----------|
| **Storage** | `localStorage` with JSON serialization |
| **Wrapper** | Async API that mimics `fetch` (configurable latency 100-500ms) |
| **Failure simulation** | Toggle via `localStorage.setItem('__mock_fail', 'true')` |
| **Queue** | Separate `localStorage` key with max 10 entries, LRU eviction |
| **Restoration** | On mount, read from `localStorage` and pre-fill form state |
| **Error fallback** | If `localStorage` is full or unavailable, catch silently and continue (no persistence) |

**Rationale**: localStorage is available in all modern browsers, requires no
server infrastructure for the mock layer, and can be inspected in DevTools
for debugging. The async wrapper mimics realistic API latency for development.

**Alternatives considered**: IndexedDB — more powerful but overkill for this
use case; simpler API keeps the mock layer easy to understand and test.

### Error Boundary Strategy

| Aspect | Decision |
|--------|----------|
| **Component level** | ErrorBoundary wrapper around the entire booking form |
| **Fallback UI** | Inline message with "Try Again" button, not a full page crash |
| **Step-level** | Each step is wrapped in a try/catch in the parent; if a step render fails, show inline error and allow going back |
| **Network errors** | Caught in submit handler → toast + queue for retry |

**Rationale**: The spec requires "never break the page." A soft error boundary
at the form level ensures the header/navigation remain interactive even if
the form crashes.

## Best Practices

### Form State Management

- Keep form state in a single `useReducer` or multiple `useState` calls grouped
  by concern — no external form library needed for 4 steps
- Persist to localStorage on every `setState` call (debounced at 300ms to avoid
  excessive writes)
- Validate step data before allowing "Continue" — inline validation per field,
  blocking validation at step boundary
- Restore from localStorage on mount; if data is stale (>24h), prompt user to
  restart

### Accessibility Patterns

- Toast notifications should use `role="alert"` and `aria-live="polite"`
- Toast dismiss buttons need `aria-label="Dismiss notification"`
- Progress bar needs `role="progressbar"` with `aria-valuenow`
- Step indicators need `aria-current="step"` on the active step

### Testing Patterns

- Persistence queue: test enqueue, dequeue, max retries, LRU eviction
- Toast system: test show, auto-dismiss, manual dismiss, max concurrent
- Booking form: test step navigation with persistence, restoration on mount,
  error boundary fallback, offline submission queue
