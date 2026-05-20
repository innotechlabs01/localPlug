import { getDb } from '@/lib/db'
import type { PaymentRecord } from './types'

export async function getPayment(bookingReference: string): Promise<PaymentRecord | null> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM payments WHERE booking_reference = ?',
    args: [bookingReference],
  })

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    bookingReference: row.booking_reference as string,
    packageId: row.package_id as string,
    packageName: row.package_name as string,
    amount: row.amount as number,
    currency: row.currency as string,
    status: row.status as PaymentRecord['status'],
    stripePaymentIntentId: row.stripe_payment_intent_id as string,
    stripeWebhookEventId: row.stripe_webhook_event_id as string | undefined,
    customerEmail: row.customer_email as string,
    customerName: row.customer_name as string,
    customerPhone: (row.customer_phone as string) || undefined,

    errorMessage: row.error_message as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function setPayment(record: PaymentRecord): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT OR REPLACE INTO payments 
      (booking_reference, package_id, package_name, amount, currency, status, 
       stripe_payment_intent_id, stripe_webhook_event_id, customer_email, customer_name,
       customer_phone, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.bookingReference,
      record.packageId,
      record.packageName,
      record.amount,
      record.currency,
      record.status,
      record.stripePaymentIntentId,
      record.stripeWebhookEventId || null,
      record.customerEmail,
      record.customerName,
      record.customerPhone || null,
      record.errorMessage || null,
      record.createdAt,
      record.updatedAt,
    ],
  })
}

export async function hasPayment(bookingReference: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT 1 FROM payments WHERE booking_reference = ?',
    args: [bookingReference],
  })
  return result.rows.length > 0
}

export async function hasCompletedPayment(bookingReference: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT 1 FROM payments WHERE booking_reference = ? AND status = ?',
    args: [bookingReference, 'completed'],
  })
  return result.rows.length > 0
}

export async function hasPendingPayment(bookingReference: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT 1 FROM payments WHERE booking_reference = ? AND status = ?',
    args: [bookingReference, 'pending'],
  })
  return result.rows.length > 0
}
