-- Migration: Add customer_phone to payments table for WhatsApp notifications
-- Created: 2026-05-17
-- Feature: 008-ai-chat-enhancement

ALTER TABLE payments ADD COLUMN customer_phone TEXT;
