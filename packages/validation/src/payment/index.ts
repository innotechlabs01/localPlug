// Payment validation schemas
import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  nonEmptyStringSchema,
  amountCentsSchema,
  currencyCodeSchema,
  metadataSchema,
} from '../common'

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled',
])

export const paymentProviderSchema = z.enum(['paddle', 'stripe', 'cash', 'transfer'])

export const paymentTypeSchema = z.enum(['booking', 'experience', 'subscription', 'penalty', 'adjustment'])

export const createPaymentSchema = z.object({
  bookingId: uuidSchema,
  amount: amountCentsSchema,
  currency: currencyCodeSchema.default('USD'),
  provider: paymentProviderSchema,
  type: paymentTypeSchema.default('booking'),
  description: nonEmptyStringSchema.max(200),
  customerEmail: emailSchema,
  customerName: nonEmptyStringSchema,
  metadata: metadataSchema,
})

export const processPaymentSchema = z.object({
  paymentId: uuidSchema,
  providerPaymentId: nonEmptyStringSchema,
  providerData: metadataSchema,
})

export const refundPaymentSchema = z.object({
  paymentId: uuidSchema,
  amount: amountCentsSchema.optional(), // partial refund if specified
  reason: nonEmptyStringSchema.max(500),
  refundToOriginal: z.boolean().default(true),
})

export const paymentQuerySchema = z.object({
  status: paymentStatusSchema.optional(),
  provider: paymentProviderSchema.optional(),
  type: paymentTypeSchema.optional(),
  bookingId: uuidSchema.optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: amountCentsSchema.optional(),
  maxAmount: amountCentsSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})

export const paddleWebhookSchema = z.object({
  event_type: z.string(),
  data: z.object({
    order_id: z.string(),
    customer_id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    custom_data: metadataSchema,
  }),
})

export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type PaymentProvider = z.infer<typeof paymentProviderSchema>
export type PaymentType = z.infer<typeof paymentTypeSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>
export type PaymentQuery = z.infer<typeof paymentQuerySchema>
export type PaddleWebhook = z.infer<typeof paddleWebhookSchema>