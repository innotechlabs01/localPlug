# Research: Return Date Validation

**Phase 0 output** — All unknowns resolved.

## Decisions

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Validation approach | HTML `min` attribute on `<input type="date">` | Native browser date picker enforces the constraint without custom validation code; works with keyboard/mouse |
| Return date clearing strategy | Clear return date when arrival date moves past it | Simplest correct behavior; avoids stale dates and re-validation complexity |
| Min date fallback | Use existing `getMinDate()` (10-day-ahead) when no arrival date is set | Preserves the advance-notice business rule documented in the flight logistics step |

## Alternatives Considered

- **Custom validation with error message**: Rejected because native `min` attribute is simpler, accessible, and prevents selection entirely
- **Adjust return date automatically**: Rejected because silently changing a user's input is surprising; clearing gives them explicit control

## Integration Notes

- The existing flight validation (n8n-based) is independent — this change only affects the date picker constraint
- The 10-day-ahead `getMinDate()` function remains the global floor for all date fields (arrival, return if no arrival set)
