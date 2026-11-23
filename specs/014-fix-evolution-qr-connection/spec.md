# Feature Specification: QR Evolution Manager Connection Fix

**Feature Branch**: `014-fix-evolution-qr-connection`

**Created**: 2026-05-22

**Status**: Complete

**Input**: User description: "El QR de evolution manager no funciona y no sincronizo con mi celular o whatsapp porque no sincronizo"

**Root Cause Identified**: Falta la variable de entorno `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` en el contenedor Docker de Evolution API en EasyPanel. Sin esta variable, el QR no se genera correctamente en contenedores Docker (fuente: video "Evolution API no genera QR - Noviembre 2025" de Pildoras de Programación).

**Current Instance Status**: `localplug-main` está en estado "connecting" — nunca se conectó exitosamente porque el QR no se mostraba.

## User Scenarios & Testing

### User Story 1 - Admin reconnects WhatsApp via Evolution Manager (Priority: P1)

As an admin, I want to connect my WhatsApp account to the Evolution API so that the system can send and receive WhatsApp messages for customer communication.

**Why this priority**: Without a working WhatsApp connection, all WhatsApp-based features are non-functional: payment confirmations, AI chat, driver notifications, and delivery updates. This is a blocking issue.

**Independent Test**: Can be fully tested by opening Evolution Manager, scanning the QR code with WhatsApp, and verifying the instance status shows "connected".

**Acceptance Scenarios**:

1. **Given** the Evolution API is running, **When** an admin opens the Manager at `https://api-message.innotechlabssas.lat/manager`, **Then** the login page loads without errors
2. **Given** the admin is logged into Evolution Manager, **When** they view the instance `localplug-main`, **Then** they can see the current connection status
3. **Given** the instance is disconnected, **When** the admin clicks "Connect", **Then** a scannable QR code is displayed
4. **Given** a QR code is displayed, **When** the admin scans it with WhatsApp on their phone (Linked Devices → Link a Device), **Then** the instance status changes to "open" (connected)
5. **Given** the instance is connected, **When** the admin sends a test message via the API, **Then** the message is delivered successfully

---

### User Story 2 - Diagnose why QR is not working (Priority: P1)

As a developer, I want to identify the root cause of the QR connection failure so that the connection can be restored.

**Why this priority**: The QR connection is the only way to link WhatsApp. If it fails, the entire WhatsApp integration is blocked. Root cause must be found to apply the right fix.

**Independent Test**: Can be tested by checking server logs, API responses, and infrastructure status.

**Acceptance Scenarios**:

1. **Given** the Evolution API endpoint `https://api-message.innotechlabssas.lat`, **When** checking the `/manager` page, **Then** the response is analyzed for HTTP errors, SSL issues, or Cloudflare proxy problems
2. **Given** access to the Evolution API container logs, **When** inspecting recent logs, **Then** errors related to QR generation, Baileys connection, or WebSocket failures are identified
3. **Given** the infrastructure stack (PostgreSQL, Redis, EasyPanel), **When** checking each component, **Then** any connectivity or resource issues are found
4. **Given** a known root cause, **When** applying the fix, **Then** the QR code becomes scannable and WhatsApp connects

---

### User Story 3 - Verify end-to-end WhatsApp flow after reconnection (Priority: P2)

As an admin, I want to verify that WhatsApp messages are being sent and received correctly after reconnecting, so that customer communication resumes normally.

**Why this priority**: Reconnecting is only useful if the full message flow works afterward.

**Independent Test**: Can be tested by triggering a known automated WhatsApp message (e.g., a test payment confirmation) and confirming delivery.

**Acceptance Scenarios**:

1. **Given** the WhatsApp instance is connected, **When** a customer completes a test booking, **Then** they receive a WhatsApp welcome message
2. **Given** the instance is connected, **When** a customer sends a WhatsApp message to the number, **Then** it appears in the admin IA Chat center
3. **Given** the instance is connected, **When** an admin takes over a conversation and sends a reply, **Then** the customer receives it on WhatsApp

---

### Edge Cases

- What happens when the Evolution API container was restarted and the session was lost?
- How does the system handle QR code expiration (QR codes are typically valid for ~20 seconds)?
- What happens if the Evolution API database (PostgreSQL) has corrupted session data?
- How does the system behave if the WhatsApp number is banned or flagged?
- What happens when multiple admin phones try to connect to the same instance?
- How does Cloudflare proxy affect WebSocket connections required for QR code and real-time messaging?

## Requirements

### Functional Requirements

- **FR-001**: The Evolution API Manager at `/manager` MUST be accessible and display the instance management interface
- **FR-002**: The system MUST display a scannable QR code when the admin clicks "Connect" on a disconnected instance
- **FR-003**: The Evolution API MUST correctly handle the WebSocket connection required for QR code generation and real-time WhatsApp communication
- **FR-004**: The instance connection status MUST be clearly visible in the Manager UI (e.g., "open", "connecting", "close", "disconnected")
- **FR-005**: The system MUST persist the WhatsApp session data in PostgreSQL so that reconnecting is not required after container restarts
- **FR-006**: The Evolution API MUST accept incoming WhatsApp messages and forward them via webhook to n8n at `https://agent-ia.innotechlabssas.lat/webhook/evolution-events`
- **FR-007**: The system MUST send outgoing WhatsApp messages via the Evolution API's `/message/sendText/` endpoint
- **FR-008**: If the instance is disconnected, the admin MUST be able to reconnect without recreating the instance from scratch

### Key Entities

- **Evolution API Instance**: A named connection (`localplug-main`) representing a WhatsApp session with its own state, QR code, and webhook configuration
- **WhatsApp Session**: Persisted connection between the Evolution API and WhatsApp's servers, including authentication tokens and encryption keys
- **QR Code**: A temporary scannable code generated by Evolution API that authenticates a WhatsApp client (valid for ~20 seconds)
- **Webhook Target**: The n8n endpoint that receives events from Evolution API (message received, status changes, etc.)
- **Infrastructure Components**: PostgreSQL (session persistence), Redis (caching/temp data), EasyPanel (container orchestration), Cloudflare (DNS/SSL/proxy)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin can successfully scan the QR code and connect WhatsApp within 1 attempt (or clear error message explaining why not)
- **SC-002**: Root cause of QR failure is identified and documented with specific evidence (logs, HTTP responses, error codes)
- **SC-003**: After reconnection, WhatsApp messages are sent and received within 30 seconds end-to-end
- **SC-004**: The instance remains connected for at least 24 hours without requiring manual reconnection
- **SC-005**: All WhatsApp-based flows (payment confirmations, AI chat, driver notifications) are verified working after fix

## Assumptions

- The Evolution API Docker container (`atendai/evolution-api:latest`) is still running on EasyPanel
- The PostgreSQL and Redis services required by Evolution API are operational
- The domain `api-message.innotechlabssas.lat` DNS still points to the correct EasyPanel URL
- The Cloudflare proxy configuration has not changed since initial setup
- The API key `evo_k1_localplug_2026_secure_key_here` is still valid for the instance
- The n8n instance at `agent-ia.innotechlabssas.lat` is still operational and the Evolution webhook is configured
- The WhatsApp phone number used initially is still valid and not banned/suspended
