import { getDb } from '@/lib/db'
import { registerOutboxConsumer, runIdempotentConsumer } from '@/lib/events-outbox'
import { sendOrQueueWhatsApp, triggerPaymentConfirmation } from '@/lib/n8n/client'
import { sendEmail } from '@/lib/email'

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

    // 1b. Decoupled WhatsApp & Email confirmation for booking.created
    await runIdempotentConsumer(event.id, 'booking-created-notifications', async () => {
      const p = event.payload
      const customerName = String(p.customer_name || '')
      const customerEmail = String(p.customer_email || '')
      const customerPhone = String(p.customer_phone || '')
      const orderNumber = String(p.order_number || '')
      const bookingRef = String(p.booking_reference || '')
      const packageName = String(p.package_name || '')
      const packagePrice = Number(p.package_price || 0)
      const arrivalDate = String(p.arrival_date || '-')
      const arrivalTime = String(p.arrival_time || '')
      const flightNumber = String(p.flight_number || '-')
      const destAddress = String(p.destination_address || '-')
      const lang = String(p.customer_language || 'es').toLowerCase()

      const msgEs = `Hola ${customerName}! Reserva ${orderNumber} creada.\nPaquete: ${packageName}\nLlegada: ${arrivalDate} ${arrivalTime}\nVuelo: ${flightNumber}\nDestino: ${destAddress}\nPrecio: ${packagePrice.toFixed(2)} USD\nRef: ${bookingRef}\nVer: https://www.medellinpremium.com/mis-reservas\nTe contactamos para confirmar pago.`
      const msgEn = `Hi ${customerName}! Booking ${orderNumber} created.\nPackage: ${packageName}\nArrival: ${arrivalDate} ${arrivalTime}\nFlight: ${flightNumber}\nDestination: ${destAddress}\nPrice: ${packagePrice.toFixed(2)} USD\nRef: ${bookingRef}\nView: https://www.medellinpremium.com/mis-reservas\nWe'll contact you to confirm payment.`

      if (customerPhone && customerName) {
        await sendOrQueueWhatsApp({
          number: customerPhone,
          message: lang.startsWith('en') ? msgEn : msgEs,
        }).catch((err) => {
          console.error('[EventConsumer:booking.created] WhatsApp failed:', err)
        })
      }

      if (customerEmail) {
        const subjectEs = `Confirmación de reserva ${orderNumber} - Medellín Premium`
        const subjectEn = `Booking confirmation ${orderNumber} - Medellín Premium`
        const htmlEs = `
          <h2>¡Reserva creada con éxito!</h2>
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>Tu reserva ha sido registrada en Medellín Premium.</p>
          <ul>
            <li><strong>Referencia:</strong> ${bookingRef} (${orderNumber})</li>
            <li><strong>Paquete:</strong> ${packageName}</li>
            <li><strong>Llegada:</strong> ${arrivalDate} ${arrivalTime}</li>
            <li><strong>Vuelo:</strong> ${flightNumber}</li>
            <li><strong>Destino:</strong> ${destAddress}</li>
            <li><strong>Precio:</strong> ${packagePrice.toFixed(2)} USD</li>
          </ul>
          <p>Te contactaremos por WhatsApp para confirmar el pago y los detalles de tu llegada.</p>
          <p><a href="https://www.medellinpremium.com/mis-reservas">Ver mis reservas</a></p>
        `
        const htmlEn = `
          <h2>Booking created successfully!</h2>
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>Your booking has been registered with Medellín Premium.</p>
          <ul>
            <li><strong>Reference:</strong> ${bookingRef} (${orderNumber})</li>
            <li><strong>Package:</strong> ${packageName}</li>
            <li><strong>Arrival:</strong> ${arrivalDate} ${arrivalTime}</li>
            <li><strong>Flight:</strong> ${flightNumber}</li>
            <li><strong>Destination:</strong> ${destAddress}</li>
            <li><strong>Price:</strong> ${packagePrice.toFixed(2)} USD</li>
          </ul>
          <p>We will contact you via WhatsApp to confirm payment and arrival details.</p>
          <p><a href="https://www.medellinpremium.com/mis-reservas">View my bookings</a></p>
        `
        await sendEmail({
          to: customerEmail,
          subject: lang.startsWith('en') ? subjectEn : subjectEs,
          html: lang.startsWith('en') ? htmlEn : htmlEs,
          text: lang.startsWith('en') ? msgEn : msgEs,
          bookingReference: bookingRef,
        }).catch((err) => {
          console.error('[EventConsumer:booking.created] Email failed:', err)
        })
      }
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

    // 2b. Decoupled WhatsApp payment confirmation
    await runIdempotentConsumer(event.id, 'payment-completed-notifications', async () => {
      const p = event.payload
      const bookingReference = typeof p.booking_reference === 'string' ? p.booking_reference : ''
      if (!bookingReference) return

      let customerName = String(p.customer_name || '')
      let customerEmail = String(p.customer_email || '')
      let customerPhone = String(p.customer_phone || '')
      let packageName = String(p.package_name || '')
      let amountCents = Number(p.amount_cents || Math.round(Number(p.amount_usd || 0) * 100))
      let flightNumber = String(p.flight_number || '')
      let airline = String(p.airline || '')
      let arrivalDate = String(p.arrival_date || '')
      let arrivalTime = String(p.arrival_time || '')

      if (!customerPhone) {
        const db = getDb()
        const orderRes = await db.execute({
          sql: `SELECT customer_name, customer_email, customer_phone, package_name, package_price, flight_number, airline, arrival_date, arrival_time
                FROM orders WHERE booking_reference = ? LIMIT 1`,
          args: [bookingReference],
        })
        const row = orderRes.rows[0] as any
        if (row) {
          customerName = customerName || String(row.customer_name || '')
          customerEmail = customerEmail || String(row.customer_email || '')
          customerPhone = String(row.customer_phone || '')
          packageName = packageName || String(row.package_name || '')
          if (!amountCents && row.package_price) amountCents = Math.round(Number(row.package_price) * 100)
          flightNumber = flightNumber || String(row.flight_number || '')
          airline = airline || String(row.airline || '')
          arrivalDate = arrivalDate || String(row.arrival_date || '')
          arrivalTime = arrivalTime || String(row.arrival_time || '')
        }
      }

      if (customerPhone) {
        await triggerPaymentConfirmation({
          bookingReference,
          customerName,
          customerEmail,
          customerPhone,
          packageName,
          amount: amountCents,
          flightNumber,
          airline,
          arrivalDate,
          arrivalTime,
        }).catch((err) => {
          console.error('[EventConsumer:payment.completed] WhatsApp failed:', err)
        })
      }
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
