-- Migration: Fix assigned_to FK to reference drivers instead of users
-- SQLite doesn't support ALTER FK, so we recreate the table

-- 1. Create new orders table without the wrong FK
CREATE TABLE IF NOT EXISTS orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  booking_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_country TEXT,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  flight_number TEXT,
  airline TEXT,
  arrival_date TEXT,
  arrival_time TEXT,
  destination_address TEXT,
  destination_has_place INTEGER DEFAULT 1,
  additional_trips TEXT,
  traveler_profile TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to INTEGER,
  assigned_at TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id INTEGER,
  internal_notes TEXT,
  customer_notes TEXT,
  status_changed_at TEXT,
  status_changed_by INTEGER,
  dispatch_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Copy data
INSERT OR IGNORE INTO orders_new (
  id, order_number, booking_reference, customer_name, customer_email, customer_phone,
  customer_country, package_id, package_name, package_price, currency,
  flight_number, airline, arrival_date, arrival_time,
  destination_address, destination_has_place, additional_trips, traveler_profile,
  status, priority, assigned_to, assigned_at,
  payment_status, payment_id, internal_notes, customer_notes,
  status_changed_at, status_changed_by, dispatch_status,
  created_at, updated_at
)
SELECT
  id, order_number, booking_reference, customer_name, customer_email, customer_phone,
  customer_country, package_id, package_name, package_price, currency,
  flight_number, airline, arrival_date, arrival_time,
  destination_address, destination_has_place, additional_trips, traveler_profile,
  status, priority, assigned_to, assigned_at,
  payment_status, payment_id, internal_notes, customer_notes,
  status_changed_at, status_changed_by, dispatch_status,
  created_at, updated_at
FROM orders;

-- 3. Drop old, rename
DROP TABLE IF EXISTS orders;
ALTER TABLE orders_new RENAME TO orders;

-- 4. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_status ON orders(dispatch_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
