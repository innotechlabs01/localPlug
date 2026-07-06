import { getDb } from '@/lib/db'
import type { PaymentRecord } from '@/lib/payment-record'

export async function getPayment(bookingReference: string): Promise<PaymentRecord | null> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM payments WHERE booking_reference = ?',
    args: [bookingReference],
  })

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    booking_reference: row.booking_reference as string,
    package_id: row.package_id as string,
    package_name: row.package_name as string,
    amount: row.amount as number,
    currency: row.currency as string,
    status: row.status as PaymentRecord['status'],
    paddle_transaction_id: (row.paddle_transaction_id as string) || (row.transaction_id as string) || '',
    paddle_webhook_event_id: (row.paddle_webhook_event_id as string) || (row.webhook_event_id as string) || '',
    customer_email: row.customer_email as string,
    customer_name: row.customer_name as string,
    customer_phone: (row.customer_phone as string) || '',
    error_message: row.error_message as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export async function setPayment(record: PaymentRecord): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT OR REPLACE INTO payments 
      (booking_reference, package_id, package_name, amount, currency, status, 
       paddle_transaction_id, paddle_webhook_event_id, customer_email, customer_name,
       customer_phone, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.booking_reference,
      record.package_id,
      record.package_name,
      record.amount,
      record.currency,
      record.status,
      record.paddle_transaction_id,
      record.paddle_webhook_event_id || null,
      record.customer_email,
      record.customer_name,
      record.customer_phone || null,
      record.error_message || null,
      record.created_at,
      record.updated_at,
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
