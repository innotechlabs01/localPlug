# End-to-End Testing Checklist: WhatsApp n8n Communication

**Date**: 2026-05-19 | **Feature**: 010-whatsapp-n8n-communication

## Prerequisites

- [ ] Evolution API deployed on EasyPanel
- [ ] WhatsApp instance connected (QR scanned)
- [ ] n8n workflows created and activated
- [ ] OpenAI API key configured in n8n
- [ ] Database migration 009 applied
- [ ] Environment variables set in Vercel

## Test 1: Payment → WhatsApp Confirmation

- [ ] Complete a test booking on the website
- [ ] Fill in flight details (flight number, airline, arrival date/time)
- [ ] Fill in profile (name, email, phone in E.164 format)
- [ ] Select a package
- [ ] Complete Stripe payment
- [ ] WhatsApp welcome message received within 30 seconds
- [ ] Message contains correct booking reference
- [ ] Message contains correct package name
- [ ] Message contains correct flight number
- [ ] Message contains correct arrival date
- [ ] Message is in correct language (Spanish/English)

## Test 2: User Message → AI Response

- [ ] Send "hola" to business WhatsApp
- [ ] AI responds in Spanish within 5 seconds
- [ ] Send "hello" to business WhatsApp
- [ ] AI responds in English within 5 seconds
- [ ] Send "¿qué paquetes tienen?"
- [ ] AI lists available packages
- [ ] Send "quiero reservar"
- [ ] AI guides booking process
- [ ] Response time < 5 seconds for all messages

## Test 3: Escalation Detection

- [ ] Send "hablar con alguien"
- [ ] Escalation message received ("Un agente te contactará...")
- [ ] Conversation status changes to "escalated" in database
- [ ] Send "tengo una queja"
- [ ] Escalation triggered
- [ ] Send "refund"
- [ ] Escalation triggered
- [ ] Conversation appears in admin escalated filter

## Test 4: Admin Takeover

- [ ] Open admin IA Chat Center
- [ ] Select a WhatsApp conversation
- [ ] Click "Take Over"
- [ ] AI stops responding to that conversation
- [ ] Send a manual message as admin
- [ ] User receives the message on WhatsApp
- [ ] Click "AI Mode"
- [ ] AI resumes processing incoming messages

## Test 5: Admin Dashboard

- [ ] WhatsApp conversations show with green "WhatsApp" badge
- [ ] Channel filter works (All/WhatsApp/Web)
- [ ] Message history shows source labels (user/AI/agent/system)
- [ ] WhatsApp messages show "WA" indicator
- [ ] Conversation metadata (email, booking ref, channel) visible

## Test 6: Status Tracking

- [ ] WhatsApp delivery status tracked in database
- [ ] Instance disconnect alerts appear in logs
- [ ] Message read receipts tracked

## Test 7: Error Handling

- [ ] Invalid phone number → system logs failure, booking remains confirmed
- [ ] AI service unavailable → fallback message sent
- [ ] Evolution API disconnected → messages queued for retry
- [ ] Two admins take over same conversation → last-write-wins

## Test 8: Data Integrity

- [ ] All WhatsApp events stored in whatsapp_events table
- [ ] Raw payloads present for events < 30 days old
- [ ] Raw payloads NULL for events > 30 days old
- [ ] Conversations have correct channel (whatsapp/web)
- [ ] Messages have correct sender_type (user/ai/agent/system)

## Sign-off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Ready for production deployment
