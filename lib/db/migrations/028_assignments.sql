-- Migration: Driver Assignment System with acceptance flow
-- Created: 2026-07-05
-- Feature: Intelligent driver assignment with WhatsApp acceptance

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  driver_id INTEGER REFERENCES drivers(id),
  status TEXT NOT NULL DEFAULT 'pending_acceptance',
  service_type TEXT DEFAULT 'pickup',
  pickup_location TEXT,
  destination TEXT,
  pickup_date TEXT,
  pickup_time TEXT,
  estimated_duration TEXT,
  estimated_block_minutes INTEGER DEFAULT 120,
  block_until TEXT,
  observations TEXT,
  notified_driver_at TEXT,
  notified_client_at TEXT,
  driver_accepted_at TEXT,
  driver_declined_at TEXT,
  confirmed_at TEXT,
  en_route_at TEXT,
  in_progress_at TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  decline_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assignments_order ON assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_pickup_date ON assignments(pickup_date);
CREATE INDEX IF NOT EXISTS idx_assignments_block_until ON assignments(block_until);

-- Add dispatch_status values for the driver acceptance flow
-- pending_acceptance = waiting for driver to accept via WhatsApp
-- No schema change needed to orders — dispatch_status is TEXT and already exists
