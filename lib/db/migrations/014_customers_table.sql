CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  languages TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  vip_level TEXT NOT NULL DEFAULT 'standard',
  notes TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  preferences TEXT DEFAULT '{}',
  total_trips INTEGER DEFAULT 0,
  lifetime_value REAL DEFAULT 0,
  last_trip_date TEXT,
  first_trip_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_vip_level ON customers(vip_level);
