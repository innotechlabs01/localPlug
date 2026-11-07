import {
  integer,
  text,
  sqliteTable,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './core'
import { hotels } from './operations'

export const experiences = sqliteTable('experiences', {
  id: text('id', { enum: ['comuna13', 'guatape', 'coffee', 'paragliding', 'nightlife', 'vip_city'] }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes', { mode: 'number' }).notNull(),
  basePrice: integer('base_price', { mode: 'number' }).notNull(),
  maxParticipants: integer('max_participants', { mode: 'number' }).notNull(),
  includes: text('includes', { mode: 'json' }),
  excludes: text('excludes', { mode: 'json' }),
  requirements: text('requirements'),
  images: text('images', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

export const experienceBookings = sqliteTable('experience_bookings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id', { mode: 'number' }).references(() => users.id),
  experienceId: text('experience_id')
    .notNull()
    .references(() => experiences.id),
  date: text('date').notNull(),
  time: text('time').notNull(),
  participants: integer('participants', { mode: 'number' }).notNull(),
  price: integer('price', { mode: 'number' }).notNull(),
  hotelId: integer('hotel_id', { mode: 'number' }).references(() => hotels.id),
  specialRequests: text('special_requests'),
  status: text('status', { enum: ['pending', 'confirmed', 'cancelled', 'completed'] }).default('pending'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})
