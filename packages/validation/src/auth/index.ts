// Auth validation schemas
import { z } from 'zod'
import { emailSchema } from '../common/email'
import { phoneSchema } from '../common/phone'

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phone: phoneSchema.optional(),
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
})

export const webhookAuthSchema = z.object({
  clerkId: z.string().min(1),
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'concierge', 'viewer', 'driver', 'customer']),
  hotelId: z.number().int().positive().optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
export type WebhookAuthInput = z.infer<typeof webhookAuthSchema>