// Dispatch validation schemas
import { z } from 'zod'
import {
  uuidSchema,
  nonEmptyStringSchema,
  coordinatesSchema,
  addressSchema,
  metadataSchema,
  paginationQuerySchema,
  isoDateSchema,
  timeSchema,
} from '../common'

export const assignmentStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled',
  'completed',
])

export const assignmentTypeSchema = z.enum(['auto', 'manual', 'broadcast'])

export const createAssignmentSchema = z.object({
  bookingId: uuidSchema,
  driverId: uuidSchema.optional(), // if not provided, broadcast to available drivers
  type: assignmentTypeSchema.default('auto'),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  metadata: metadataSchema,
})

export const updateAssignmentSchema = z.object({
  status: assignmentStatusSchema.optional(),
  driverId: uuidSchema.optional(),
  acceptedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  metadata: metadataSchema,
}).partial()

export const assignmentQuerySchema = paginationQuerySchema.extend({
  status: assignmentStatusSchema.optional(),
  type: assignmentTypeSchema.optional(),
  driverId: uuidSchema.optional(),
  bookingId: uuidSchema.optional(),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
})

export const dispatchZoneSchema = z.object({
  id: uuidSchema,
  name: nonEmptyStringSchema.max(50),
  center: coordinatesSchema,
  radiusKm: z.number().positive().max(100),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
})

export const driverLocationSchema = z.object({
  driverId: uuidSchema,
  coordinates: coordinatesSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  accuracy: z.number().positive().optional(),
  timestamp: z.string().datetime(),
  isOnline: z.boolean().default(true),
})

export const routeOptimizationSchema = z.object({
  driverId: uuidSchema,
  bookings: z.array(z.object({
    id: uuidSchema,
    origin: addressSchema,
    destination: addressSchema,
    pickupTime: z.string().datetime(),
    priority: z.number().int().default(0),
  })).min(1).max(20),
  startLocation: coordinatesSchema.optional(),
})

export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>
export type AssignmentType = z.infer<typeof assignmentTypeSchema>
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
export type AssignmentQuery = z.infer<typeof assignmentQuerySchema>
export type DispatchZone = z.infer<typeof dispatchZoneSchema>
export type DriverLocation = z.infer<typeof driverLocationSchema>
export type RouteOptimizationInput = z.infer<typeof routeOptimizationSchema>