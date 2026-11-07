import {
  integer,
  text,
  real,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './core'

export const drivers = sqliteTable(
  'drivers',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    clerkId: text('clerk_id').unique(),
    userId: integer('user_id', { mode: 'number' }).references(() => users.id),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    licenseNumber: text('license_number'),
    licenseType: text('license_type', { enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }),
    licenseExpiry: text('license_expiry'),
    status: text('status', {
      enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    }).default('pending_verification'),
    vehicleId: integer('vehicle_id', { mode: 'number' }),
    rating: real('rating').default(0),
    totalTrips: integer('total_trips', { mode: 'number' }).default(0),
    currentLat: real('current_lat'),
    currentLng: real('current_lng'),
    isOnline: integer('is_online', { mode: 'boolean' }).default(false),
    preferredZones: text('preferred_zones', { mode: 'json' }),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    clerkIdIdx: index('drivers_clerk_id_idx').on(t.clerkId),
    statusIdx: index('drivers_status_idx').on(t.status),
    userIdIdx: index('drivers_user_id_idx').on(t.userId),
  }),
)

export const vehicles = sqliteTable(
  'vehicles',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    plate: text('plate').notNull().unique(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    year: integer('year', { mode: 'number' }).notNull(),
    color: text('color').notNull(),
    type: text('type', { enum: ['sedan', 'suv', 'van', 'luxury', 'electric'] }).notNull(),
    fuelType: text('fuel_type', { enum: ['gasoline', 'diesel', 'electric', 'hybrid'] }).notNull(),
    capacity: integer('capacity', { mode: 'number' }).notNull(),
    vin: text('vin'),
    registrationExpiry: text('registration_expiry').notNull(),
    insuranceExpiry: text('insurance_expiry').notNull(),
    soatExpiry: text('soat_expiry').notNull(),
    techReviewExpiry: text('tech_review_expiry'),
    gpsDeviceId: text('gps_device_id'),
    assignedDriverId: integer('assigned_driver_id', { mode: 'number' }).references(() => drivers.id),
    status: text('status', { enum: ['active', 'maintenance', 'retired', 'unavailable'] }).default('active'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
    metadata: text('metadata', { mode: 'json' }),
  },
  (t) => ({
    plateIdx: index('vehicles_plate_idx').on(t.plate),
    statusIdx: index('vehicles_status_idx').on(t.status),
  }),
)

export const driverPerformance = sqliteTable('driver_performance', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  driverId: integer('driver_id', { mode: 'number' })
    .notNull()
    .references(() => drivers.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  completedTrips: integer('completed_trips', { mode: 'number' }).default(0),
  cancelledTrips: integer('cancelled_trips', { mode: 'number' }).default(0),
  totalDistanceKm: real('total_distance_km').default(0),
  totalDurationMin: integer('total_duration_min', { mode: 'number' }).default(0),
  averageRating: real('average_rating').default(0),
  onTimeRate: real('on_time_rate').default(0),
  revenueCents: integer('revenue_cents', { mode: 'number' }).default(0),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

export const driverDocuments = sqliteTable('driver_documents', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  driverId: integer('driver_id', { mode: 'number' })
    .notNull()
    .references(() => drivers.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['license', 'insurance', 'vehicle_registration', 'background_check', 'medical_cert'],
  }).notNull(),
  fileUrl: text('file_url').notNull(),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})
