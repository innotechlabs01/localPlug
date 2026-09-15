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

-- No seed data. The landing starts with zero promo events (nothing rendered);
-- admins create events from /admin/events when they want to publish one.