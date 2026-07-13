// @lp/domains — Booking Service (Reference Implementation)
// Part of B9. First domain service following the Persistence Architecture contract.
// Follows PERSISTENCE_ARCHITECTURE.md: Service owns business logic, repos own persistence.

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Booking {
  id: number
  bookingReference: string
  status: string
  dispatchStatus: string | null
  contactEmail: string
  contactPhone: string
  arrivalDate: string
  arrivalTime: string
  returnDate: string | null
  returnTime: string | null
  hotelId: number | null
  driverId: number | null
  vehicleId: number | null
  assignedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBookingInput {
  bookingReference: string
  contactEmail: string
  contactPhone: string
  arrivalDate: string
  arrivalTime: string
  returnDate?: string
  returnTime?: string
  hotelId?: number
}

export interface UpdateBookingInput {
  contactEmail?: string
  contactPhone?: string
  arrivalDate?: string
  arrivalTime?: string
  returnDate?: string | null
  returnTime?: string | null
  hotelId?: number | null
  driverId?: number | null
  vehicleId?: number | null
  dispatchStatus?: string
}

export interface BookingFilters {
  status?: string
  dispatchStatus?: string
  driverId?: number
  hotelId?: number
  passengerEmail?: string
  passengerPhone?: string
  dateFrom?: string
  dateTo?: string
}

// ──────────────────────────────────────────────
// Repository Contract (implemented by @lp/db)
// ──────────────────────────────────────────────

export interface BookingRepository {
  findById(id: number): Promise<Booking | null>
  findByBookingReference(ref: string): Promise<Booking | null>
  findMany(params: {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: BookingFilters
  }): Promise<{ items: Booking[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreateBookingInput): Promise<Booking>
  update(id: number, data: UpdateBookingInput): Promise<Booking | null>
  delete(id: number): Promise<boolean>
  updateStatus(id: number, status: string, changedBy?: number, notes?: string): Promise<Booking | null>
  getTotalCount(): Promise<number>
}

// ──────────────────────────────────────────────
// Booking Service
// ──────────────────────────────────────────────

/**
 * BookingService is the SINGLE owner of booking business logic.
 *
 * API routes call this service; they never contain business logic.
 * Persistence is delegated to BookingRepository.
 *
 * @example
 * // In an API route:
 * const service = new BookingService(bookingRepo)
 * const result = await service.findById(123)
 * if (!result.ok) return errorEnvelope(result.error)
 * return successEnvelope(result.value)
 */
export class BookingService extends BaseDomainService {
  constructor(private bookingRepo: BookingRepository) {
    super('BookingService')
  }

  async findById(id: number): Promise<Result<Booking | null>> {
    const booking = await this.bookingRepo.findById(id)
    return ok(booking)
  }

  async findByReference(ref: string): Promise<Result<Booking | null>> {
    if (!ref || ref.trim().length === 0) {
      return this.validationError('Booking reference is required')
    }
    const booking = await this.bookingRepo.findByBookingReference(ref)
    return ok(booking)
  }

  async findMany(
    params: PaginationParams & { filters?: BookingFilters }
  ): Promise<Result<PaginatedResult<Booking>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit, sortBy, sortOrder } = paginationResult.value
    const result = await this.bookingRepo.findMany({ page, limit, sortBy, sortOrder, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreateBookingInput): Promise<Result<Booking>> {
    // Validate required fields
    if (!input.bookingReference?.trim()) {
      return this.validationError('Booking reference is required')
    }
    if (!input.contactEmail?.trim()) {
      return this.validationError('Contact email is required')
    }
    if (!input.arrivalDate) {
      return this.validationError('Arrival date is required')
    }

    // Check for duplicate booking reference
    const existing = await this.bookingRepo.findByBookingReference(input.bookingReference)
    if (existing) {
      return this.alreadyExists(`Booking with reference ${input.bookingReference} already exists`)
    }

    // Business rule: arrival date must be today or future
    const arrivalDate = new Date(input.arrivalDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (arrivalDate < today) {
      return this.validationError('Arrival date must be today or in the future')
    }

    // Business rule: if return date provided, it must be after arrival date
    if (input.returnDate) {
      const returnDate = new Date(input.returnDate)
      if (returnDate < arrivalDate) {
        return this.validationError('Return date must be after arrival date')
      }
    }

    const booking = await this.bookingRepo.create(input)
    this.log('info', 'Booking created', { id: booking.id, reference: booking.bookingReference })
    return ok(booking)
  }

  async update(id: number, input: UpdateBookingInput): Promise<Result<Booking>> {
    const existing = await this.bookingRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    // Business rule: cannot update a confirmed booking
    if (existing.status === 'confirmed') {
      return this.conflict('Cannot update a confirmed booking')
    }

    // Business rule: if return date provided, it must be after arrival date
    if (input.returnDate && input.arrivalDate) {
      const returnDate = new Date(input.returnDate)
      const arrivalDate = new Date(input.arrivalDate)
      if (returnDate < arrivalDate) {
        return this.validationError('Return date must be after arrival date')
      }
    }

    const updated = await this.bookingRepo.update(id, input)
    if (!updated) {
      return this.internalError('Failed to update booking')
    }

    this.log('info', 'Booking updated', { id })
    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.bookingRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    // Business rule: cannot delete a confirmed booking
    if (existing.status === 'confirmed') {
      return this.conflict('Cannot delete a confirmed booking')
    }

    const deleted = await this.bookingRepo.delete(id)
    this.log('info', 'Booking deleted', { id })
    return ok(deleted)
  }

  async updateStatus(
    id: number,
    status: string,
    changedBy?: number,
    notes?: string
  ): Promise<Result<Booking>> {
    const existing = await this.bookingRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    // Business rule: validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['submitted'],
      submitted: ['confirmed', 'failed'],
      confirmed: [],
      failed: ['submitted'],
    }

    const allowed = validTransitions[existing.status] || []
    if (!allowed.includes(status)) {
      return this.conflict(
        `Cannot transition from ${existing.status} to ${status}`
      )
    }

    const updated = await this.bookingRepo.updateStatus(id, status, changedBy, notes)
    if (!updated) {
      return this.internalError('Failed to update booking status')
    }

    this.log('info', 'Booking status updated', { id, from: existing.status, to: status })
    return ok(updated)
  }

  async assignDriver(
    bookingId: number,
    driverId: number,
    vehicleId: number,
    assignedBy: number
  ): Promise<Result<Booking>> {
    const existing = await this.bookingRepo.findById(bookingId)
    if (!existing) {
      return this.notFound(bookingId)
    }

    // Business rule: can only assign to submitted bookings
    if (existing.status !== 'submitted') {
      return this.conflict('Can only assign drivers to submitted bookings')
    }

    // Business rule: cannot reassign if already assigned
    if (existing.driverId) {
      return this.conflict('Booking already has a driver assigned')
    }

    const updated = await this.bookingRepo.update(bookingId, {
      driverId,
      hotelId: existing.hotelId,
    })

    if (!updated) {
      return this.internalError('Failed to assign driver')
    }

    this.log('info', 'Driver assigned to booking', {
      bookingId,
      driverId,
      vehicleId,
      assignedBy,
    })
    return ok(updated)
  }
}
