// Repository implementations (Drizzle ORM based)
// Part of @lp/db (B4/B8). Uses Drizzle ORM with libSQL.

import { getDb } from '../client'
import * as schema from '../schema'
import { eq, and, or, like, ilike, desc, asc, sql, inArray, gte, lte, count } from 'drizzle-orm'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function applyPagination(query: any, params: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): any {
  const { page, limit, sortBy, sortOrder } = params
  const offset = (page - 1) * limit

  if (sortBy && query._?.columns?.[sortBy]) {
    const col = query._.columns[sortBy]
    query = query.orderBy(sortOrder === 'asc' ? asc(col) : desc(col))
  }

  return query.limit(limit).offset(offset)
}

async function getTotalCount(query: any) {
  const result = await query.get()
  return result?.count || 0
}

// ──────────────────────────────────────────────
// Booking Repository
// ──────────────────────────────────────────────

export const bookingRepository = {
  async findById(id: number) {
    const db = getDb()
    return db.select().from(schema.orders).where(eq(schema.orders.id, id)).get() || null
  },

  async findByBookingReference(ref: string) {
    const db = getDb()
    return db.select().from(schema.orders).where(eq(schema.orders.bookingReference, ref)).get() || null
  },

  async findMany(params: any) {
    const db = getDb()
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params

    let query: any = db.select().from(schema.orders)
    const conditions = []
    if (filters.status) conditions.push(eq(schema.orders.status, filters.status))
    if (filters.dispatchStatus) conditions.push(eq(schema.orders.dispatchStatus, filters.dispatchStatus))
    if (filters.driverId) conditions.push(eq(schema.orders.driverId, filters.driverId))
    if (filters.dateFrom) conditions.push(gte(schema.orders.arrivalDate, filters.dateFrom))
    if (filters.dateTo) conditions.push(lte(schema.orders.arrivalDate, filters.dateTo))
    if (filters.passengerEmail) conditions.push(ilike(schema.orders.contactEmail, `%${filters.passengerEmail}%`))
    if (filters.passengerPhone) conditions.push(ilike(schema.orders.contactPhone, `%${filters.passengerPhone}%`))
    if (filters.hotelId) conditions.push(eq(schema.orders.hotelId, filters.hotelId))

    if (conditions.length > 0) query = query.where(and(...conditions))

    const totalQuery = db.select({ count: count() }).from(schema.orders)
    if (conditions.length > 0) totalQuery.where(and(...conditions))
    const total = await getTotalCount(totalQuery)

    const items = await applyPagination(query, { page, limit, sortBy, sortOrder })

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async create(data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.orders).values(data).returning()
    return created
  },

  async update(id: number, data: any) {
    const db = getDb()
    const [updated] = await db.update(schema.orders).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.orders.id, id)).returning()
    return updated || null
  },

  async delete(id: number) {
    const db = getDb()
    const result = await db.delete(schema.orders).where(eq(schema.orders.id, id))
    return result.rowsAffected > 0
  },

  async updateStatus(id: number, status: any, changedBy?: number, notes?: string) {
    const db = getDb()
    const current = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).get()
    if (!current) return null

    await db.insert(schema.orderStatusHistory).values({ orderId: id, oldStatus: current.status, newStatus: status, changedBy, notes })

    return this.update(id, { status, updatedAt: new Date().toISOString() })
  },

  async assignDriver(orderId: number, driverId: number, vehicleId: number, assignedBy: number) {
    return this.update(orderId, { driverId, vehicleId, assignedTo: driverId, assignedAt: new Date().toISOString(), dispatchStatus: 'assigned' })
  },

  async getTotalCount() {
    const db = getDb()
    const result = await db.select({ count: count() }).from(schema.orders).get()
    return result?.count || 0
  },
}

// ──────────────────────────────────────────────
// Driver Repository
// ──────────────────────────────────────────────

