import { NextResponse } from 'next/server'
import { Webhooks } from '@polar-sh/nextjs'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { triggerPaymentConfirmation } from '@/lib/n8n/client'
import { processBookingRefund } from '@/lib/payout'
import { emitEvent } from '@/lib/events-outbox'

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',
  onOrderPaid: async (payload) => {
    try {
      const order = payload.data as Record<string, unknown>
      const metadata = order.metadata as Record<string, string> | undefined
      const bookingReference = metadata?.booking_reference
      const webhookEventId = order.id as string

      if (!bookingReference) {
        logger.warn('[Polar Webhook] order.paid missing booking_reference', { orderId: webhookEventId })
        return
      }

      const db = getDb()

      // Deduplication: skip if this webhook event was already processed
      if (webhookEventId) {
        const existingEvent = await db.execute({
          sql: `SELECT 1 FROM payments WHERE paddle_webhook_event_id = ? AND status = 'completed' LIMIT 1`,
          args: [webhookEventId],
        })
        if (existingEvent.rows.length > 0) {
          logger.info('[Polar Webhook] Duplicate event, skipping', { webhookEventId, bookingReference })
          return
        }
      }

      const now = new Date().toISOString()

      // Source of truth: the amount recorded at checkout time.
      // The webhook payload can omit `amount` (observed in production), so never
      // trust it alone — fall back to the stored payment amount.
      const storedPayment = await db.execute({
        sql: `SELECT amount, customer_phone FROM payments WHERE booking_reference = ? LIMIT 1`,
        args: [bookingReference],
      })
      const storedAmount = storedPayment.rows.length > 0 ? Number(storedPayment.rows[0].amount) : 0
      const storedPhone = storedPayment.rows.length > 0 ? (storedPayment.rows[0].customer_phone as string || '') : ''
      const payloadAmount = (order.amount as number) || 0
      const totalAmount = storedAmount > 0 ? storedAmount : payloadAmount

      if (storedAmount > 0 && payloadAmount && storedAmount !== payloadAmount) {
        logger.error('[Polar Webhook] Amount mismatch — possible tampering', undefined, {
          webhookAmount: payloadAmount,
          storedAmount,
          bookingReference,
          webhookEventId,
        })
        // Still process but log the discrepancy — a real fix requires investigation
      }

      // Update payment status. Splits (platform fee / hotel payout / driver fare)
      // are NO LONGER computed here — payout liabilities accrue separately in the
      // payout ledger at their milestone (driver on trip complete, hotel on check-in).
      await db.execute({
        sql: `UPDATE payments SET
          status = 'completed',
          paddle_webhook_event_id = ?,
          updated_at = ?
        WHERE booking_reference = ? AND status = 'pending'`,
        args: [
          (order.id as string),
          now,
          bookingReference,
        ],
      })

      // Create order if it doesn't exist yet (race condition: webhook fires before POST /api/booking)
      const existingOrder = await db.execute({
        sql: `SELECT id FROM orders WHERE booking_reference = ?`,
        args: [bookingReference],
      })

      if (existingOrder.rows.length === 0 && metadata) {
        // Note: payments.amount / order.amount are in CENTS; orders.package_price is in USD.
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
        const customerPhone = metadata.customer_phone || storedPhone || null
        const customerCountry = (metadata.customer_country as string) || null
        await db.execute({
          sql: `INSERT INTO orders (
            order_number, booking_reference, customer_name, customer_email,
            customer_phone, customer_country, customer_notes,
            package_id, package_name, package_price, currency,
            status, payment_status, dispatch_status,
            flight_number, airline, arrival_date, arrival_time,
            destination_address, additional_trips, num_people,
            return_date, return_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            orderNumber,
            bookingReference,
            metadata.customer_name || ((order.customer as Record<string, unknown>)?.name as string) || null,
            metadata.customer_email || ((order.customer as Record<string, unknown>)?.email as string) || null,
            customerPhone,
            customerCountry,
            metadata.customer_notes || null,
            metadata.package_id || '',
            metadata.package_name || '',
            totalAmount / 100,
            'usd',
            'confirmed',
            'paid',
            'pending',
            metadata.flight_number || null,
            metadata.airline || null,
            metadata.arrival_date || null,
            metadata.arrival_time || null,
            metadata.destination_address || null,
            metadata.tour_ids || null,
            parseInt(metadata.num_people || '1', 10),
            metadata.return_date || null,
            metadata.return_time || null,
          ],
        })
        logger.info('[Polar Webhook] Order created from webhook', { bookingReference, orderNumber })
      } else {
        // Order exists — confirm it and BACKFILL fields the webhook can contribute
        // when the race left them empty (package_price 0, missing phone/country).
        // Do NOT overwrite values POST /api/booking already wrote correctly.
        const customerPhone = metadata?.customer_phone || storedPhone || null
        const invoicePriceUsd = totalAmount > 0 ? totalAmount / 100 : null
        await db.execute({
          sql: `UPDATE orders SET
            status = 'confirmed',
            payment_status = 'paid',
            package_price = CASE
              WHEN package_price IS NULL OR package_price = 0 THEN ?
              ELSE package_price END,
            customer_phone = CASE
              WHEN customer_phone IS NULL OR customer_phone = '' THEN ?
              ELSE customer_phone END,
            customer_country = CASE
              WHEN customer_country IS NULL OR customer_country = '' THEN ?
              ELSE customer_country END,
            customer_notes = CASE
              WHEN customer_notes IS NULL OR customer_notes = '' THEN ?
              ELSE customer_notes END,
            updated_at = ?
          WHERE booking_reference = ?`,
          args: [
            invoicePriceUsd,
            customerPhone,
            (metadata?.customer_country as string) || null,
            (metadata?.customer_notes as string) || null,
            now,
            bookingReference,
          ],
        })
        logger.info('[Polar Webhook] Order confirmed and backfilled', { bookingReference, invoicePriceUsd, customerPhone })
      }

      logger.info('[Polar Webhook] order.paid processed', {
        orderId: order.id as string,
        bookingReference,
        totalAmount,
      })

      // Realtime outbox — payment completed.
      emitEvent('payment.completed', {
        booking_reference: bookingReference,
        amount_usd: Math.round((totalAmount / 100) * 100) / 100,
      }, { correlationId: bookingReference }).catch(() => {})

      // Send WhatsApp confirmation to customer
      const customerName = metadata.customer_name || ((order.customer as Record<string, unknown>)?.name as string) || ''
      const customerEmail = metadata.customer_email || ((order.customer as Record<string, unknown>)?.email as string) || ''
      const customerPhone = metadata.customer_phone as string || ''
      const packageName = metadata.package_name || ''

      if (customerPhone) {
        triggerPaymentConfirmation({
          bookingReference,
          customerName,
          customerEmail,
          customerPhone,
          packageName,
          amount: totalAmount,
          flightNumber: metadata.flight_number || '',
          airline: metadata.airline || '',
          arrivalDate: metadata.arrival_date || '',
          arrivalTime: metadata.arrival_time || '',
        }).catch(err => logger.error('[Polar Webhook] WhatsApp notification failed', err instanceof Error ? err : undefined))
      }
    } catch (err) {
      logger.error('[Polar Webhook] order.paid failed', err instanceof Error ? err : undefined)
    }
  },
  onOrderRefunded: async (payload) => {
    try {
      const order = payload.data as Record<string, unknown>
      const metadata = (order.metadata as Record<string, string> | undefined) || {}
      const bookingReference = metadata.booking_reference
      const eventId = order.id as string
      if (!bookingReference) {
        logger.warn('[Polar Webhook] order.refunded missing booking_reference', { orderId: eventId })
        return
      }

      // refundedAmount is in cents (like the order amount at checkout).
      const refundedCents = Number((order.refundedAmount as number) || (order.refunded_amount as number) || 0)
      const amountUsd = Math.round((refundedCents / 100) * 100) / 100

      const outcome = await processBookingRefund({
        bookingReference,
        providerEventId: eventId,
        amountUsd,
      })
      logger.info('[Polar Webhook] order.refunded processed', {
        bookingReference,
        resolution: outcome.resolution,
        duplicate: outcome.duplicate,
        amountUsd,
      })

      emitEvent('payment.refunded', {
        booking_reference: bookingReference,
        amount_usd: amountUsd,
        resolution: outcome.resolution,
      }, { correlationId: bookingReference }).catch(() => {})

      // Pre-milestone → no liability exists; cancel associated services.
      if (outcome.resolution === 'pre_milestone') {
        const db = getDb()
        const orderRow = await db.execute({
          sql: `SELECT id FROM orders WHERE booking_reference = ?`,
          args: [bookingReference],
        })
        const orderId = orderRow.rows[0]?.id as number | undefined
        if (orderId) {
          await db.execute({
            sql: `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?`,
            args: [orderId],
          }).catch(() => {})
          await db.execute({
            sql: `UPDATE assignments SET status = 'cancelled', updated_at = datetime('now') WHERE order_id = ? AND status NOT IN ('completed')`,
            args: [orderId],
          }).catch(() => {})
          // Free booked room(s) for this order
          try {
            const rbs = await db.execute({
              sql: `SELECT room_id FROM room_bookings WHERE order_id = ? AND status IN ('confirmed', 'checked_in')`,
              args: [orderId],
            })
            for (const rb of rbs.rows) {
              const roomId = rb.room_id as number
              await db.execute({
                sql: `UPDATE rooms SET status = 'available', available_from = NULL, current_order_id = NULL, updated_at = datetime('now') WHERE id = ? AND current_order_id = ?`,
                args: [roomId, orderId],
              }).catch(() => {})
            }
            await db.execute({
              sql: `UPDATE room_bookings SET status = 'cancelled', updated_at = datetime('now') WHERE order_id = ? AND status IN ('confirmed', 'checked_in')`,
              args: [orderId],
            }).catch(() => {})
          } catch {}
        }
      }
    } catch (err) {
      logger.error('[Polar Webhook] order.refunded failed', err instanceof Error ? err : undefined)
    }
  },
  onPayload: async (payload) => {
    logger.info('[Polar Webhook] Event received', { type: payload.type, id: (payload.data as Record<string, unknown>)?.id as string })
  },
})
