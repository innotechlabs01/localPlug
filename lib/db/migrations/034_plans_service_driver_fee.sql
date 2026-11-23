ALTER TABLE plans ADD COLUMN price_per_person_usd REAL NOT NULL DEFAULT 0;

UPDATE plans SET price_per_person_usd = 0 WHERE slug IN ('smooth-landing', 'welcome-pack');
UPDATE plans SET price_per_person_usd = 30 WHERE slug IN ('first-24', '24h-insider');
UPDATE plans SET price_per_person_usd = 40 WHERE slug IN ('full-insider', 'medellin-freedom-pass');

INSERT OR IGNORE INTO settings (key, value) VALUES ('driver_trip_fee_usd', '40');
INSERT OR IGNORE INTO settings (key, value) VALUES ('driver_toll_usd', '6');
INSERT OR IGNORE INTO settings (key, value) VALUES ('driver_airport_parking_usd', '20');
INSERT OR IGNORE INTO settings (key, value) VALUES ('driver_airport_parking_pct', '50');

INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order)
SELECT id, 'Guatape Day Trip', 'Pueblo de colores y subida a la Piedra del Penol', 149, 1 FROM plans
WHERE slug IN ('full-insider', 'medellin-freedom-pass')
  AND NOT EXISTS (SELECT 1 FROM plan_tours WHERE plan_tours.plan_id = plans.id AND plan_tours.name = 'Guatape Day Trip');

INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order)
SELECT id, 'Coffee Farm Experience', 'Finca cafetera y experiencia barista', 119, 2 FROM plans
WHERE slug IN ('full-insider', 'medellin-freedom-pass')
  AND NOT EXISTS (SELECT 1 FROM plan_tours WHERE plan_tours.plan_id = plans.id AND plan_tours.name = 'Coffee Farm Experience');

INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order)
SELECT id, 'Santa Fe de Antioquia', 'Pueblo colonial patrimonio historico', 89, 3 FROM plans
WHERE slug IN ('full-insider', 'medellin-freedom-pass')
  AND NOT EXISTS (SELECT 1 FROM plan_tours WHERE plan_tours.plan_id = plans.id AND plan_tours.name = 'Santa Fe de Antioquia');

INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order)
SELECT id, 'Comuna 13 Graffiti Tour', 'Recorrido por el arte urbano de Comuna 13', 89, 4 FROM plans
WHERE slug IN ('full-insider', 'medellin-freedom-pass')
  AND NOT EXISTS (SELECT 1 FROM plan_tours WHERE plan_tours.plan_id = plans.id AND plan_tours.name = 'Comuna 13 Graffiti Tour');

INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order)
SELECT id, 'Paragliding in San Felix', 'Vuelo en parapente sobre el valle de San Felix', 79, 5 FROM plans
WHERE slug IN ('full-insider', 'medellin-freedom-pass')
  AND NOT EXISTS (SELECT 1 FROM plan_tours WHERE plan_tours.plan_id = plans.id AND plan_tours.name = 'Paragliding in San Felix');
