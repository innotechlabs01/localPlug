// Common metadata schema
import { z } from 'zod'

export const metadataSchema = z.record(z.string(), z.unknown()).default({})

export type Metadata = z.infer<typeof metadataSchema>