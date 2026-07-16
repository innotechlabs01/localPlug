-- 032: Hotel additional services (laundry, cleaning, tours, etc.)
CREATE TABLE IF NOT EXISTS hotel_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL NOT NULL DEFAULT 0,
  commission_applies INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hotel_services_hotel_id ON hotel_services(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_services_active ON hotel_services(hotel_id, active);
