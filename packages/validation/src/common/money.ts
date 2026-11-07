import { z } from 'zod'

export const currencyCodeSchema = z.enum(['USD', 'COP', 'EUR'])

export const moneySchema = z.object({
  minorUnits: z.number().int(),
  currency: currencyCodeSchema,
})

export type Money = z.infer<typeof moneySchema>

export const moneyInputSchema = z.object({
  amount: z.number().positive(),
  currency: currencyCodeSchema.default('USD'),
})

export type MoneyInput = z.infer<typeof moneyInputSchema>