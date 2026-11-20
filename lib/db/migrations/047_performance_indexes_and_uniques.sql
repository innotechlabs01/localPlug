-- Performance & integrity indexes for LocalPlug (orders, payments, rooms, assignments, outbox, payouts)

-- 1. Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_clerk_created
  ON orders(clerk_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_hotel_booking_arrival
  ON orders(hotel_id, is_hotel_booking, arrival_date, arrival_time);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_airline_flight_lower
  ON orders(LOWER(airline), LOWER(flight_number));

-- 2. Payments indexes (Polar webhook deduplication + revenue analytics)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_polar_event_unique
  ON payments(polar_webhook_event_id)
  WHERE polar_webhook_event_id IS NOT NULL AND polar_webhook_event_id != '';

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments(status, created_at);

-- 3. Room bookings overlap check index
CREATE INDEX IF NOT EXISTS idx_room_bookings_room_status_dates
  ON room_bookings(room_id, status, check_in, check_out);

-- 4. Assignments availability, history & active order uniqueness
CREATE INDEX IF NOT EXISTS idx_assignments_driver_status_block
  ON assignments(driver_id, status, block_until);

CREATE INDEX IF NOT EXISTS idx_assignments_driver_created
  ON assignments(driver_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_active_order_unique
  ON assignments(order_id)
  WHERE status IN ('pending_acceptance', 'accepted', 'confirmed_to_client', 'en_route', 'in_progress');

-- 5. Events outbox worker queue index
CREATE INDEX IF NOT EXISTS idx_events_outbox_pending_queue
  ON events_outbox(status, retry_count, id);
