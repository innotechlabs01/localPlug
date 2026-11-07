-- Migration: Add UNIQUE index on stripe_webhook_event_id for idempotent webhook processing
-- Prevents duplicate processing of the same Stripe event under concurrent load

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_webhook_event ON payments(stripe_webhook_event_id);

-- Also add helpful index for the common lookup pattern
CREATE INDEX IF NOT EXISTS idx_payments_booking_ref ON payments(booking_reference);
