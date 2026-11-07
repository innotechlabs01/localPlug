// Notification validation schemas
import { z } from 'zod'
import {
  uuidSchema,
  nonEmptyStringSchema,
  emailSchema,
  metadataSchema,
} from '../common'

export const notificationChannelSchema = z.enum(['email', 'sms', 'push', 'whatsapp', 'in_app'])

export const notificationTypeSchema = z.enum([
  'booking_created',
  'booking_confirmed',
  'booking_reminder',
  'booking_cancelled',
  'driver_assigned',
  'driver_arrived',
  'trip_started',
  'trip_completed',
  'payment_received',
  'payment_failed',
  'review_request',
  'system_alert',
  'promotion',
])

export const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

export const createNotificationSchema = z.object({
  userId: uuidSchema.optional(), // if null, broadcast
  channel: notificationChannelSchema,
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('normal'),
  title: nonEmptyStringSchema.max(100),
  body: nonEmptyStringSchema.max(1000),
  data: metadataSchema,
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  dedupKey: nonEmptyStringSchema.max(100).optional(),
})

export const batchNotificationSchema = z.object({
  userIds: z.array(uuidSchema).min(1).max(1000),
  channel: notificationChannelSchema,
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('normal'),
  title: nonEmptyStringSchema.max(100),
  body: nonEmptyStringSchema.max(1000),
  data: metadataSchema,
  scheduledAt: z.string().datetime().optional(),
})

export const notificationQuerySchema = z.object({
  userId: uuidSchema.optional(),
  channel: notificationChannelSchema.optional(),
  type: notificationTypeSchema.optional(),
  read: z.boolean().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})

export const whatsappTemplateSchema = z.object({
  name: nonEmptyStringSchema,
  language: z.string().length(2).default('es'),
  components: z.array(z.object({
    type: z.enum(['header', 'body', 'footer', 'button']),
    text: nonEmptyStringSchema.optional(),
    parameters: z.array(z.object({
      type: z.enum(['text', 'currency', 'date_time']),
      text: z.string().optional(),
      currency: z.object({
        fallback_value: z.string(),
        code: z.string().length(3),
        amount_1000: z.number().int(),
      }).optional(),
      date_time: z.object({
        fallback_value: z.string(),
      }).optional(),
    })).optional(),
  })),
})

export type NotificationChannel = z.infer<typeof notificationChannelSchema>
export type NotificationType = z.infer<typeof notificationTypeSchema>
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type BatchNotificationInput = z.infer<typeof batchNotificationSchema>
export type NotificationQuery = z.infer<typeof notificationQuerySchema>
export type WhatsAppTemplate = z.infer<typeof whatsappTemplateSchema>