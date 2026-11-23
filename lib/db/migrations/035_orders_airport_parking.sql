-- Migration 035: airport_parking flag on orders (Option B: driver sets at trip end)
-- Stored as INTEGER boolean (0/1). Default 0 for existing rows.
ALTER TABLE orders ADD COLUMN airport_parking INTEGER NOT NULL DEFAULT 0;
