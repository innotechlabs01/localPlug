import { z } from 'zod'

// ISO date string (YYYY-MM-DD)
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
})

// Alias for clarity
export const isoDateSchema = dateStringSchema

// ISO datetime string
export const dateTimeStringSchema = z.string().datetime({ offset: true })

// Time format HH:mm
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: 'Time must be in HH:mm format',
})

// Date range
export const dateRangeSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
}).refine((data) => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['end'],
})

export type DateString = z.infer<typeof dateStringSchema>
export type DateTimeString = z.infer<typeof dateTimeStringSchema>
export type TimeString = z.infer<typeof timeSchema>
export type DateRange = z.infer<typeof dateRangeSchema>