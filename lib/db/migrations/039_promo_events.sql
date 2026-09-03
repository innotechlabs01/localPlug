-- Promotional events / banners (dynamic landing content, manageable from admin)
CREATE TABLE IF NOT EXISTS promo_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    tag TEXT,
    description TEXT,
    highlights TEXT, -- JSON array of strings
    cta_text TEXT,
    cta_href TEXT DEFAULT '/booking',
    image TEXT,
    placement TEXT NOT NULL DEFAULT 'section', -- 'hero_banner' | 'section'
    active INTEGER NOT NULL DEFAULT 1,
    start_date TEXT,
    end_date TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed the Feria de las Flores 2026 event exactly as it exists in the landing today,
-- so the public site renders identically after migration. Deactivate from admin to hide.
INSERT OR IGNORE INTO promo_events (slug, title, tag, description, highlights, cta_text, cta_href, image, placement, active)
VALUES (
    'feria-flores-2026',
    'Vive la Fiesta de las Flores más Grande del Mundo',
    'Feria de las Flores 2026',
    'Cada agosto, Medellín se transforma en un mar de color durante la Feria de las Flores. Disfruta del legendario Desfile de Silleteros, visita fincas floricultoras y sumérgete en la cultura que la convierte en la #1 de Sudamérica.',
    '["Desfile de Silleteros — el icónico desfile de flores","Tours por fincas floricultoras","Cultura y color en toda la ciudad","Experiencias premium con conductor privado"]',
    'Reserva tu Experiencia Feria',
    '/booking',
    '/images/experiences-7.jpg',
    'section',
    1
);