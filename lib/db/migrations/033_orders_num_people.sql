-- Migration: Add num_people column to orders for per-person tour pricing
ALTER TABLE orders ADD COLUMN num_people INTEGER DEFAULT 1;
