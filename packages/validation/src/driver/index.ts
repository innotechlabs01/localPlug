// Driver validation schemas
import { z } from 'zod'
import { paginationQuerySchema } from '../common/pagination'
import { coordinatesSchema } from '../common/coordinates'

export const driverStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending_verification'])

export const licenseTypeSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export const createDriverInputSchema = z.object({
  clerkId: z.string().min(1),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  licenseNumber: z.string().min(5).max(20),
  licenseType: licenseTypeSchema,
  licenseExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vehicleId: z.number().int().positive().optional(),
  status: driverStatusSchema.default('pending_verification'),
  preferredZones: z.array(z.string()).optional(),
})

export const updateDriverInputSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  licenseNumber: z.string().min(5).max(20).optional(),
  licenseType: licenseTypeSchema.optional(),
  licenseExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vehicleId: z.number().int().positive().optional(),
  status: driverStatusSchema.optional(),
  preferredZones: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  totalTrips: z.number().int().nonnegative().optional(),
})

export const driverQuerySchema = paginationQuerySchema.extend({
  status: driverStatusSchema.optional(),
  vehicleId: z.number().int().positive().optional(),
  zone: z.string().optional(),
  licenseType: licenseTypeSchema.optional(),
})

export const driverAvailabilitySchema = z.object({
  driverId: z.number().int().positive(),
  isAvailable: z.boolean(),
  currentLocation: coordinatesSchema.optional(),
  nextAvailableAt: z.string().datetime().optional(),
})

export const documentUploadSchema = z.object({
  type: z.enum(['license', 'insurance', 'vehicle_registration', 'background_check', 'medical_cert']),
  fileUrl: z.string().url(),
  expiresAt: z.string().datetime().optional(),
})

export type DriverStatus = z.infer<typeof driverStatusSchema>
export type LicenseType = z.infer<typeof licenseTypeSchema>
export type CreateDriverInput = z.infer<typeof createDriverInputSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverInputSchema>
export type DriverQuery = z.infer<typeof driverQuerySchema>
export type DriverAvailability = z.infer<typeof driverAvailabilitySchema>
export type DocumentUpload = z.infer<typeof documentUploadSchema>