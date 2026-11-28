import { createPolar } from '@polar-sh/sdk/2026-04'
import type { DatabaseClient } from '@lp/db/factory'
import { getDb } from '@/lib/db'

export type RideRefundResult = {
  ok: boolean
  refundId: string | null
}

function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN || ''
  if (!accessToken) throw new Error('POLAR_ACCESS_TOKEN is not configured')
  return createPolar({
    accessToken,
    environment: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
  })
}

function isAlreadyRefunded(err: unknown): boolean {
  const e = err as {
    statusCode?: number
    error?: {
      error?: string
      type?: string
      code?: string
      detail?: string | Array<{ msg?: string; detail?: string }>
    }
    type?: string
    detail?: string | Array<{ msg?: string; detail?: string }>
  } | null
  const code = String(e?.error?.error || e?.error?.type || e?.error?.code || e?.type || '').toLowerCase()
  const details: string[] = []
  for (const value of [e?.error?.detail, e?.detail]) {
    if (Array.isArray(value)) {
      for (const item of value) {
        details.push(String(item?.msg || item?.detail || '').toLowerCase())
      }
    } else if (value) {
      details.push(String(value).toLowerCase())
    }
  }

  if (code.includes('refundedalread') || code.includes('refunded_already')) return true
  if (details.some(value => value.includes('already fully refunded'))) return true

  // Polar returns a 422 PolarRequestValidationError (not RefundedAlready) when a
  // sweep retries a full refund that already succeeded. Treat it as idempotent.
  return (
    e?.statusCode === 422 &&
    code.includes('polarrequestvalidationerror') &&
    details.some(value => value.includes('refund amount exceeds refundable amount'))
  )
}

/**
 * Refund a captured on-demand ride. Safe to call on every sweep: Polar rejects
 * a duplicate refund, and that rejection is treated as success so the local
 * order can be marked refunded.
 */
export async function refundPaidRide(
  db: DatabaseClient = getDb(),
  args: { bookingReference: string },
): Promise<RideRefundResult> {
  try {
    const paymentRes = await db.execute({
      sql: `SELECT amount, status, polar_transaction_id, provider_transaction_id
            FROM payments WHERE booking_reference = ? LIMIT 1`,
      args: [args.bookingReference],
    })
    const payment = paymentRes.rows[0] as Record<string, unknown> | undefined
    if (!payment) return { ok: false, refundId: null }
    if (String(payment.status) === 'refunded') return { ok: true, refundId: null }

    const orderId = String(payment.provider_transaction_id || payment.polar_transaction_id || '')
    const amountCents = Math.round(Number(payment.amount || 0))
    if (!orderId || amountCents < 1) return { ok: false, refundId: null }

    const refund = await getPolarClient().refunds.create({
      order_id: orderId,
      amount: amountCents,
      reason: 'service_disruption',
      comment: 'On-demand ride auto-cancelled: no driver accepted the offer',
      metadata: {
        booking_reference: args.bookingReference,
        source: 'auto_cancel_no_driver',
      },
    })

    return { ok: true, refundId: String(refund.id || `refund-${Date.now()}`) }
  } catch (err) {
    if (isAlreadyRefunded(err)) return { ok: true, refundId: null }
    console.error('[Ride Refund] failed', err instanceof Error ? err.message : err)
    return { ok: false, refundId: null }
  }
}
