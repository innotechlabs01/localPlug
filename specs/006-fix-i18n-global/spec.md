# Feature Specification: Fix Global i18n Coverage

**Feature Branch**: `006-fix-i18n-global`

**Created**: 2026-05-16

**Status**: Draft

**Input**: User description: "El i18n funciona solo en el header pero en toda la pagina no funciona, revisa porque no modifica el texto al cambiar de idioma debe ser completo en toda la pagina incluyendo las que no se usan"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Language Switcher Affects Entire Page (Priority: P1)

As a bilingual user, when I toggle the language in the header, ALL visible text on the page — including footer, hero, concierge, how-it-works, about, testimonials, CTA, and booking sections — must update to the selected language simultaneously.

**Why this priority**: This is the core bug. The current implementation creates isolated language state per component, so toggling language only affects the section where the toggle is located. This defeats the purpose of having a language switcher.

**Independent Test**: Toggle the language switcher in the header and verify that every section on the landing page updates its text to the selected language in real time.

**Acceptance Scenarios**:

1. **Given** the page is loaded in English, **When** the user clicks the language toggle to switch to Spanish, **Then** all text across every section (header, hero, concierge, how-it-works, about, testimonials, CTA, footer) updates to Spanish simultaneously.
2. **Given** the page is loaded in Spanish, **When** the user clicks the language toggle to switch to English, **Then** all text across every section updates to English simultaneously.
3. **Given** the user has selected Spanish, **When** the user navigates to the booking page, **Then** the booking form and all its steps display in Spanish.
4. **Given** the user has selected Spanish, **When** the user navigates to any admin page, **Then** all admin navigation, dashboard labels, and page content display in Spanish.

---

### User Story 2 - Language Preference Persists Across Navigation (Priority: P2)

As a bilingual user, my selected language preference must persist when I navigate between pages (landing page, booking page, admin pages) and survive page reloads.

**Why this priority**: Without persistence, users must re-select their language on every page load, creating a frustrating experience.

**Independent Test**: Select Spanish, navigate to booking page, reload the browser, and verify Spanish is still active.

**Acceptance Scenarios**:

1. **Given** the user has selected Spanish on the landing page, **When** the user navigates to the booking page, **Then** the booking page displays in Spanish without requiring re-selection.
2. **Given** the user has selected Spanish, **When** the user reloads the page, **Then** the page loads in Spanish.
3. **Given** the user has selected Spanish, **When** the user navigates to an admin page, **Then** the admin page displays in Spanish.

---

### User Story 3 - All Placeholder Pages Display Translated Text (Priority: P3)

As a bilingual user, even placeholder/"Coming Soon" admin pages (IA Chat, Intelligence, Logistics, Grid Ops, Dispatch) must display translated text when I switch languages.

**Why this priority**: These pages already have translation keys defined but the components don't use them. This is a completeness issue.

**Independent Test**: Navigate to each admin placeholder page, toggle language, and verify all text updates.

**Acceptance Scenarios**:

1. **Given** the user is on the IA Chat placeholder page in English, **When** the user switches to Spanish, **Then** the page title, description, and "Coming Soon" text all display in Spanish.
2. **Given** the user is on any admin placeholder page, **When** the user switches language, **Then** all visible text on that page updates to the selected language.

---

### User Story 4 - HTML Language Attribute Updates Dynamically (Priority: P3)

As a user, the browser's `<html lang>` attribute must reflect the currently selected language for accessibility and SEO purposes.

**Why this priority**: Correct lang attributes help screen readers and search engines serve the right content.

**Independent Test**: Inspect the `<html>` element's `lang` attribute after toggling language and verify it updates.

**Acceptance Scenarios**:

1. **Given** the page loads with `lang="en"`, **When** the user switches to Spanish, **Then** the `<html lang>` attribute changes to `"es"`.
2. **Given** the page has `lang="es"`, **When** the user switches to English, **Then** the `<html lang>` attribute changes to `"en"`.

---

### Edge Cases

- What happens when a user visits a page directly (deep link) without having a saved language preference? The system defaults to English.
- What happens when a translation key is missing for a component? The system falls back to English text for that key.
- What happens when localStorage is disabled or unavailable? The system defaults to English and still allows toggling within the session.
- What happens when the user switches language while a booking form has partial data entered? Form field labels update, but user-entered data is preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single shared language state that is accessible by all components across the application without each component creating its own independent provider.
- **FR-002**: System MUST persist the selected language preference in localStorage (or equivalent browser storage) so it survives page reloads and navigation.
- **FR-003**: System MUST update the `<html lang>` attribute dynamically whenever the user switches language.
- **FR-004**: System MUST apply the selected language to all translatable text on every page — landing page sections, booking flow steps, admin pages, error pages, and placeholder pages.
- **FR-005**: System MUST use existing translation keys from `lib/i18n/locales/en.ts` and `lib/i18n/locales/es.ts` for components that already have keys defined but are not using them.
- **FR-006**: System MUST add new translation keys for hardcoded strings that currently have no corresponding entries in the translation files, including but not limited to: booking confirmation text, step progress labels, trip/experience names (with localized English variants), error pages, and loading states.
- **FR-007**: System MUST default to English when no saved preference exists or when a translation key is missing.
- **FR-008**: System MUST preserve user-entered form data when the language is switched mid-form.
- **FR-009**: Admin sidebar navigation labels MUST use translation keys instead of hardcoded English strings.
- **FR-010**: Error boundary, 404, and loading components MUST use translation keys for all displayed text.

### Key Entities

- **Language Preference**: The user's selected language (`en` or `es`), stored in browser localStorage and shared via a single React context at the application root.
- **Translation Keys**: Structured key-value pairs organized by section (nav, hero, booking, admin, etc.) in `en.ts` and `es.ts` files, defining all translatable strings.
- **I18n Provider**: A React context component that manages language state and provides translation functions to the entire component tree.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toggling the language switcher updates 100% of visible translatable text on the landing page within a single interaction (no partial updates).
- **SC-002**: Language preference persists across at least 10 page navigations and page reloads without requiring re-selection.
- **SC-003**: All admin pages (dashboard, orders, agenda, team, and all placeholder pages) display fully translated content when language is toggled.
- **SC-004**: The `<html lang>` attribute accurately reflects the current language at all times.
- **SC-005**: Zero hardcoded English strings remain in any component that displays user-facing text (all text must come from translation files).
- **SC-006**: Language switching on booking pages does not cause loss of user-entered form data.

## Assumptions

- The existing translation files (`en.ts` and `es.ts`) contain sufficient keys for all sections that need translation; new keys will be added only for hardcoded strings that have no existing entries.
- The application uses React with a context-based state management approach.
- Two languages are supported: English (`en`) and Spanish (`es`). Adding more languages in the future should be architecturally possible but is out of scope for this fix.
- The current custom i18n system (React Context-based) will be retained rather than migrating to a third-party library, since the existing infrastructure is sound — the issue is architectural (isolated providers) not library-related.
- Browser localStorage is available for persisting language preference.
- The admin layout sidebar and all admin sub-pages share the same translation key structure already defined in the `admin` section of the translation files.
- All user-facing text must change when language is toggled, including trip/experience names (e.g., "Guatapé / El Peñol" in Spanish becomes a localized English variant). Proper nouns are not exempt from translation.

## Clarifications

### Session 2026-05-16

- Q: How should trip names like "Guatapé / El Peñol" appear when language is set to English? → A: All text must change, including trip names — localized English variants required (not kept as-is).
