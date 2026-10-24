-- Migration: Add missing columns to orders for complete booking data capture
-- customer_language: idioma del cliente para comunicación posterior
-- customer_language_code: código ISO del idioma (es, en, pt, etc.)
ALTER TABLE orders ADD COLUMN customer_language TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN customer_language_code TEXT DEFAULT NULL;

-- Index for language-based queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_language ON orders(customer_language);
