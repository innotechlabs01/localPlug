import {
  integer,
  text,
  real,
  sqliteTable,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './core'

// ──────────────────────────────────────────────
// NOTIFICATIONS / MESSAGING
// ──────────────────────────────────────────────
export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    userId: integer('user_id', { mode: 'number' }).references(() => users.id),
    channel: text('channel', { enum: ['email', 'sms', 'push', 'whatsapp', 'in_app'] }).notNull(),
    type: text('type', {
      enum: [
        'booking_created',
        'booking_confirmed',
        'booking_reminder',
        'booking_cancelled',
        'driver_assigned',
        'driver_arrived',
        'trip_started',
        'trip_completed',
        'payment_received',
        'payment_failed',
        'review_request',
        'system_alert',
        'promotion',
      ],
    }).notNull(),
    priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] }).default('normal'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: text('data', { mode: 'json' }),
    scheduledAt: text('scheduled_at'),
    sentAt: text('sent_at'),
    deliveredAt: text('delivered_at'),
    readAt: text('read_at'),
    dedupKey: text('dedup_key'),
    createdAt: text('created_at').default(sql`datetime('now')`),
  },
  (t) => ({
    userIdIdx: index('notifications_user_id_idx').on(t.userId),
    typeIdx: index('notifications_type_idx').on(t.type),
    readIdx: index('notifications_read_idx').on(t.readAt),
  }),
)

export const whatsappEvents = sqliteTable('whatsapp_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  instanceName: text('instance_name'),
  remoteJid: text('remote_jid'),
  messageId: text('message_id'),
  fromMe: integer('from_me', { mode: 'boolean' }),
  content: text('content'),
  messageType: text('message_type'),
  participant: text('participant'),
  status: text('status'),
  conversationId: integer('conversation_id', { mode: 'number' }),
  rawPayload: text('raw_payload', { mode: 'json' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// CHAT / SUPPORT
// ──────────────────────────────────────────────
export const conversations = sqliteTable(
  'conversations',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    userIdentifier: text('user_identifier').notNull(),
    userName: text('user_name'),
    userEmail: text('user_email'),
    userPhone: text('user_phone'),
    userCountry: text('user_country'),
    countryCode: text('country_code'),
    status: text('status', {
      enum: ['ai_active', 'human_active', 'closed', 'escalated'],
    }).default('ai_active'),
    channel: text('channel', { enum: ['web', 'whatsapp', 'email'] }).default('web'),
    whatsappInstance: text('whatsapp_instance'),
    whatsappMessageId: text('whatsapp_message_id'),
    bookingReference: text('booking_reference'),
    assignedAgentId: integer('assigned_agent_id', { mode: 'number' }).references(() => users.id),
    aiConfidence: real('ai_confidence'),
    lastMessageAt: text('last_message_at'),
    flagged: integer('flagged', { mode: 'boolean' }).default(false),
    flagReason: text('flag_reason'),
    firstAgentResponseAt: text('first_agent_response_at'),
    createdAt: text('created_at').default(sql`datetime('now')`),
    updatedAt: text('updated_at').default(sql`datetime('now')`),
  },
  (t) => ({
    statusIdx: index('conversations_status_idx').on(t.status),
    userIdentifierIdx: index('conversations_user_identifier_idx').on(t.userIdentifier),
    bookingRefIdx: index('conversations_booking_ref_idx').on(t.bookingReference),
    assignedAgentIdx: index('conversations_assigned_agent_idx').on(t.assignedAgentId),
  }),
)

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    conversationId: integer('conversation_id', { mode: 'number' })
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderType: text('sender_type', { enum: ['user', 'agent', 'ai', 'system'] }).notNull(),
    senderId: integer('sender_id', { mode: 'number' }),
    content: text('content').notNull(),
    messageType: text('message_type', { enum: ['text', 'image', 'file', 'location', 'system', 'template'] }).default('text'),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: text('created_at').default(sql`datetime('now')`),
  },
  (t) => ({
    conversationIdIdx: index('messages_conversation_id_idx').on(t.conversationId),
  }),
)

export const supportAgents = sqliteTable('support_agents', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }).references(() => users.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  status: text('status', { enum: ['online', 'away', 'offline'] }).default('offline'),
  maxConversations: integer('max_conversations', { mode: 'number' }).default(5),
  currentConversations: integer('current_conversations', { mode: 'number' }).default(0),
  specializations: text('specializations', { mode: 'json' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

export const conversationRatings = sqliteTable('conversation_ratings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id', { mode: 'number' })
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  rating: integer('rating', { mode: 'number' }).notNull(),
  comment: text('comment'),
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  firstResponseTimeMs: integer('first_response_time_ms', { mode: 'number' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// RATINGS / REVIEWS
// ──────────────────────────────────────────────
export const ratings = sqliteTable('ratings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id', { mode: 'number' })
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  customerName: text('customer_name'),
  customerCountry: text('customer_country'),
  rating: integer('rating', { mode: 'number' }).notNull(),
  comment: text('comment'),
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  firstResponseTimeMs: integer('first_response_time_ms', { mode: 'number' }),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// QUEUE / OUTGOING MESSAGES
// ──────────────────────────────────────────────
export const outgoingMessages = sqliteTable('outgoing_messages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  channel: text('channel', { enum: ['whatsapp', 'sms', 'email', 'push'] }).notNull(),
  recipient: text('recipient').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type', { enum: ['text', 'template', 'media'] }).default('text'),
  metadata: text('metadata', { mode: 'json' }),
  maxAttempts: integer('max_attempts', { mode: 'number' }).default(3),
  status: text('status', { enum: ['pending', 'sent', 'failed', 'delivered'] }).default('pending'),
  attempts: integer('attempts', { mode: 'number' }).default(0),
  lastError: text('last_error'),
  scheduledAt: text('scheduled_at'),
  sentAt: text('sent_at'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// ──────────────────────────────────────────────
// EMPLOYEE ACTIVITY
// ──────────────────────────────────────────────
export const employeeActivity = sqliteTable('employee_activity', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  activityType: text('activity_type').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})
