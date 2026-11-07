-- Migration: Add Paddle payment columns to payments table
-- Replaces Stripe fields with Paddle fields

ALTER TABLE payments ADD COLUMN paddle_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN paddle_webhook_event_id TEXT;

-- Clean up old Stripe index
DROP INDEX IF EXISTS idx_payments_webhook_event;

-- New index for webhook dedup
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paddle_webhook_event ON payments(paddle_webhook_event_id);

-- Migrate existing data from old Stripe columns
UPDATE payments SET paddle_transaction_id = stripe_payment_intent_id WHERE paddle_transaction_id IS NULL AND stripe_payment_intent_id IS NOT NULL;
UPDATE payments SET paddle_webhook_event_id = stripe_webhook_event_id WHERE paddle_webhook_event_id IS NULL AND stripe_webhook_event_id IS NOT NULL;
