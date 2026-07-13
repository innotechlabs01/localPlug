// Booking validation schemas
import { z } from 'zod'
import { dateStringSchema, dateRangeSchema } from '../common/date'
import { paginationQuerySchema } from '../common/pagination'
import { coordinatesSchema } from '../common/coordinates'
import { moneyInputSchema } from '../common/money'

export const packageIdSchema = z.enum(['smooth-landing', 'first-24', 'full-insider'])

export const flightInfoSchema = z.object({
  airline: z.string().min(1),
  flightNumber: z.string().min(1),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  origin: z.string().min(1),
  terminal: z.string().optional(),
})

export const passengerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

export const createBookingInputSchema = z.object({
  packageId: packageIdSchema,
  arrivalDate: dateStringSchema,
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  flight: flightInfoSchema,
  passengers: z.array(passengerSchema).min(1).max(8),
  needReturn: z.boolean().default(false),
  returnDate: dateStringSchema.optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  hotelId: z.number().int().positive().optional(),
  specialRequests: z.string().max(1000).optional(),
  promoCode: z.string().max(50).optional(),
}).refine((data) => {
  if (data.needReturn && (!data.returnDate || !data.returnTime)) {
    return false
  }
  return true
}, {
  message: 'Return date and time are required when return trip is selected',
  path: ['returnDate'],
})

export const updateBookingInputSchema = z.object({
  arrivalDate: dateStringSchema.optional(),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  flight: flightInfoSchema.optional(),
  passengers: z.array(passengerSchema).min(1).max(8).optional(),
  needReturn: z.boolean().optional(),
  returnDate: dateStringSchema.optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  hotelId: z.number().int().positive().optional(),
  specialRequests: z.string().max(1000).optional(),
})

export const bookingQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  packageId: packageIdSchema.optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  passengerEmail: z.string().email().optional(),
  hotelId: z.number().int().positive().optional(),
})

export const bookingStatusTransitionSchema = z.object({
  status: z.enum(['confirmed', 'in_progress', 'completed', 'cancelled']),
  reason: z.string().max(500).optional(),
  driverId: z.number().int().positive().optional(),
  vehicleId: z.number().int().positive().optional(),
})

export const experienceBookingSchema = z.object({
  experienceId: z.enum(['comuna13', 'guatape', 'coffee', 'paragliding', 'nightlife', 'vip-city']),
  date: dateStringSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  participants: z.number().int().positive().max(20),
  hotelId: z.number().int().positive().optional(),
  specialRequests: z.string().max(500).optional(),
})

export const pickupLocationSchema = z.object({
  address: z.string().min(5),
  coordinates: coordinatesSchema.optional(),
  landmark: z.string().optional(),
  instructions: z.string().max(500).optional(),
})

export const dropoffLocationSchema = pickupLocationSchema

export type PackageId = z.infer<typeof packageIdSchema>
export type FlightInfo = z.infer<typeof flightInfoSchema>
export type Passenger = z.infer<typeof passengerSchema>
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>
export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>
export type BookingQuery = z.infer<typeof bookingQuerySchema>
export type BookingStatusTransition = z.infer<typeof bookingStatusTransitionSchema>
export type ExperienceBooking = z.infer<typeof experienceBookingSchema>
export type PickupLocation = z.infer<typeof pickupLocationSchema>
export type DropoffLocation = z.infer<typeof dropoffLocationSchema>