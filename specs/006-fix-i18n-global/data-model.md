# Data Model: Fix Global i18n Coverage

**Feature**: 006-fix-i18n-global
**Date**: 2026-05-16

## Entities

### LanguagePreference

Represents the user's selected language, persisted in browser storage.

| Field | Type | Description |
|-------|------|-------------|
| lang | `'en' \| 'es'` | Current language code |
| updatedAt | `number` | Timestamp of last change (optional, for future conflict resolution) |

**Storage**: `localStorage` key `localplug-lang`
**Default**: `'en'` (when no saved preference exists)

**State Transitions**:
```
[init] → 'en' (default)
'en' ↔ 'es' (via toggleLang)
```

### TranslationNamespace

Structured key-value pairs defining all translatable strings. Organized by section.

| Namespace | Description | Example Keys |
|-----------|-------------|--------------|
| `common` | Shared UI strings | `back`, `continue`, `error`, `loading` |
| `nav` | Navigation labels | `home`, `booking`, `services` |
| `hero` | Hero section | `title`, `subtitle`, `planNow` |
| `concierge` | Concierge section | `title`, `subtitle`, `items[]` |
| `howItWorks` | How it works | `title`, `steps[]` |
| `about` | About section | `title`, `features[]` |
| `testimonials` | Testimonials | `title`, `items[]` |
| `cta` | Call to action | `title`, `button` |
| `booking` | Booking flow | `steps.flight.*`, `confirmation.*` |
| `footer` | Footer | `copyright`, `quickLinks` |
| `admin` | Admin dashboard | `nav.*`, `dashboard.*`, `placeholders.*` |
| `errors` | Error pages (NEW) | `title`, `message`, `tryAgain` |
| `notFound` | 404 page (NEW) | `title`, `message`, `backHome` |
| `loading` | Loading state (NEW) | `text` |
| `stepProgress` | Booking progress (NEW) | `labels.*`, `complete` |

### TranslationFile

The TypeScript translation files that define the shape of TranslationNamespace.

| File | Language | Path |
|------|----------|------|
| English | `en` | `lib/i18n/locales/en.ts` |
| Spanish | `es` | `lib/i18n/locales/es.ts` |

**Constraint**: Both files must have identical key structure. TypeScript enforces this via `typeof en` type annotation on the `t` object.

## Relationships

```
LanguagePreference (1) ─── owns ───→ (1) TranslationNamespace
                                         ↓ selected via
                                    TranslationFile (en | es)
```

- One `LanguagePreference` per user (browser session)
- One active `TranslationNamespace` at a time (selected by language code)
- Two `TranslationFile` instances exist (en.ts, es.ts)

## Validation Rules

- Language code MUST be one of: `'en'`, `'es'`
- All translation keys in `en.ts` MUST also exist in `es.ts` (and vice versa)
- No empty string values allowed in translation files (fall back to English key if missing)
- `localStorage` write MUST be wrapped in try/catch (quota exceeded, disabled storage)

## Key Differences from Current State

| Aspect | Current | After Fix |
|--------|---------|-----------|
| Provider instances | 8+ (per component) | 1 (root layout) |
| State persistence | None (resets on reload) | localStorage |
| `html lang` | Static `"en"` | Dynamic, synced with state |
| Translation coverage | ~60% of components | 100% of user-facing text |
