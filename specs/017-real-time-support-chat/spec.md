# Design: Real-Time Support Chat Evolution

**Spec**: `017-real-time-support-chat` | **Date**: 2026-05-31

## Overview

Evolve the existing AI-powered chat widget into a full support chat system with pre-chat form, conversation state management, inactivity monitoring, agent finalization, and satisfaction surveys.

## Architecture

### State Machine (Widget)
```
  [Form] → [Chat with IA/human] → [Survey] → [Closed] → (loop back to [Form])
```

### State Mapping (DB `conversations.status`)

| Display State    | DB Value        | Description                          |
|------------------|-----------------|--------------------------------------|
| Pendiente        | `pending`       | Created via form, waiting for agent  |
| Activa           | `active`        | In conversation (IA or human)        |
| Esperando Usuario| `waiting_user`  | Agent replied, waiting on user       |
| Inactiva         | `inactive`      | Inactivity timer triggered           |
| Resuelta         | `resolved`      | Closed by support (finalize button)  |
| Cerrada          | `closed`        | Closed by inactivity or auto-close   |

Legacy states (`ai_active`, `human_active`, `escalated`) preserved for WhatsApp/n8n conversations.

---

## Database Changes

### Migration `020_support_chat_evolution.sql`

```sql
ALTER TABLE conversations ADD COLUMN user_phone TEXT;
ALTER TABLE conversations ADD COLUMN user_country TEXT;
ALTER TABLE conversations ADD COLUMN country_code TEXT;

CREATE TABLE IF NOT EXISTS conversation_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/chat/start` | Create conversation from pre-chat form |
| PATCH | `/api/chat/conversations/[id]/status` | Update conversation status (admin) |
| POST | `/api/chat/conversations/[id]/rating` | Save satisfaction survey |
| POST | `/api/chat/send` | **Modified** — supports agent sender type, resets inactivity |
| GET | `/api/chat/messages` | **Modified** — includes system inactivity messages |

### POST `/api/chat/start`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "3001234567",
  "country": "Colombia",
  "countryCode": "+57"
}
→ { "success": true, "conversationId": 123, "sessionId": "uuid" }
```

### PATCH `/api/chat/conversations/[id]/status`
```json
{ "status": "resolved" }
→ { "success": true }
```

### POST `/api/chat/conversations/[id]/rating`
```json
{ "rating": 5, "comment": "Great service!" }
→ { "success": true }
```

---

## Frontend Widget (`ChatWidget.tsx`)

### 4 Screens (state machine)

1. **FormScreen**: Name, email, phone, country selector (complete world list with dial codes)
2. **ChatScreen**: Messages + input + typing indicators + inactivity warnings
3. **SurveyScreen**: 5-star rating + optional comment textarea
4. **ClosedScreen**: "Thank you" + "Start new chat" button

### Inactivity Monitoring

- 60s of silence → system message: "¿Sigues disponible? Estamos atentos para ayudarte."
- 90s of silence (30s after warning) → close conversation: "La conversación ha sido cerrada por inactividad..."
- Timer resets on: user sends message, agent sends message, typing indicator active
- Implemented client-side with `useEffect` + `setTimeout`, backed by server-side check in polling

### Auto-reset on close
- Clear `localStorage` session
- Show survey screen
- After survey → show closed screen → back to form

---

## Admin Page (`/admin/ia-chat/page.tsx`)

### Changes
- Add status filters for: `pending`, `active`, `waiting_user`, `inactive`, `resolved`
- Show user phone + country in info bar
- Add **"Finalizar Conversación"** button → sets status to `resolved`, sends system message, shows rating if exists
- Map new statuses to distinct color badges
- Handle legacy statuses for existing conversations

### New Status Colors
| Status       | Color  |
|--------------|--------|
| pending      | Blue   |
| active       | Green  |
| waiting_user | Yellow |
| inactive     | Orange |
| resolved     | Purple |
| closed       | Gray   |

---

## i18n Keys

New translation keys under `chatWidget`:
```json
{
  "chatWidget": {
    "formTitle": "Start a conversation",
    "namePlaceholder": "Full name",
    "emailPlaceholder": "Email",
    "phonePlaceholder": "Phone",
    "countryPlaceholder": "Select country",
    "startChat": "Start chat",
    "inactivityWarning": "¿Sigues disponible? Estamos atentos para ayudarte.",
    "inactivityClosed": "La conversación ha sido cerrada por inactividad. Si necesitas ayuda nuevamente, puedes iniciar un nuevo chat.",
    "closedByAgent": "La conversación ha sido finalizada por nuestro equipo de soporte. Gracias por contactarnos.",
    "surveyTitle": "¿Cómo calificarías la atención recibida?",
    "surveyComment": "Comentario adicional (opcional)",
    "surveySubmit": "Enviar",
    "surveySkip": "Omitir",
    "rating1": "Muy mala",
    "rating2": "Mala",
    "rating3": "Regular",
    "rating4": "Buena",
    "rating5": "Excelente",
    "thanks": "¡Gracias por tu opinión!",
    "newChat": "Nueva conversación"
  }
}
```

---

## File Change Summary

| File | Change |
|------|--------|
| `lib/db/migrations/020_support_chat_evolution.sql` | **New** — DB migration |
| `app/api/chat/start/route.ts` | **New** — Start conversation endpoint |
| `app/api/chat/status/route.ts` | **New** — Status update endpoint |
| `app/api/chat/rating/route.ts` | **New** — Rating endpoint |
| `app/components/chat/ChatWidget.tsx` | **Rewrite** — Full state machine |
| `app/admin/ia-chat/page.tsx` | **Modified** — New states, finalize button, phone/country info |
| `lib/i18n/locales/en.ts` | **Modified** — New chatWidget keys |
| `lib/i18n/locales/es.ts` | **Modified** — New chatWidget keys |
| `app/api/chat/send/route.ts` | **Modified** — Inactivity reset, agent typing support |
| `app/api/chat/close/route.ts` | **Modified** — Support new status values |
