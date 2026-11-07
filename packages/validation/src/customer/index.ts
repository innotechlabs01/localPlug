// Customer validation schemas
import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  nonEmptyStringSchema,
  coordinatesSchema,
  addressSchema,
  metadataSchema,
  paginationQuerySchema,
} from '../common'

export const customerSourceSchema = z.enum(['organic', 'referral', 'advertising', 'social', 'partner', 'admin'])

export const customerStatusSchema = z.enum(['active', 'inactive', 'blocked', 'pending_verification'])

export const createCustomerSchema = z.object({
  email: emailSchema,
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  firstName: nonEmptyStringSchema.max(50),
  lastName: nonEmptyStringSchema.max(50),
  preferredLanguage: z.enum(['en', 'es']).default('en'),
  timezone: z.string().optional(),
  source: customerSourceSchema.default('organic'),
  referralCode: z.string().max(20).optional(),
  metadata: metadataSchema,
})

export const updateCustomerSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  preferredLanguage: z.enum(['en', 'es']).optional(),
  timezone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
  metadata: metadataSchema,
}).partial()

export const customerQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['active', 'inactive', 'blocked', 'pending_verification']).optional(),
  source: z.enum(['organic', 'referral', 'advertising', 'social', 'partner', 'admin']).optional(),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  hasBookings: z.boolean().optional(),
})

export const customerPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
  }).default(() => ({
    email: true,
    sms: false,
    push: true,
    whatsapp: false,
  })),
  preferredVehicleType: z.enum(['sedan', 'suv', 'van', 'luxury']).optional(),
  specialRequirements: z.string().max(500).optional(),
  accessibilityNeeds: z.string().max(500).optional(),
})

export const addressBookEntrySchema = z.object({
  id: uuidSchema.optional(),
  label: nonEmptyStringSchema.max(50),
  address: addressSchema,
  isDefault: z.boolean().default(false),
})

export type CustomerSource = z.infer<typeof customerSourceSchema>
export type CustomerStatus = z.infer<typeof customerStatusSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerQuery = z.infer<typeof customerQuerySchema>
export type CustomerPreferences = z.infer<typeof customerPreferencesSchema>
export type AddressBookEntry = z.infer<typeof addressBookEntrySchema>