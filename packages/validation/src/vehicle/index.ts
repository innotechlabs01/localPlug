// Vehicle validation schemas
import { z } from 'zod'
import {
  uuidSchema,
  nonEmptyStringSchema,
  coordinatesSchema,
  metadataSchema,
  positiveIntSchema,
  amountCentsSchema,
} from '../common'

export const vehicleStatusSchema = z.enum(['active', 'maintenance', 'retired', 'unavailable'])

export const vehicleTypeSchema = z.enum(['sedan', 'suv', 'van', 'luxury', 'electric'])

export const fuelTypeSchema = z.enum(['gasoline', 'diesel', 'electric', 'hybrid'])

export const createVehicleSchema = z.object({
  plate: nonEmptyStringSchema.regex(/^[A-Z]{3}\d{3}$/, { message: 'Plate must be format ABC123' }),
  brand: nonEmptyStringSchema.max(50),
  model: nonEmptyStringSchema.max(50),
  year: z.number().int().min(2010).max(new Date().getFullYear() + 1),
  color: nonEmptyStringSchema.max(30),
  type: vehicleTypeSchema,
  fuelType: fuelTypeSchema,
  capacity: positiveIntSchema.max(14),
  vin: z.string().length(17).optional(),
  registrationExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  insuranceExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  soatExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  techReviewExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gpsDeviceId: z.string().optional(),
  assignedDriverId: uuidSchema.optional(),
  metadata: metadataSchema,
})

export const updateVehicleSchema = z.object({
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  year: z.number().int().min(2010).max(new Date().getFullYear() + 1).optional(),
  color: z.string().max(30).optional(),
  type: vehicleTypeSchema.optional(),
  fuelType: fuelTypeSchema.optional(),
  capacity: positiveIntSchema.max(14).optional(),
  vin: z.string().length(17).optional(),
  registrationExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  soatExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  techReviewExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gpsDeviceId: z.string().optional(),
  assignedDriverId: uuidSchema.nullable().optional(),
  status: vehicleStatusSchema.optional(),
  metadata: metadataSchema,
}).partial()

export const vehicleQuerySchema = z.object({
  status: vehicleStatusSchema.optional(),
  type: vehicleTypeSchema.optional(),
  fuelType: fuelTypeSchema.optional(),
  driverId: uuidSchema.optional(),
  plate: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})

export const vehicleLocationSchema = z.object({
  vehicleId: uuidSchema,
  coordinates: coordinatesSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  updatedAt: z.string().datetime(),
})

export type VehicleStatus = z.infer<typeof vehicleStatusSchema>
export type VehicleType = z.infer<typeof vehicleTypeSchema>
export type FuelType = z.infer<typeof fuelTypeSchema>
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>
export type VehicleLocation = z.infer<typeof vehicleLocationSchema>