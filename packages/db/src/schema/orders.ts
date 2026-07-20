import {
  integer,
  text,
  real,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ──────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────
export const orders = sqliteTable(
  'orders',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    bookingReference: text('booking_reference').notNull().unique(),
    status: text('status', { enum: ['new', 'confirmed', 'dispatched', 'in_progress', 'completed', 'cancelled'] }).default('new'),
    dispatchStatus: text('dispatch_status'),
    priority: text('priority', { enum: ['normal', 'high', 'urgent'] }).default('normal'),
    type: text('type', { enum: ['airport_transfer', 'city_transfer', 'hourly', 'intercity'] }).default('airport_transfer'),
    packageName: text('package_name'),
    experienceType: text('experience_type'),
    passengerCount: integer('passenger_count', { mode: 'number' }).default(1),
    luggageCount: integer('luggage_count', { mode: 'number' }).default(0),
    arrivalDate: text('arrival_date'),
    arrivalTime: text('arrival_time'),
    flightNumber: text('flight_number'),
    airline: text('airline'),
    flightOrigin: text('flight_origin'),
    flightTerminal: text('flight_terminal'),
    originAddress: text('origin_address'),
    originLat: real('origin_lat'),
    originLng: real('origin_lng'),
    destinationAddress: text('destination_address'),
    destinationLat: real('destination_lat'),
    destinationLng: real('destination_lng'),
    returnTrip: integer('return_trip', { mode: 'boolean' }).default(false),
    returnDate: text('return_date'),
    returnTime: text('return_time'),
    specialRequests: text('special_requests'),
    promoCode: text('promo_code'),
    packagePrice: integer('package_price', { mode: 'number' }).default(0),
    returnTripCharge: integer('return_trip_charge', { mode: 'number' }).default(0),
    serviceFee: integer('service_fee', { mode: 'number' }).default(0),
    taxAmount: integer('tax_amount', { mode: 'number' }).default(0),
    discountAmount: integer('discount_amount', { mode: 'number' }).default(0),
    totalAmount: integer('total_amount', { mode: 'number' }).default(0),
    currency: text('currency', { enum: ['USD', 'COP', 'EUR'] }).default('USD'),
    paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'refunded', 'failed'] }).default('pending'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    contactName: text('contact_name'),
    assignedTo: integer('assigned_to', { mode: 'number' }),
    assignedAt: text('assigned_at'),
    assignedBy: integer('assigned_by', { mode: 'number' }),
    driverId: integer('driver_id', { mode: 'number' }),
    vehicleId: integer('vehicle_id', { mode: 'number' }),
    hotelId: integer('hotel_id', { mode: 'number' }),
    actualPickupAt: text('actual_pickup_at'),
    actualDropoffAt: text('actual_dropoff_at'),
    cancelledAt: text('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: text('cancelled_by'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    bookingRefIdx: index('orders_booking_ref_idx').on(t.bookingReference),
    statusIdx: index('orders_status_idx').on(t.status),
    dispatchStatusIdx: index('orders_dispatch_status_idx').on(t.dispatchStatus),
    assignedToIdx: index('orders_assigned_to_idx').on(t.assignedTo),
    driverIdIdx: index('orders_driver_id_idx').on(t.driverId),
    arrivalDateIdx: index('orders_arrival_date_idx').on(t.arrivalDate),
    createdAtIdx: index('orders_created_at_idx').on(t.createdAt),
  }),
)

// ──────────────────────────────────────────────
// ORDER STATUS HISTORY
// ──────────────────────────────────────────────
export const orderStatusHistory = sqliteTable(
  'order_status_history',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    orderId: integer('order_id', { mode: 'number' })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    oldStatus: text('old_status'),
    newStatus: text('new_status').notNull(),
    changedBy: integer('changed_by', { mode: 'number' }),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`datetime('now')`),
  },
  (t) => ({
    orderIdIdx: index('order_status_history_order_id_idx').on(t.orderId),
  }),
)

// ──────────────────────────────────────────────
// PASSENGERS
// ──────────────────────────────────────────────
export const passengers = sqliteTable(
  'passengers',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    orderId: integer('order_id', { mode: 'number' })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
    createdAt: text('created_at').default(sql`datetime('now')`),
  },
  (t) => ({
    orderIdIdx: index('passengers_order_id_idx').on(t.orderId),
  }),
)