export const driverRepository = {
  async findById(id: number) {
    const db = getDb()
    return db.select().from(schema.drivers).where(eq(schema.drivers.id, id)).get() || null
  },

  async findByClerkId(clerkId: string) {
    const db = getDb()
    return db.select().from(schema.drivers).where(eq(schema.drivers.clerkId, clerkId)).get() || null
  },

  async findByUserId(userId: number) {
    const db = getDb()
    return db.select().from(schema.drivers).where(eq(schema.drivers.userId, userId)).get() || null
  },

  async findMany(params: any) {
    const db = getDb()
    const { page = 1, limit = 20, ...filters } = params

    let query: any = db.select().from(schema.drivers)
    const conditions = []
    if (filters.status) conditions.push(eq(schema.drivers.status, filters.status))
    if (filters.vehicleId) conditions.push(eq(schema.drivers.vehicleId, filters.vehicleId))
    if (filters.licenseType) conditions.push(eq(schema.drivers.licenseType, filters.licenseType))
    if (filters.zone) conditions.push(like(schema.drivers.preferredZones, `%${filters.zone}%`))
    if (conditions.length > 0) query = query.where(and(...conditions))

    const totalQuery = db.select({ count: count() }).from(schema.drivers)
    if (conditions.length > 0) totalQuery.where(and(...conditions))
    const total = await getTotalCount(totalQuery)

    const items = await applyPagination(query, { page: params.page, limit: params.limit, sortBy: 'createdAt', sortOrder: 'desc' })

    return { items, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) }
  },

  async create(data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.drivers).values(data).returning()
    return created
  },

  async update(id: number, data: any) {
    const db = getDb()
    const [updated] = await db.update(schema.drivers).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.drivers.id, id)).returning()
    return updated || null
  },

  async delete(id: number) {
    const db = getDb()
    const result = await db.delete(schema.drivers).where(eq(schema.drivers.id, id))
    return result.rowsAffected > 0
  },

  async updateAvailability(driverId: number, isAvailable: boolean, location?: { lat: number; lng: number }) {
    const db = getDb()
    const updateData: any = { isOnline: isAvailable, updatedAt: new Date().toISOString() }
    if (location) {
      updateData.currentLat = location.lat
      updateData.currentLng = location.lng
    }
    const [updated] = await db.update(schema.drivers).set(updateData).where(eq(schema.drivers.id, driverId)).returning()
    return updated || null
  },

  async getAvailableDrivers(zoneId?: number, vehicleType?: string) {
    const db = getDb()
    const conditions = [eq(schema.drivers.status, 'active'), eq(schema.drivers.isOnline, true)]
    if (vehicleType) conditions.push(eq(schema.drivers.vehicleId, vehicleType as any))
    return db.select().from(schema.drivers).where(and(...conditions))
  },

  async addPerformance(driverId: number, data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.driverPerformance).values({ ...data, driverId }).returning()
    return created
  },

  async getPerformance(driverId: number, period?: string) {
    const db = getDb()
    if (period) {
      return db.select().from(schema.driverPerformance).where(and(eq(schema.driverPerformance.driverId, driverId), eq(schema.driverPerformance.period, period))).get() || null
    }
    return db.select().from(schema.driverPerformance).where(eq(schema.driverPerformance.driverId, driverId)).orderBy(desc(schema.driverPerformance.period)).get() || null
  },

  async addDocument(driverId: number, data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.driverDocuments).values({ ...data, driverId }).returning()
    return created
  },

  async getDocuments(driverId: number) {
    const db = getDb()
    return db.select().from(schema.driverDocuments).where(eq(schema.driverDocuments.driverId, driverId))
  },
}

// ──────────────────────────────────────────────
// Vehicle Repository
// ──────────────────────────────────────────────

export const vehicleRepository = {
  async findById(id: number) {
    const db = getDb()
    return db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get() || null
  },

  async findByPlate(plate: string) {
    const db = getDb()
    return db.select().from(schema.vehicles).where(eq(schema.vehicles.plate, plate)).get() || null
  },

  async findMany(params: any) {
    const db = getDb()
    const { page = 1, limit = 20, ...filters } = params

    let query: any = db.select().from(schema.vehicles)
    const conditions = []
    if (filters.status) conditions.push(eq(schema.vehicles.status, filters.status))
    if (filters.type) conditions.push(eq(schema.vehicles.type, filters.type))
    if (filters.fuelType) conditions.push(eq(schema.vehicles.fuelType, filters.fuelType))
    if (filters.driverId) conditions.push(eq(schema.vehicles.assignedDriverId, filters.driverId))
    if (filters.plate) conditions.push(ilike(schema.vehicles.plate, `%${filters.plate}%`))
    if (conditions.length > 0) query = query.where(and(...conditions))

    const totalQuery = db.select({ count: count() }).from(schema.vehicles)
    if (conditions.length > 0) totalQuery.where(and(...conditions))
    const total = await getTotalCount(totalQuery)

    const items = await applyPagination(query, { page: params.page, limit: params.limit, sortBy: 'createdAt', sortOrder: 'desc' })

    return { items, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) }
  },

  async create(data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.vehicles).values(data).returning()
    return created
  },

  async update(id: number, data: any) {
    const db = getDb()
    const [updated] = await db.update(schema.vehicles).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.vehicles.id, id)).returning()
    return updated || null
  },

  async delete(id: number) {
    const db = getDb()
    const result = await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id))
    return result.rowsAffected > 0
  },

  async updateLocation(vehicleId: number, lat: number, lng: number, heading?: number, speed?: number) {
    return this.findById(vehicleId)
  },

  async getActiveVehicles() {
    const db = getDb()
    return db.select().from(schema.vehicles).where(eq(schema.vehicles.status, 'active'))
  },
}

