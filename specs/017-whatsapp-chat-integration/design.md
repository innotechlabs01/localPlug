# WhatsApp Chat Integration Design

**Date**: 2026-08-12 | **Feature**: 017-whatsapp-chat-integration

## Overview

Enable WhatsApp as a communication channel by:
1. Adding a WhatsApp button to the chat widget
2. Processing incoming WhatsApp messages via Evolution API webhook
3. Responding with AI-generated messages via Evolution API
4. Supporting human escalation with admin takeover from /admin/ia-chat
5. Sending admin messages back to WhatsApp users via Evolution API

## Architecture

### App Direct Architecture (No n8n for WhatsApp)

```
WhatsApp User → Evolution API → App Webhook → AI Processing → Evolution API → WhatsApp User
                                          ↓
                                    Admin Notification
                                          ↓
                                    Admin Takeover → App → Evolution API → WhatsApp User
```

**Why App Direct:**
- Single system to maintain (no n8n dependency for WhatsApp)
- Full control over message flow and AI responses
- Consistent conversation management (web + WhatsApp in same DB)
- Admin takeover works seamlessly

## Components

### 1. WhatsApp Button in ChatWidget

**File**: `app/components/chat/ChatWidget.tsx`

Add a WhatsApp icon button that:
- Opens `wa.me/{WHATSAPP_NUMBER}?text={encoded_message}` in new tab
- Pre-fills message: "Hola, necesito ayuda con mi reserva de LocalPlug"
- Only shows when widget is open (not in form screen)
- Styled consistently with existing widget design

### 2. Evolution API Webhook Handler

**File**: `app/api/webhooks/evolution/route.ts`

**Current state**: Handler exists but needs updates for:
- Processing incoming text messages (`messages.upsert` event)
- Extracting phone number, message content, and metadata
- Creating/updating conversations in database
- Triggering AI response generation
- Storing messages in `messages` table

**Flow**:
1. Receive webhook from Evolution API
2. Validate signature (`x-evolution-signature`)
3. Filter: Only process `messages.upsert` where `fromMe = false`
4. Extract: phone, message, pushName, messageId
5. Find or create conversation (channel = 'whatsapp')
6. Store user message in `messages` table
7. Check conversation status:
   - If `ai_active` → Generate AI response
   - If `human_active` → Notify admin, don't respond
8. Generate AI response (GPT-4o via app service)
9. Send response via Evolution API
10. Store AI message in `messages` table

### 3. AI Response Generation

**File**: `lib/services/openai-service.ts`

Reuse existing `generateOpenAIResponse()` with:
- System prompt (bilingual, LocalPlug context)
- Conversation history (last 6 messages)
- Booking context if available
- Escalation detection logic

**Escalation Detection**:
- Keywords: "hablar con alguien", "humano", "agente", "queja", "problema", "refund", "cancel"
- Low confidence (< 0.5) from AI
- When detected: Set conversation status to `human_active`, notify admin

### 4. Admin Send via Evolution API

**File**: `app/api/chat/send/route.ts`

**Current gap**: When `senderType === 'agent'`, messages only go to DB.

**Fix**: Add WhatsApp send logic:
```
if (senderType === 'agent' && conversation.channel === 'whatsapp') {
  await sendWhatsAppDirect({
    number: conversation.user_phone,
    message: content,
    instanceName: process.env.EVOLUTION_INSTANCE_NAME
  })
}
```

### 5. Real-time Admin Notification

**File**: `app/admin/ia-chat/page.tsx`

**Current state**: Polls for conversations every 5 seconds.

**Enhancement**: When a WhatsApp escalation occurs:
- Admin sees badge/indicator on conversation
- Sound notification (optional)
- Conversation auto-selected in list

## Data Flow

### Incoming WhatsApp Message

