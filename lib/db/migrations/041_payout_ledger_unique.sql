-- Migration 041: Make payout accrual idempotent via a unique per-beneficiary index.
-- A booking accrues at most one liability per payee (driver or hotel), so a unique
-- index guarantees that repeated calls to accrueDriverPayout / accrueHotelPayout
-- (or webhook replays) never create duplicate payout lines.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_ledger_unique
  ON payout_ledger(booking_reference, payee_type, payee_id);