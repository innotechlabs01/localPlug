-- Migration 031: Auth Clerk + auto-registro + atribución hotelera
-- Adds Clerk linkage for driver/hotel self-registration, hotel_id on orders,
-- beds/breakfast on rooms, and driver role.

-- ============================================================
-- DRIVERS: Clerk linkage + profile completeness
-- ============================================================
ALTER TABLE drivers ADD COLUMN clerk_user_id TEXT;
ALTER TABLE drivers ADD COLUMN profile_complete INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN license_number TEXT;
ALTER TABLE drivers ADD COLUMN bank_account TEXT;

-- ============================================================
-- HOTELS: Clerk linkage + payout + self-registration fields
-- ============================================================
ALTER TABLE hotels ADD COLUMN clerk_user_id TEXT;
ALTER TABLE hotels ADD COLUMN bank_account TEXT;
ALTER TABLE hotels ADD COLUMN permits TEXT;
ALTER TABLE hotels ADD COLUMN profile_complete INTEGER DEFAULT 0;

-- ============================================================
-- ORDERS: Hotel attribution (dependency for hotel dashboard)
-- ============================================================
ALTER TABLE orders ADD COLUMN hotel_id INTEGER REFERENCES hotels(id);
ALTER TABLE orders ADD COLUMN room_id INTEGER REFERENCES rooms(id);
ALTER TABLE orders ADD COLUMN num_nights INTEGER;
ALTER TABLE orders ADD COLUMN is_hotel_booking INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN hotel_commission_rate REAL;

-- ============================================================
-- ROOMS: Beds + breakfast
-- ============================================================
ALTER TABLE rooms ADD COLUMN beds INTEGER DEFAULT 1;
ALTER TABLE rooms ADD COLUMN breakfast_included INTEGER DEFAULT 0;

-- ============================================================
-- ROLES: Add driver role (id 6)
-- ============================================================
INSERT OR IGNORE INTO roles (id, name, description) VALUES (6, 'driver', 'Driver with access to their portal');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_clerk_user_id ON drivers(clerk_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_clerk_user_id ON hotels(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_hotel_booking ON orders(is_hotel_booking);
CREATE INDEX IF NOT EXISTS idx_room_bookings_hotel_id ON room_bookings(hotel_id);