```
1. User sends WhatsApp message
2. Evolution API receives message
3. Evolution API sends webhook to /api/webhooks/evolution
4. App processes webhook:
   a. Extract phone, message, pushName
   b. Find/create conversation (channel='whatsapp')
   c. Store message (sender_type='user')
   d. Check status:
      - ai_active: Generate AI response
      - human_active: Notify admin, skip AI
5. AI generates response (GPT-4o)
6. Check for escalation keywords
7. If escalation:
   a. Set status to 'human_active'
   b. Send "Un agente te contactará" message
   c. Notify admin via conversation update
8. If no escalation:
   a. Send AI response via Evolution API
   b. Store message (sender_type='ai')
9. Update conversation.last_message_at
```

### Admin Takeover Flow

```
1. Admin sees WhatsApp conversation in /admin/ia-chat
2. Admin clicks "Take Over"
3. Status changes to 'human_active'
4. AI stops responding to that conversation
5. Admin types message in chat
6. App sends message via Evolution API
7. User receives message on WhatsApp
8. User replies → Goes to admin (no AI)
9. Admin clicks "Release to AI"
10. Status changes to 'ai_active'
11. AI resumes responding
```

## Database Changes

**No new tables needed.** Existing schema supports:
- `conversations.channel = 'whatsapp'`
- `conversations.user_phone`
- `conversations.status` (ai_active/human_active)
- `messages.sender_type = 'agent'` (for admin messages)
- `whatsapp_events` (for event tracking)

## Environment Variables

```env
# Evolution API (already configured)
EVOLUTION_API_URL=https://api-message.innotechlabssas.lat
EVOLUTION_API_KEY=evo_k1_localplug_2026_secure_key_here
EVOLUTION_INSTANCE_NAME=localplug-main
EVOLUTION_WEBHOOK_SECRET=your_webhook_secret_here

# WhatsApp Business Number (for wa.me link)
WHATSAPP_BUSINESS_NUMBER=573001234567
```

## Implementation Tasks

### Phase 1: Core WhatsApp Integration
1. Update Evolution API webhook handler for incoming messages
2. Add AI response generation for WhatsApp messages
3. Send responses via Evolution API
4. Store messages in database

### Phase 2: Human Escalation
5. Add escalation detection in AI responses
6. Notify admin of WhatsApp escalations
7. Update admin IA chat to show WhatsApp conversations

### Phase 3: Admin Takeover
8. Fix admin send to use Evolution API for WhatsApp channels
9. Test end-to-end flow

### Phase 4: UI Enhancements
10. Add WhatsApp button to chat widget
11. Add WhatsApp indicator in conversation list
12. Style WhatsApp-specific UI elements

## Testing

### Test Cases
1. **Incoming message**: User sends WhatsApp → AI responds
2. **Escalation**: User says "hablar con alguien" → Admin notified
3. **Admin takeover**: Admin takes control → AI stops → Admin sends
4. **Admin release**: Admin releases → AI resumes
5. **Multiple conversations**: Multiple WhatsApp users simultaneously
6. **Message history**: All messages stored and visible in admin

### Manual Testing Checklist
- [ ] Evolution API webhook receives messages
- [ ] AI responds to WhatsApp messages
- [ ] Escalation keywords trigger human mode
- [ ] Admin sees WhatsApp conversations
- [ ] Admin can take over WhatsApp conversations
- [ ] Admin messages reach user on WhatsApp
- [ ] AI resumes after admin release
- [ ] WhatsApp button opens wa.me link
- [ ] Conversation history is complete

## Security Considerations

- Validate Evolution API webhook signature
- Rate limiting (50 msgs/hour) already implemented
- Circuit breaker for Evolution API failures
- Phone number masking in logs (last 4 digits only)
- No sensitive data in WhatsApp messages

## Rollback Plan

If issues arise:
1. Disable Evolution API webhook in EasyPanel
2. WhatsApp messages stop processing
3. Web chat continues working normally
4. Admin can still see historical WhatsApp conversations
