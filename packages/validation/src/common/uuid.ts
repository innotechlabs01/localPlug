import { z } from 'zod'

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' })

export type UUID = z.infer<typeof uuidSchema>