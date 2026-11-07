-- ═══════════════════════════════════════════════════════
-- MIGRATION 038: Full rebuild — packages, tours, rooms
-- ═══════════════════════════════════════════════════════

-- 1. PAQUETES (reemplaza plans)
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  base_price_usd REAL NOT NULL DEFAULT 0,
  includes_pickup INTEGER DEFAULT 1,
  includes_sim INTEGER DEFAULT 0,
  includes_accompaniment INTEGER DEFAULT 0,
  accompaniment_hours REAL DEFAULT 0,
  accompaniment_type TEXT,
  includes_round_trip INTEGER DEFAULT 0,
  includes_concierge INTEGER DEFAULT 0,
  service_fee_flat REAL DEFAULT 0,
  is_popular INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. TOURS (vinculados a paquetes)
CREATE TABLE IF NOT EXISTS tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_person_usd REAL NOT NULL DEFAULT 0,
  vehicle_type TEXT NOT NULL DEFAULT 'suv',
  duration_hours REAL DEFAULT 8,
  max_people INTEGER DEFAULT 10,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. FEATURES POR PAQUETE
CREATE TABLE IF NOT EXISTS package_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 4. HABITACIONES: disponibilidad por fecha (handled via TypeScript migration ensurePackagesSchema)

-- 5. BOOKINGS DE HABITACIONES — existing table has check_in + nights, add check_out if missing
-- The TypeScript migration (ensurePackagesSchema) handles the ALTER for room_bookings.check_out

-- 6. ORDERS: breakdown de pricing
-- Solo agregar columnas si no existen
-- ALTER TABLE orders ADD COLUMN tour_subtotal_usd REAL DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN service_fee_usd REAL DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN tax_amount_usd REAL DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN grand_total_usd REAL DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN tour_breakdown TEXT;

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_tours_package ON tours(package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_package ON package_features(package_id);
-- idx_room_bookings_dates with check_out is created via TypeScript migration after ALTER

-- ═══════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════

-- Solo insertar si packages está vacío
INSERT OR IGNORE INTO packages (slug, name, description, base_price_usd,
  includes_pickup, includes_sim, includes_accompaniment, accompaniment_hours, accompaniment_type,
  includes_round_trip, includes_concierge, service_fee_flat, is_popular, is_active, sort_order)
SELECT 'smooth-landing', 'Smooth Landing', 'Perfect for the independent traveler who just wants to arrive safe', 89,
  1, 1, 0, 0, NULL, 0, 0, 0, 0, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'smooth-landing');

INSERT OR IGNORE INTO packages (slug, name, description, base_price_usd,
  includes_pickup, includes_sim, includes_accompaniment, accompaniment_hours, accompaniment_type,
  includes_round_trip, includes_concierge, service_fee_flat, is_popular, is_active, sort_order)
SELECT 'first-24', 'First 24', 'Skip the gringo taxes and master the neighborhood instantly', 159,
  1, 1, 1, 2, 'bilingual_fixer', 0, 0, 30, 1, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'first-24');

INSERT OR IGNORE INTO packages (slug, name, description, base_price_usd,
  includes_pickup, includes_sim, includes_accompaniment, accompaniment_hours, accompaniment_type,
  includes_round_trip, includes_concierge, service_fee_flat, is_popular, is_active, sort_order)
SELECT 'full-insider', 'Full Insider', 'Ultimate peace of mind. Zero logistics stress', 269,
  1, 1, 0, 0, NULL, 1, 1, 0, 0, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'full-insider');

-- Features para smooth-landing
INSERT OR IGNORE INTO package_features (package_id, text, sort_order)
SELECT p.id, f.text, f.sort_order FROM (
  SELECT 'smooth-landing' as slug, 'VIP Airport Pickup with sign & flight monitoring' as text, 1 as sort_order
  UNION ALL SELECT 'smooth-landing', 'Premium SUV/Camioneta transfer', 2
  UNION ALL SELECT 'smooth-landing', 'Túnel de Oriente toll covered', 3
  UNION ALL SELECT 'smooth-landing', 'Pre-loaded Metro Cívica Card + premium water', 4
  UNION ALL SELECT 'smooth-landing', 'SIM/eSIM with high-speed data plan', 5
) f JOIN packages p ON f.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM package_features WHERE package_id = p.id);

-- Features para first-24
INSERT OR IGNORE INTO package_features (package_id, text, sort_order)
SELECT p.id, f.text, f.sort_order FROM (
  SELECT 'first-24' as slug, 'Everything in Smooth Landing' as text, 1 as sort_order
  UNION ALL SELECT 'first-24', '2-hour bilingual Local Fixer at your lobby', 2
  UNION ALL SELECT 'first-24', 'VIP Check-in & neighborhood orientation tour', 3
  UNION ALL SELECT 'first-24', 'Best ATMs, safe stores & hidden gems', 4
  UNION ALL SELECT 'first-24', 'Rappi/delivery apps local optimization', 5
) f JOIN packages p ON f.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM package_features WHERE package_id = p.id);

-- Features para full-insider
INSERT OR IGNORE INTO package_features (package_id, text, sort_order)
SELECT p.id, f.text, f.sort_order FROM (
  SELECT 'full-insider' as slug, 'Everything in First 24' as text, 1 as sort_order
  UNION ALL SELECT 'full-insider', 'Round-trip airport transfer guarantee', 2
  UNION ALL SELECT 'full-insider', '24/7 AI WhatsApp Concierge + translation', 3
  UNION ALL SELECT 'full-insider', '24/7 human fixer safety net for emergencies', 4
  UNION ALL SELECT 'full-insider', 'Airbnb accommodation validation before landing', 5
) f JOIN packages p ON f.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM package_features WHERE package_id = p.id);

-- Tours para full-insider
INSERT OR IGNORE INTO tours (package_id, name, description, price_per_person_usd, vehicle_type, duration_hours, sort_order)
SELECT p.id, t.name, t.description, t.price, t.vehicle, t.hours, t.sort_order FROM (
  SELECT 'full-insider' as slug, 'Guatapé Day Trip' as name, 'Pueblo de colores y subida a la Piedra del Penol' as description, 149 as price, 'suv' as vehicle, 8 as hours, 1 as sort_order
  UNION ALL SELECT 'full-insider', 'Coffee Farm Experience', 'Finca cafetera y experiencia barista', 119, 'suv', 6, 2
  UNION ALL SELECT 'full-insider', 'Santa Fe de Antioquia', 'Pueblo colonial patrimonio historico', 89, 'suv', 10, 3
  UNION ALL SELECT 'full-insider', 'Comuna 13 Graffiti Tour', 'Recorrido por el arte urbano de Comuna 13', 89, 'suv', 4, 4
  UNION ALL SELECT 'full-insider', 'Paragliding in San Felix', 'Vuelo en parapente sobre el valle de San Felix', 79, 'suv', 3, 5
) t JOIN packages p ON t.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE package_id = p.id);
