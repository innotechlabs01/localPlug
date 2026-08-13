import { NextResponse } from 'next/server'
import { Webhooks } from '@polar-sh/nextjs'
import { getDb } from '@/lib/db'
import { getPlatformFeePercent } from '@/lib/config'
import { logger } from '@/lib/logger'

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',
  onOrderPaid: async (payload) => {
    try {
      const order = payload.data as Record<string, unknown>
      const metadata = order.metadata as Record<string, string> | undefined
      const bookingReference = metadata?.booking_reference

      if (!bookingReference) {
        logger.warn('[Polar Webhook] order.paid missing booking_reference', { orderId: order.id as string })
        return
      }

      const db = getDb()
      const now = new Date().toISOString()
      const totalAmount = (order.amount as number) || 0

      const feeRate = await getPlatformFeePercent()

      let platformFeeCents = 0
      let hotelPayoutCents = 0
      let splitStatus = 'pending'

      const orderCheck = await db.execute({
        sql: `SELECT is_hotel_booking, hotel_commission_rate FROM orders WHERE booking_reference = ?`,
        args: [bookingReference],
      })
      const isHotelBooking = orderCheck.rows.length > 0 && Number(orderCheck.rows[0].is_hotel_booking) === 1
      const hotelCommissionRate = isHotelBooking ? (Number(orderCheck.rows[0].hotel_commission_rate) || 0.10) : 0

      if (totalAmount && totalAmount > 0) {
        if (isHotelBooking && hotelCommissionRate > 0) {
          hotelPayoutCents = Math.round(totalAmount / (1 + hotelCommissionRate))
          platformFeeCents = totalAmount - hotelPayoutCents
        } else {
          platformFeeCents = Math.round(totalAmount * feeRate)
          hotelPayoutCents = 0
        }
        splitStatus = 'completed'
      }

      // Update payment status
      await db.execute({
        sql: `UPDATE payments SET
          status = 'completed',
          paddle_webhook_event_id = ?,
          platform_fee_cents = ?,
          hotel_payout_cents = ?,
          split_status = ?,
          updated_at = ?
        WHERE booking_reference = ? AND status = 'pending'`,
        args: [
          (order.id as string),
          platformFeeCents,
          hotelPayoutCents,
          splitStatus,
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
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
        await db.execute({
          sql: `INSERT INTO orders (
            order_number, booking_reference, customer_name, customer_email,
            package_id, package_name, package_price, currency,
            status, payment_status, dispatch_status,
            flight_number, airline, arrival_date, arrival_time,
            destination_address, additional_trips, num_people,
            return_date, return_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            orderNumber,
            bookingReference,
            metadata.customer_name || ((order.customer as Record<string, unknown>)?.name as string) || null,
            metadata.customer_email || ((order.customer as Record<string, unknown>)?.email as string) || null,
            metadata.package_id || '',
            metadata.package_name || '',
            totalAmount,
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
        // Order exists — confirm it
        await db.execute({
          sql: `UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = ? WHERE booking_reference = ?`,
          args: [now, bookingReference],
        })
      }

      logger.info('[Polar Webhook] order.paid processed', {
        orderId: order.id as string,
        bookingReference,
        totalAmount,
        platformFeeCents,
        hotelPayoutCents,
      })
    } catch (err) {
      logger.error('[Polar Webhook] order.paid failed', err instanceof Error ? err : undefined)
    }
  },
  onPayload: async (payload) => {
    logger.info('[Polar Webhook] Event received', { type: payload.type, id: (payload.data as Record<string, unknown>)?.id as string })
  },
})
