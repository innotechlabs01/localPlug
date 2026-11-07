import { z } from 'zod'
import { nonEmptyStringSchema } from './primitives'
import { coordinatesSchema } from './coordinates'

export const addressSchema = z.object({
  street: nonEmptyStringSchema,
  city: nonEmptyStringSchema,
  state: nonEmptyStringSchema.optional(),
  country: nonEmptyStringSchema,
  postalCode: nonEmptyStringSchema.optional(),
  coordinates: coordinatesSchema.optional(),
})

export type Address = z.infer<typeof addressSchema>