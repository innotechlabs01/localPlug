# Feature Specification: Booking Data Persistence & UI Polish

**Feature Branch**: `002-booking-persistence-mock`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "quiero lo mas limpio mejor UI posible usando context7, y buenas practicas de diseño, en caso de errores maneja fallback de errores para no romper o toast en ciertos casos, usa mock para saber si guardamos los datos o persistir datos"

## User Scenarios & Testing

### User Story 1 - Complete Booking Flow with Data Persistence (Priority: P1)

A traveler fills out the 4-step booking form and all data is saved to a mock/local
persistence layer. If the API is unavailable, the form gracefully degrades without
losing the user's input.

**Why this priority**: The core value of the booking form is collecting and
persisting user data. Without persistence, the form is useless.

**Independent Test**: A user can complete all 4 steps, see a success
confirmation, and verify the submitted data appears in the mock storage.

**Acceptance Scenarios**:

1. **Given** a user fills all 4 booking steps and confirms,
   **When** they submit,
   **Then** their data is persisted to the mock layer and a success
   confirmation is shown.

2. **Given** the API endpoint is unreachable (offline/server error),
   **When** the user submits,
   **Then** the form does not break; a toast notification indicates the
   submission was saved locally, and data is queued for retry.

3. **Given** the user is on step 2 or 3,
   **When** they refresh the page,
   **Then** their previously entered data is restored from local
   persistence.

---

### User Story 2 - Error Handling with Toast Notifications (Priority: P1)

Users receive clear, non-blocking feedback for every action through toast
notifications. Errors never break the page — they show a contextual toast with
a recovery action.

**Why this priority**: Preventing data loss and providing clear feedback
builds user trust, which is essential for a concierge booking service.

**Independent Test**: Trigger a network error during submission and verify a
toast appears with the correct message and dismiss action, while the form stays
interactive.

**Acceptance Scenarios**:

1. **Given** the user submits the form,
   **When** the network request fails,
   **Then** an error toast appears with message "Could not reach server.
   Your data has been saved locally and will be sent when connection
   resumes." and a "Dismiss" button.

2. **Given** the booking is confirmed successfully,
   **When** the API returns success,
   **Then** a success toast appears briefly before navigating to the
   confirmation screen.

3. **Given** the user enters an invalid date (less than 15 days ahead),
   **When** they try to proceed to step 2,
   **Then** a warning toast appears with the 15-day notice and they cannot
   advance until corrected.

---

### User Story 3 - Clean UI & Responsive Polish (Priority: P2)

The booking form interface is visually polished, responsive across mobile and
desktop, and follows accessible design patterns.

**Why this priority**: A premium concierge service demands a premium
user interface. This differentiates the brand.

**Independent Test**: Visually verify the form at 390px, 768px, and 1280px
viewports — all elements are properly sized, touch targets are 44px minimum,
and no content overflows.

**Acceptance Scenarios**:

1. **Given** the user opens the booking page on a mobile device (390px),
   **When** they view any step,
   **Then** all form inputs are full-width, buttons are 44px minimum,
   text is 16px minimum, and there is no horizontal scroll.

2. **Given** the user tabs through the form fields,
   **When** each field receives focus,
   **Then** a visible focus ring (Emerald glow, 2px offset) appears around
   the active field.

3. **Given** the user submits on mobile,
   **When** the success screen loads,
   **Then** the WhatsApp next-steps callout is easy to read and tap.

---

### Edge Cases

- What happens when the user closes the browser mid-booking? Data should be
  restored from local persistence on return.
- How does the system handle concurrent submissions? Submissions are queued
  and processed one at a time.
- What happens if local storage is full? The system degrades gracefully with
  a toast warning and still allows form completion without saving.
- What happens on step navigation (back/forward)? Form data for all steps is
  preserved in local state and local persistence.

## Requirements

### Functional Requirements

- **FR-001**: System MUST persist booking form data to a mock/local storage
  layer on each step transition and on final submission.
- **FR-002**: System MUST restore previously saved booking data when the user
  returns to the booking page (page refresh or revisit).
- **FR-003**: System MUST show a toast notification for every submission
  attempt (success, error, offline).
- **FR-004**: System MUST queue failed submissions locally and retry when
  connectivity is restored.
- **FR-005**: System MUST NOT lose user data if the API call fails — data is
  saved locally before the network request.
- **FR-006**: System MUST use a mock data layer that mimics an async API
  (simulated latency, configurable success/failure) for development and
  testing.
- **FR-007**: System MUST provide a fallback UI state for each step that
  gracefully handles missing or invalid data without crashing.
- **FR-008**: System MUST maintain 44px minimum touch targets on all
  interactive elements.
- **FR-009**: System MUST show visible focus indicators (Emerald glow, 2px
  offset) on all form inputs and buttons.
- **FR-010**: System MUST log all booking submissions (success and failure)
  to the browser console for debugging.

### Key Entities

- **Booking**: A complete booking record containing flight details, traveler
  profile, destination data, and selected VIP package. Status: draft, submitted,
  confirmed, failed.
- **Toast Notification**: A transient UI element displaying a message with
  a type (success, error, warning, info) and optional action button. Auto-dismiss
  after 5 seconds for success/info, requires manual dismiss for errors.
- **Persistence Queue**: An ordered list of pending submissions stored in
  local persistence. Each entry has the full booking payload, timestamp, and
  retry count (max 3 retries).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete all 4 booking steps in under 4 minutes,
  including data entry and confirmation.
- **SC-002**: 100% of form submissions (including failed network requests)
  result in data being persisted either remotely or locally — zero data loss.
- **SC-003**: Toast notifications appear within 200ms of the triggering event
  and are dismissible within one tap.
- **SC-004**: The booking form achieves Lighthouse scores of 90+ on
  Performance, Accessibility, and Best Practices.
- **SC-005**: The form renders without layout shifts on 390px, 768px, and
  1280px viewports.

## Assumptions

- Users have JavaScript enabled (form is a client-side React component).
- Local storage API (localStorage or IndexedDB) is available for local
  persistence.
- The mock persistence layer can be toggled to simulate API failures for
  testing error paths.
- Users are booking for themselves (no multi-guest booking in v1).
- Mobile-first responsive design: 390px/768px/1280px breakpoints.
- The booking form is a single-page application (no full-page reloads during
  the flow).