// ──────────────────────────────────────────────
// Assignment / Dispatch Repository
// ──────────────────────────────────────────────

export const assignmentRepository = {
  async findById(id: number) {
    const db = getDb()
    return db.select().from(schema.assignments).where(eq(schema.assignments.id, id)).get() || null
  },

  async findByOrderId(orderId: number) {
    const db = getDb()
    return db.select().from(schema.assignments).where(eq(schema.assignments.orderId, orderId)).get() || null
  },

  async findMany(params: any) {
    const db = getDb()
    const { page = 1, limit = 20, ...filters } = params

    let query: any = db.select().from(schema.assignments)
    const conditions = []
    if (filters.status) conditions.push(eq(schema.assignments.status, filters.status))
    if (filters.type) conditions.push(eq(schema.assignments.type, filters.type))
    if (filters.driverId) conditions.push(eq(schema.assignments.driverId, filters.driverId))
    if (filters.vehicleId) conditions.push(eq(schema.assignments.vehicleId, filters.vehicleId))
    if (filters.bookingId) conditions.push(eq(schema.assignments.orderId, filters.bookingId))
    if (filters.dateFrom) conditions.push(gte(schema.assignments.createdAt, filters.dateFrom))
    if (filters.dateTo) conditions.push(lte(schema.assignments.createdAt, filters.dateTo))
    if (conditions.length > 0) query = query.where(and(...conditions))

    const totalQuery = db.select({ count: count() }).from(schema.assignments)
    if (conditions.length > 0) totalQuery.where(and(...conditions))
    const total = await getTotalCount(totalQuery)

    const items = await applyPagination(query, { page: params.page, limit: params.limit, sortBy: 'createdAt', sortOrder: 'desc' })

    return { items, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) }
  },

  async create(data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.assignments).values(data).returning()
    return created
  },

  async update(id: number, data: any) {
    const db = getDb()
    const [updated] = await db.update(schema.assignments).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.assignments.id, id)).returning()
    return updated || null
  },

  async delete(id: number) {
    const db = getDb()
    const result = await db.delete(schema.assignments).where(eq(schema.assignments.id, id))
    return result.rowsAffected > 0
  },

  async broadcastToDrivers(bookingId: number, driverIds: number[], expiresAt: string) {
    const db = getDb()
    const created: any[] = []
    for (const driverId of driverIds) {
      const [assignment] = await db.insert(schema.assignments).values({
        orderId: bookingId,
        driverId,
        type: 'broadcast',
        status: 'pending_acceptance',
        expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning()
      created.push(assignment)
    }
    return created
  },

  async acceptAssignment(assignmentId: number, driverId: number) {
    const db = getDb()
    const [updated] = await db.update(schema.assignments)
      .set({ status: 'accepted', acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.driverId, driverId)))
      .returning()
    return updated || null
  },

  async rejectAssignment(assignmentId: number, driverId: number, reason: string) {
    const db = getDb()
    const [updated] = await db.update(schema.assignments)
      .set({ status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.driverId, driverId)))
      .returning()
    return updated || null
  },
}

// ──────────────────────────────────────────────
// Payment Repository
// ──────────────────────────────────────────────

