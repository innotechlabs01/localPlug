import {
  integer,
  text,
  real,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const customers = sqliteTable('customers', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }),
  clerkId: text('clerk_id').unique(),
  email: text('email'),
  phone: text('phone'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  preferredLanguage: text('preferred_language', { enum: ['en', 'es'] }).default('en'),
  timezone: text('timezone'),
  status: text('status', { enum: ['active', 'inactive', 'blocked', 'pending_verification'] }).default('active'),
  source: text('source', { enum: ['organic', 'referral', 'advertising', 'social', 'partner', 'admin'] }).default('organic'),
  referralCode: text('referral_code'),
  preferences: text('preferences', { mode: 'json' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
}, (t) => ({
  clerkIdIdx: index('customers_clerk_id_idx').on(t.clerkId),
}))

export const addressBook = sqliteTable('address_book', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id', { mode: 'number' })
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  state: text('state'),
  country: text('country').notNull(),
  postalCode: text('postal_code'),
  lat: real('lat'),
  lng: real('lng'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`datetime('now')`),
}, (t) => ({
  customerIdIdx: index('address_book_customer_id_idx').on(t.customerId),
}))
