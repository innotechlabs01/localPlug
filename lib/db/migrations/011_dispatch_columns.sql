-- Migration: Add dispatch columns to orders table
-- Created: 2026-05-21
-- Feature: admin-dispatch-phase

-- Dispatch status tracking (pending, assigned, enroute, pickedup, completed)
ALTER TABLE orders ADD COLUMN dispatch_status TEXT DEFAULT 'pending';

-- Driver assignment reference
ALTER TABLE orders ADD COLUMN assigned_to INTEGER REFERENCES drivers(id);

-- When the driver was assigned
ALTER TABLE orders ADD COLUMN assigned_at TEXT;

-- Indexes for dispatch queries
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_status ON orders(dispatch_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
