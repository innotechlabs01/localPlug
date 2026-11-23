import { z } from 'zod'

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, {
  message: 'Invalid phone number (E.164 format, e.g., +573001234567)',
})

export type Phone = z.infer<typeof phoneSchema>