# Feature Specification: Flight Validation & User Tracking

**Feature Branch**: `003-flight-validation-tracking`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "Create baseline specification de acuerdo a las validaciones, es decir que la fecha sea 15 dias del dia de hoy y debe estar deshabilitado de acuerdo al tiempo, buscar si existe un endpoint donde pueda validar la existencia de un vuelo o algo para hacerle seguimiento al usuario no importa que el agregue la hora pero para yo hacerle seguimiento"

## User Scenarios & Testing

### User Story 1 - 15-Day Minimum Booking Window Enforcement (Priority: P1)

A traveler books their Medellín arrival but the date selector prevents them from selecting dates within the next 15 days, ensuring compliance with the advance booking policy.

**Why this priority**: Enforcing the minimum booking window is critical for operational readiness — the concierge team needs at least 15 days to coordinate airport pickup, SIM card setup, and accommodation logistics. Without enforcement, bookings could be made that the team cannot fulfill.

**Independent Test**: A user can only select dates that are at least 15 days in the future. All dates within the 15-day window appear disabled/unavailable.

**Acceptance Scenarios**:

1. **Given** the user opens the booking form on May 15, 2026,
   **When** they interact with the arrival date picker,
   **Then** all dates from May 16 through May 29 are disabled and cannot be selected.

2. **Given** the user has manually entered a date less than 15 days in the future,
   **When** they attempt to proceed to the next step,
   **Then** the form shows a validation error and blocks advancement.

3. **Given** a user returns to the booking form on a different calendar day,
   **When** the date picker loads,
   **Then** the disabled range recalculates dynamically based on the current date.

---

### User Story 2 - Flight Data Validation via External Service (Priority: P1)

The system validates the airline and flight number combination entered by the user against an external flight data source, confirming the flight exists and providing basic flight details that serve as a tracking reference.

**Why this priority**: Validating flight data serves dual purposes: it catches typos and incorrect entries before they cause coordination issues, and it provides a reliable reference key to identify and track each booking by flight rather than by name alone.

**Independent Test**: Enter a valid flight number and airline combination — the system confirms the flight exists and displays the airline name. Enter an invalid combination — the system shows a warning but allows the user to proceed with a flagged booking.

**Acceptance Scenarios**:

1. **Given** the user enters a valid airline and flight number combination,
   **When** the system validates the data against the flight source,
   **Then** the system confirms the flight exists and may display the airline name.

2. **Given** the user enters an airline and flight number that do not match any known flight,
   **When** the system attempts validation,
   **Then** the booking is flagged for manual review but the user may still proceed.

3. **Given** the flight data service is temporarily unavailable,
   **When** the user submits the booking,
   **Then** the system proceeds without validation and flags the booking for later review.

---

### User Story 3 - Flight-Based User Tracking (Priority: P2)

The concierge team can look up a booking using the flight number and airline as a reference, enabling them to track the traveler without needing personal identifiers like name or phone number.

**Why this priority**: Flight-based tracking provides a universal reference point that both the traveler and the concierge team can use to coordinate arrivals. The flight number is known before the traveler departs and does not change, regardless of the time the user filled out the form.

**Independent Test**: Given a flight number and airline, the system returns all bookings associated with that flight, showing traveler details and booking status.

**Acceptance Scenarios**:

1. **Given** the concierge team has a flight number and airline,
   **When** they search the system,
   **Then** they can see all bookings matching that flight, along with each traveler's status and contact details.

2. **Given** multiple travelers are on the same flight,
   **When** the concierge searches by flight,
   **Then** all associated bookings are returned in a single result set.

3. **Given** the concierge needs to coordinate airport pickup,
   **When** they reference a booking by flight number,
   **Then** they can see the arrival time and destination address for that booking.

---

### Edge Cases

- What happens when a flight is rescheduled or renumbered after booking? The original flight data is preserved, and the booking is flagged for review.
- How does the system handle flights from airlines not covered by the validation source? The booking is accepted with a warning and flagged for manual review.
- What happens when the calendar crosses midnight? The 15-day window recalculates based on the new date, so a date that was 15 days away yesterday is now 14 days away and becomes disabled.
- How does the system handle users in different time zones? The 15-day calculation uses the booking system's configured timezone, not the user's local timezone.

## Requirements

### Functional Requirements

- **FR-001**: System MUST prevent selection of arrival dates that are less than 15 calendar days from the current date.
- **FR-002**: System MUST visually disable unavailable dates in the date picker, making it clear which dates are selectable.
- **FR-003**: System MUST validate the airline and flight number combination against an external flight data source or internal reference data to confirm the flight exists.
- **FR-004**: System MUST flag bookings with unverified flight data for manual review while still allowing the user to complete the booking.
- **FR-005**: System MUST gracefully handle flight validation service outages by accepting the booking without validation and flagging it for later review.
- **FR-006**: System MUST allow the concierge team to search bookings by flight number and airline, returning all matching records.
- **FR-007**: System MUST recalculate the 15-day window dynamically on each page load based on the current date.
- **FR-008**: System MUST preserve the originally entered flight data even if the flight is later rescheduled or renumbered.

### Key Entities

- **Flight Record**: A validated airline + flight number combination associated with a booking. Contains airline name, flight number, and optionally scheduled arrival time and route. Serves as the primary tracking reference for the concierge team.
- **Validation Source**: An external flight data service or internal reference database that can confirm whether a given airline + flight number pair corresponds to a real scheduled flight.
- **Booking Flag**: A marker on a booking indicating that the flight data could not be validated (either invalid flight, or validation service unavailable). Flagged bookings are reviewed manually by the concierge team.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of bookings have an arrival date at least 15 days in the future — zero bookings slip through with insufficient notice.
- **SC-002**: Flight validation completes within 3 seconds for at least 95% of validation attempts.
- **SC-003**: The concierge team can find any booking by flight number and airline in under 10 seconds.
- **SC-004**: Less than 5% of bookings require manual review due to unverifiable flight data.

## Assumptions

- An external flight data API (such as AviationStack, FlightAware, or similar) will be integrated for flight validation.
- The flight validation service has acceptable uptime (99%+) and response times.
- The 15-day minimum is calculated based on calendar days, not business days.
- Users are booking their own arrival, not someone else's.
- The concierge team has access to an internal dashboard or interface for searching bookings by flight.
- Flight tracking is scoped to commercial airlines only (private/charter flights may not validate against standard flight databases).
