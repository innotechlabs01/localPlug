-- Migration: Sync payment_status from payments table to orders table
-- Orders.payment_status was stuck at 'pending' while payments.status was 'completed'

UPDATE orders SET payment_status = 'paid', updated_at = datetime('now')
WHERE booking_reference IN (
  SELECT booking_reference FROM payments WHERE status = 'completed'
)
AND payment_status != 'paid';

UPDATE orders SET payment_status = 'failed', updated_at = datetime('now')
WHERE booking_reference IN (
  SELECT booking_reference FROM payments WHERE status = 'failed'
)
AND payment_status = 'pending';

UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now')
WHERE booking_reference IN (
  SELECT booking_reference FROM payments WHERE status = 'refunded'
)
AND payment_status != 'refunded';
