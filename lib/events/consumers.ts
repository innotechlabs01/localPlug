import { getDb } from '@/lib/db'
import { registerOutboxConsumer, runIdempotentConsumer } from '@/lib/events-outbox'

let _registered = false

/**
 * Registers idempotent domain event consumers for LocalPlug:
 * - booking.created / payment.completed -> sync customer record
 * - driver.trip_completed -> post-trip log / analytics hook
 * - chat.escalated -> escalation audit hook
 */
export function registerDefaultOutboxConsumers(): void {
  if (_registered) return
  _registered = true

  // 1. Customer CRM sync on booking creation
  registerOutboxConsumer('booking.created', async (event) => {
    await runIdempotentConsumer(event.id, 'crm-customer-sync-booking', async () => {
      const email = typeof event.payload.customer_email === 'string' ? event.payload.customer_email.trim().toLowerCase() : ''
      if (!email) return
      const db = getDb()
      await db.execute({
        sql: `INSERT OR IGNORE INTO customers (name, email, phone, total_trips, lifetime_value, first_trip_date, last_trip_date, created_at, updated_at)
              VALUES (?, ?, ?, 1, ?, date('now'), date('now'), datetime('now'), datetime('now'))`,
        args: [
          String(event.payload.customer_name || 'Guest'),
          email,
          event.payload.customer_phone ? String(event.payload.customer_phone) : null,
          Number(event.payload.package_price || 0),
        ],
      }).catch(() => {})
    })
  })

  // 2. Customer lifetime value update on payment completed
  registerOutboxConsumer('payment.completed', async (event) => {
    await runIdempotentConsumer(event.id, 'crm-customer-sync-payment', async () => {
      const bookingRef = typeof event.payload.booking_reference === 'string' ? event.payload.booking_reference : ''
      if (!bookingRef) return
      const db = getDb()
      const orderRes = await db.execute({
        sql: `SELECT customer_name, customer_email, customer_phone FROM orders WHERE booking_reference = ? LIMIT 1`,
        args: [bookingRef],
      })
      const order = orderRes.rows[0] as any
      if (!order?.customer_email) return
      const email = String(order.customer_email).trim().toLowerCase()
      const amountUsd = Number(event.payload.amount_usd || 0)
      await db.execute({
        sql: `INSERT INTO customers (name, email, phone, total_trips, lifetime_value, first_trip_date, last_trip_date, created_at, updated_at)
              VALUES (?, ?, ?, 1, ?, date('now'), date('now'), datetime('now'), datetime('now'))
              ON CONFLICT(email) DO UPDATE SET
                lifetime_value = COALESCE(lifetime_value, 0) + excluded.lifetime_value,
                last_trip_date = date('now'),
                updated_at = datetime('now')`,
        args: [String(order.customer_name || 'Guest'), email, order.customer_phone || null, amountUsd],
      }).catch(() => {})
    })
  })

  // 3. Trip completed operational log
  registerOutboxConsumer('driver.trip_completed', async (event) => {
    await runIdempotentConsumer(event.id, 'trip-completed-metrics', async () => {
      console.log('[EventConsumer] driver.trip_completed processed', {
        eventId: event.id,
        orderId: event.payload.order_id,
        driverId: event.payload.driver_id,
      })
    })
  })

  // 4. Chat escalated operational log
  registerOutboxConsumer('chat.escalated', async (event) => {
    await runIdempotentConsumer(event.id, 'chat-escalated-alert', async () => {
      console.log('[EventConsumer] chat.escalated processed', {
        eventId: event.id,
        conversationId: event.payload.conversation_id,
      })
    })
  })
}
