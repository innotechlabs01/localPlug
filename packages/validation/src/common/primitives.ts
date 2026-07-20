import { z } from 'zod'

export const nonEmptyStringSchema = z.string().min(1, { message: 'Cannot be empty' })

export const positiveIntSchema = z.number().int().positive({ message: 'Must be a positive integer' })

export const amountCentsSchema = z.number().int().nonnegative({ message: 'Amount in cents must be a non-negative integer' })

export type NonEmptyString = z.infer<typeof nonEmptyStringSchema>
export type PositiveInt = z.infer<typeof positiveIntSchema>
export type AmountCents = z.infer<typeof amountCentsSchema>