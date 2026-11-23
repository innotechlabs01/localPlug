-- Migration: Hotels, Rooms, Promotions & Room Bookings
-- Created: 2026-06-20
-- Feature: Hotel management, commission system, booking suggestions

-- ============================================================
-- HOTELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  lat REAL,
  lng REAL,
  phone TEXT,
  email TEXT,
  website TEXT,
  photos TEXT, -- JSON array of URLs
  stars INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  commission_rate REAL NOT NULL DEFAULT 0.10, -- platform commission (e.g. 0.10 = 10%)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 1,
  price_per_night REAL NOT NULL, -- hotel base price (without commission)
  amenities TEXT, -- JSON array: ["WiFi","Pool","AC"]
  photos TEXT, -- JSON array of URLs
  status TEXT NOT NULL DEFAULT 'available', -- available, unavailable
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- ============================================================
-- PROMOTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'discount', -- discount, promo_code
  code TEXT, -- null for fixed discounts, text for promo codes
  discount_amount REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_hotel_id ON promotions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_code_unique ON promotions(code) WHERE code IS NOT NULL;

-- ============================================================
-- ROOM BOOKINGS TABLE (links orders to rooms)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  check_in TEXT,
  nights INTEGER NOT NULL DEFAULT 1,
  price_per_night REAL NOT NULL,
  total_amount REAL NOT NULL, -- nights * price_per_night (display price to customer)
  promotion_id INTEGER REFERENCES promotions(id),
  discount_applied REAL NOT NULL DEFAULT 0,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, checked_in, checked_out, cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_room_bookings_order_id ON room_bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room_id ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_hotel_id ON room_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON room_bookings(status);

-- ============================================================
-- USERS: Add hotel_id for hotel_manager role
-- ============================================================
ALTER TABLE users ADD COLUMN hotel_id INTEGER REFERENCES hotels(id);

CREATE INDEX IF NOT EXISTS idx_users_hotel_id ON users(hotel_id);

-- ============================================================
-- ROLES: Add hotel_manager role
-- ============================================================
INSERT OR IGNORE INTO roles (id, name, description) VALUES (5, 'hotel_manager', 'Hotel manager with access to their hotel dashboard');

-- ============================================================
-- MODULES: Add Hotels module
-- ============================================================
INSERT OR IGNORE INTO modules (name, slug, description, icon, sort_order) VALUES
  ('Hotels', 'hotels', 'Hotel & room management', 'Building', 15);

-- ============================================================
-- PERMISSIONS: Hotel manager sees only hotels module + reservations (filtered by hotel)
-- ============================================================
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 5, id, 1, 1, 1, 1 FROM modules WHERE slug = 'hotels';

INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 5, id, 1, 0, 1, 0 FROM modules WHERE slug = 'dashboard';

INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 5, id, 1, 0, 0, 0 FROM modules WHERE slug = 'reservations';

-- Admin gets full access to hotels module
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 1, id, 1, 1, 1, 1 FROM modules WHERE slug = 'hotels';