export const paymentRepository = {
  async findById(id: number) {
    const db = getDb()
    return db.select().from(schema.payments).where(eq(schema.payments.id, id)).get() || null
  },

  async findByOrderId(orderId: number) {
    const db = getDb()
    return db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId))
  },

  async findByProviderPaymentId(providerId: string) {
    const db = getDb()
    return db.select().from(schema.payments).where(eq(schema.payments.providerPaymentId, providerId)).get() || null
  },

  async findMany(params: any) {
    const db = getDb()
    const { page = 1, limit = 20, ...filters } = params

    let query: any = db.select().from(schema.payments)
    const conditions = []
    if (filters.status) conditions.push(eq(schema.payments.status, filters.status))
    if (filters.provider) conditions.push(eq(schema.payments.provider, filters.provider))
    if (filters.type) conditions.push(eq(schema.payments.type, filters.type))
    if (filters.bookingId) conditions.push(eq(schema.payments.orderId, filters.bookingId))
    if (filters.dateFrom) conditions.push(gte(schema.payments.createdAt, filters.dateFrom))
    if (filters.dateTo) conditions.push(lte(schema.payments.createdAt, filters.dateTo))
    if (filters.minAmount) conditions.push(gte(schema.payments.amount, filters.minAmount))
    if (filters.maxAmount) conditions.push(lte(schema.payments.amount, filters.maxAmount))
    if (conditions.length > 0) query = query.where(and(...conditions))

    const totalQuery = db.select({ count: count() }).from(schema.payments)
    if (conditions.length > 0) totalQuery.where(and(...conditions))
    const total = await getTotalCount(totalQuery)

    const items = await applyPagination(query, { page: params.page, limit: params.limit, sortBy: 'createdAt', sortOrder: 'desc' })

    return { items, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) }
  },

  async create(data: any) {
    const db = getDb()
    const [created] = await db.insert(schema.payments).values(data).returning()
    return created
  },

  async update(id: number, data: any) {
    const db = getDb()
    const [updated] = await db.update(schema.payments).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.payments.id, id)).returning()
    return updated || null
  },

  async processPayment(paymentId: number, providerPaymentId: string, providerData: Record<string, unknown>) {
    const db = getDb()
    const [updated] = await db.update(schema.payments)
      .set({ status: 'completed', providerPaymentId, providerData, updatedAt: new Date().toISOString() })
      .where(eq(schema.payments.id, paymentId))
      .returning()
    return updated || null
  },

  async refund(paymentId: number, amount?: number, reason?: string, refundToOriginal?: boolean) {
    const db = getDb()
    const payment = await this.findById(paymentId)
    if (!payment) return null

    const refundAmount = amount || payment.amount
    const [updated] = await db.update(schema.payments)
      .set({
        status: amount && amount < payment.amount ? 'partially_refunded' : 'refunded',
        providerData: { ...(payment.providerData as any), lastRefund: { amount: refundAmount, reason, refundToOriginal, at: new Date().toISOString() } },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.payments.id, paymentId))
      .returning()
    return updated || null
  },
}

// ──────────────────────────────────────────────
// Minimal stub implementations for remaining repositories
// (full implementations follow same patterns)
// ──────────────────────────────────────────────

function stub<T>(): T {
  return {
    findById: async () => null,
    findMany: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    create: async (data: any) => data,
    update: async () => null,
    delete: async () => false,
  } as T
}

export const hotelRepository = stub<any>()
export const roomRepository = stub<any>()
export const roomBookingRepository = stub<any>()
export const promotionRepository = stub<any>()
export const experienceRepository = stub<any>()
export const experienceBookingRepository = stub<any>()
export const customerRepository = stub<any>()
export const notificationRepository = stub<any>()
export const conversationRepository = stub<any>()
export const messageRepository = stub<any>()
export const supportAgentRepository = stub<any>()
export const conversationRatingRepository = stub<any>()
export const ratingRepository = stub<any>()
export const outgoingMessageRepository = stub<any>()
export const employeeActivityRepository = stub<any>()
export const dispatchZoneRepository = stub<any>()
export const driverPerformanceRepository = stub<any>()
export const driverDocumentRepository = stub<any>()

// Export all repositories
export const repositories = {
  booking: bookingRepository,
  driver: driverRepository,
  vehicle: vehicleRepository,
  assignment: assignmentRepository,
  payment: paymentRepository,
  hotel: hotelRepository,
  room: roomRepository,
  roomBooking: roomBookingRepository,
  promotion: promotionRepository,
  experience: experienceRepository,
  experienceBooking: experienceBookingRepository,
  customer: customerRepository,
  notification: notificationRepository,
  conversation: conversationRepository,
  message: messageRepository,
  supportAgent: supportAgentRepository,
  conversationRating: conversationRatingRepository,
  rating: ratingRepository,
  outgoingMessage: outgoingMessageRepository,
  employeeActivity: employeeActivityRepository,
  dispatchZone: dispatchZoneRepository,
  driverPerformance: driverPerformanceRepository,
  driverDocument: driverDocumentRepository,
}
