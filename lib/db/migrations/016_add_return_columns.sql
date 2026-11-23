-- Migration: Add return_date and return_time columns to orders table
-- Used for customers who need return transport

ALTER TABLE orders ADD COLUMN return_date TEXT;
ALTER TABLE orders ADD COLUMN return_time TEXT;
