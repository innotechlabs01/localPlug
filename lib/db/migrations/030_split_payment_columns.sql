-- Migration 030: Add split payment columns to payments table
-- Supports platform commission + hotel payout split model

-- Add split payment columns
ALTER TABLE payments ADD COLUMN platform_fee_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN hotel_payout_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN split_status TEXT DEFAULT 'pending';
-- split_status values: 'pending' | 'completed' | 'failed' | 'refunded'

-- Create index for split payment queries
CREATE INDEX IF NOT EXISTS idx_payments_split_status ON payments(split_status);

-- Backfill existing completed payments with split data
-- Platform fee = 10% of amount (default commission rate)
UPDATE payments 
SET platform_fee_cents = CAST(amount * 0.10 AS INTEGER),
    hotel_payout_cents = amount - CAST(amount * 0.10 AS INTEGER),
    split_status = 'completed'
WHERE status = 'completed' AND split_status = 'pending';