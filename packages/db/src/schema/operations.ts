import {
  integer,
  text,
  real,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { orders } from './orders'
import { drivers, vehicles } from './drivers'

// ──────────────────────────────────────────────
// ASSIGNMENTS / DISPATCH
// ──────────────────────────────────────────────
export const assignments = sqliteTable(
  'assignments',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    orderId: integer('order_id', { mode: 'number' })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    driverId: integer('driver_id', { mode: 'number' }).references(() => drivers.id),
    vehicleId: integer('vehicle_id', { mode: 'number' }).references(() => vehicles.id),
    type: text('type', { enum: ['auto', 'manual', 'broadcast'] }).default('auto'),
    status: text('status', {
      enum: ['pending', 'pending_acceptance', 'accepted', 'rejected', 'expired', 'cancelled', 'completed'],
    }).default('pending'),
    scheduledAt: text('scheduled_at'),
    acceptedAt: text('accepted_at'),
    rejectedAt: text('rejected_at'),
    rejectionReason: text('rejection_reason'),
    expiresAt: text('expires_at'),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    orderIdIdx: index('assignments_order_id_idx').on(t.orderId),
    driverIdIdx: index('assignments_driver_id_idx').on(t.driverId),
    statusIdx: index('assignments_status_idx').on(t.status),
  }),
)

export const dispatchZones = sqliteTable('dispatch_zones', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  centerLat: real('center_lat').notNull(),
  centerLng: real('center_lng').notNull(),
  radiusKm: real('radius_km').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  priority: integer('priority', { mode: 'number' }).default(0),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// PAYMENTS
// ──────────────────────────────────────────────
export const payments = sqliteTable(
  'payments',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    orderId: integer('order_id', { mode: 'number' })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    amount: integer('amount', { mode: 'number' }).notNull(),
    currency: text('currency', { enum: ['USD', 'COP', 'EUR'] }).default('USD'),
    provider: text('provider', { enum: ['paddle', 'stripe', 'cash', 'transfer'] }).notNull(),
    type: text('type', { enum: ['booking', 'experience', 'subscription', 'penalty', 'adjustment'] }).default('booking'),
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
    }).default('pending'),
    providerPaymentId: text('provider_payment_id'),
    providerData: text('provider_data', { mode: 'json' }),
    description: text('description'),
    customerEmail: text('customer_email'),
    customerName: text('customer_name'),
    splitStatus: text('split_status', { enum: ['pending', 'completed', 'refunded'] }),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    orderIdIdx: index('payments_order_id_idx').on(t.orderId),
    statusIdx: index('payments_status_idx').on(t.status),
    providerPaymentIdIdx: index('payments_provider_payment_id_idx').on(t.providerPaymentId),
  }),
)

// ──────────────────────────────────────────────
// HOTELS / ROOMS
// ──────────────────────────────────────────────
export const hotels = sqliteTable(
  'hotels',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    address: text('address'),
    lat: real('lat'),
    lng: real('lng'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    photos: text('photos', { mode: 'json' }),
    stars: integer('stars', { mode: 'number' }),
    status: text('status', { enum: ['active', 'inactive', 'maintenance'] }).default('active'),
    commissionRate: real('commission_rate').default(0.1),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    slugIdx: index('hotels_slug_idx').on(t.slug),
    statusIdx: index('hotels_status_idx').on(t.status),
  }),
)

export const rooms = sqliteTable(
  'rooms',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    hotelId: integer('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    capacity: integer('capacity', { mode: 'number' }).notNull(),
    pricePerNight: integer('price_per_night', { mode: 'number' }).notNull(),
    amenities: text('amenities', { mode: 'json' }),
    photos: text('photos', { mode: 'json' }),
    status: text('status', { enum: ['available', 'occupied', 'maintenance', 'unavailable'] }).default('available'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    hotelIdIdx: index('rooms_hotel_id_idx').on(t.hotelId),
    statusIdx: index('rooms_status_idx').on(t.status),
  }),
)

export const roomBookings = sqliteTable('room_bookings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  roomId: integer('room_id', { mode: 'number' })
    .notNull()
    .references(() => rooms.id),
  hotelId: integer('hotel_id', { mode: 'number' })
    .notNull()
    .references(() => hotels.id),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email'),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out').notNull(),
  totalPrice: integer('total_price', { mode: 'number' }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] }).default('pending'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// PROMOTIONS
// ──────────────────────────────────────────────
export const promotions = sqliteTable('promotions', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  hotelId: integer('hotel_id', { mode: 'number' })
    .references(() => hotels.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['percentage', 'fixed'] }).notNull(),
  code: text('code').notNull().unique(),
  discountAmount: integer('discount_amount', { mode: 'number' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  usageLimit: integer('usage_limit', { mode: 'number' }),
  usedCount: integer('used_count', { mode: 'number' }).default(0),
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  applicablePackages: text('applicable_packages', { mode: 'json' }),
  applicableExperiences: text('applicable_experiences', { mode: 'json' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})
