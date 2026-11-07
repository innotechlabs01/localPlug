-- Migration 043: Guard against concurrent duplicate payout requests.
-- Only one ACTIVE (requested or paid) request may exist per (payee_type, payee_id,
-- period). This makes double "Solicitar pago" clicks fail atomically instead of
-- creating a second request whose ledger lines are already marked requested.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_req_unique_active
  ON payout_requests(payee_type, payee_id, period)
  WHERE status IN ('requested', 'paid');