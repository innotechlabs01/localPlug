# User Stories

Template and initial stories for the Driver Portal (Epic 2). Replace placeholders after
the Platform Audit. Format: `As a <role>, I want <capability>, so that <value>`.

## Authentication
- As a driver, I want to log in with my phone, so that I can access my account securely.
- As a driver, I want to receive an OTP via WhatsApp, so that I don't need email.

## Registration & Claim
- As a new driver, I want to register, so that I can join the platform.
- As an existing driver, I want to claim my profile by phone, so that I avoid duplicates.

## Availability
- As a driver, I want to toggle availability, so that I only receive assignments when ready.

## Assignments
- As a driver, I want to receive assignments with a timer, so that I can accept quickly.
- As a driver, I want to reject an assignment, so that it goes to another driver.

## Trip
- As a driver, I want to track trip status, so that dispatch and the customer see progress.

## Earnings
- As a driver, I want to see my earnings, so that I understand my pay.

## Notifications
- As a driver, I want notifications for assignments, so that I never miss a job.

## Stories → Tasks
Each Story is broken into Tasks during Sprint planning (`SPRINTS.md`). Every Task must
reference the responsible domain (`01-business/`), events (`../02-architecture/event-driven.md`),
and state machine (`07-state-machines/`).
