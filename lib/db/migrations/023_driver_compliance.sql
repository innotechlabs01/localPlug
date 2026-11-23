-- Migration: Add driver compliance and document tracking columns
-- Phase 2 of Spec 012: Document Compliance

ALTER TABLE drivers ADD COLUMN license_expiry TEXT;
ALTER TABLE drivers ADD COLUMN soat_expiry TEXT;
ALTER TABLE drivers ADD COLUMN tech_inspection_expiry TEXT;
ALTER TABLE drivers ADD COLUMN insurance_expiry TEXT;
ALTER TABLE drivers ADD COLUMN doc_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN compliance_score INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN last_compliance_check TEXT;
ALTER TABLE drivers ADD COLUMN emergency_contact TEXT;
ALTER TABLE drivers ADD COLUMN emergency_phone TEXT;
ALTER TABLE drivers ADD COLUMN vehicle_year INTEGER;
ALTER TABLE drivers ADD COLUMN vehicle_capacity TEXT;
ALTER TABLE drivers ADD COLUMN city TEXT DEFAULT 'Medellín';
ALTER TABLE drivers ADD COLUMN experience_level TEXT DEFAULT 'standard';
ALTER TABLE drivers ADD COLUMN photo_url TEXT;
ALTER TABLE drivers ADD COLUMN internal_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_drivers_doc_status ON drivers(doc_status);
CREATE INDEX IF NOT EXISTS idx_drivers_compliance_score ON drivers(compliance_score);
