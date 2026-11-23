import {
  integer,
  text,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ──────────────────────────────────────────────
// CORE / SETTINGS
// ──────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// PROMO EVENTS / DYNAMIC BANNERS
// ──────────────────────────────────────────────
export const promoEvents = sqliteTable('promo_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tag: text('tag'),
  description: text('description'),
  highlights: text('highlights', { mode: 'json' }),
  ctaText: text('cta_text'),
  ctaHref: text('cta_href').default('/booking'),
  image: text('image'),
  placement: text('placement', { enum: ['hero_banner', 'section'] }).default('section'),
  active: integer('active', { mode: 'boolean' }).default(true),
  startDate: text('start_date'),
  endDate: text('end_date'),
  sortOrder: integer('sort_order', { mode: 'number' }).default(0),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// RBAC / PERMISSIONS
// ──────────────────────────────────────────────
export const roles = sqliteTable('roles', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

export const modules = sqliteTable('modules', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    roleId: integer('role_id', { mode: 'number' })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    moduleId: integer('module_id', { mode: 'number' })
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    canView: integer('can_view', { mode: 'boolean' }).default(false),
    canCreate: integer('can_create', { mode: 'boolean' }).default(false),
    canUpdate: integer('can_update', { mode: 'boolean' }).default(false),
    canDelete: integer('can_delete', { mode: 'boolean' }).default(false),
  },
  (t) => ({
    roleIdIdx: index('role_permissions_role_id_idx').on(t.roleId),
    moduleIdIdx: index('role_permissions_module_id_idx').on(t.moduleId),
  }),
)

// ──────────────────────────────────────────────
// USERS / AUTH
// ──────────────────────────────────────────────
export const users = sqliteTable(
  'users',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    clerkId: text('clerk_id').notNull().unique(),
    name: text('name'),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    roleId: integer('role_id', { mode: 'number' }).references(() => roles.id),
    hotelId: integer('hotel_id', { mode: 'number' }),
    status: text('status', { enum: ['active', 'inactive', 'blocked', 'pending_verification'] }).default('active'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    clerkIdIdx: index('users_clerk_id_idx').on(t.clerkId),
    emailIdx: index('users_email_idx').on(t.email),
  }),
)

export const userRoles = sqliteTable(
  'user_roles',
  {
    userId: integer('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id', { mode: 'number' })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').default(sql`datetime('now')`),
  },
  (t) => ({
    userIdIdx: index('user_roles_user_id_idx').on(t.userId),
    roleIdIdx: index('user_roles_role_id_idx').on(t.roleId),
  }),
)

// ──────────────────────────────────────────────
// CONSENT RECORDS (Ley 1581 de 2012 compliance)
// ──────────────────────────────────────────────
export const consentRecords = sqliteTable('consent_records', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  bookingReference: text('booking_reference').notNull(),
  customerEmail: text('customer_email').notNull(),
  termsAccepted: integer('terms_accepted', { mode: 'boolean' }).notNull().default(false),
  privacyAccepted: integer('privacy_accepted', { mode: 'boolean' }).notNull().default(false),
  refundAccepted: integer('refund_accepted', { mode: 'boolean' }).notNull().default(false),
  termsVersion: text('terms_version'),
  privacyVersion: text('privacy_version'),
  refundVersion: text('refund_version'),
  acceptedAt: text('accepted_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})
