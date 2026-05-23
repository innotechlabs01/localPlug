# Feature Specification: Return Date Validation

**Feature Branch**: `013-return-date-validation`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "agrega una validacion si el usuario escoge recogida tambien la fecha que sale debe comenzar en la fecha que escogio de llegada asi sabremos cuanto tiempo va a durar el usuario o cuando llega"

## User Scenarios & Testing

### User Story 1 - Return date defaults to arrival date (Priority: P1)

As a user who needs return transportation, I want the return date to start from my arrival date so that I can specify how long I'll be staying.

**Why this priority**: This is the core validation that prevents invalid date ranges in bookings.

**Independent Test**: Can be fully tested by toggling the return checkbox and verifying the return date min constraint changes from the default 10-day-ahead rule to the user's arrival date.

**Acceptance Scenarios**:

1. **Given** the user has filled in an arrival date, **When** they check the "I also need return transportation" checkbox, **Then** the return date field should enforce a minimum date equal to the arrival date.
2. **Given** the user has a return date set that is before the arrival date, **When** the arrival date changes to a later date, **Then** the return date should be cleared or adjusted to be on or after the new arrival date.
3. **Given** the user has not checked the return checkbox, **When** they view the flight logistics step, **Then** the return date field should not appear and no validation for it is needed.

---

### User Story 2 - Booking captures accurate stay duration (Priority: P2)

As a business operator, I want to know the user's stay duration (difference between arrival and return date) so I can plan return pickup logistics accurately.

**Why this priority**: Accurate stay duration improves operational planning but is secondary to the validation itself.

**Independent Test**: Can be tested by submitting a booking with both dates and verifying the data is stored correctly.

**Acceptance Scenarios**:

1. **Given** a booking with both arrival and return dates, **When** the booking is submitted, **Then** the return date stored should be on or after the arrival date.

### Edge Cases

- What happens if the user picks an arrival date, checks return, then changes the arrival date to a later date? The return date min should update dynamically.
- What happens if the user checks return, sets a return date, then unchecks return? The return fields hide and no further validation is needed.
- What happens if arrival date is not yet set and user checks return? The return date field should appear but its min should fall back to the default 10-day-ahead rule until an arrival date is set.

## Requirements

### Functional Requirements

- **FR-001**: When the return checkbox is checked, the return date input MUST set its minimum allowed date to the currently selected arrival date.
- **FR-002**: If the arrival date changes while the return checkbox is checked and the current return date is before the new arrival date, the system MUST either clear the return date or adjust it to match the new arrival date.
- **FR-003**: If no arrival date is set, the return date minimum MUST fall back to the existing 10-day-ahead rule.
- **FR-004**: When the return checkbox is unchecked, the return date fields MUST be hidden and no return date validation enforced.

### Key Entities

- **FlightData**: Contains `arrivalDate`, `returnDate`, and `needReturn` fields. The arrival date constrains the return date when return transportation is requested.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can only select return dates on or after their selected arrival date.
- **SC-002**: If a user changes the arrival date to a date after an already-set return date, the return date is automatically cleared to prevent invalid data.
- **SC-003**: The validation works immediately as the user interacts with the form, with no page reload or server round trip required.

## Assumptions

- The existing booking form architecture (client-side state driven) will handle this validation.
- No server-side validation changes are needed since the database does not enforce date ordering constraints.
- The user already has a valid arrival date set (enforced by step validation) before reaching the return date field.
