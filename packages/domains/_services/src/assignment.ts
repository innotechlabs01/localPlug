// @lp/domains — Assignment Service (Stub)
// Part of B9. Full implementation follows same patterns as BookingService.

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Assignment {
  id: number
  orderId: number
  driverId: number
  vehicleId: number | null
  type: string
  status: string
  acceptedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAssignmentInput {
  orderId: number
  driverId: number
  vehicleId?: number
  type?: string
  expiresAt?: string
}

export interface UpdateAssignmentInput {
  status?: string
  acceptedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

export interface AssignmentFilters {
  status?: string
  type?: string
  driverId?: number
  vehicleId?: number
  bookingId?: number
  dateFrom?: string
  dateTo?: string
}

// ──────────────────────────────────────────────
// Repository Contract
// ──────────────────────────────────────────────

export interface AssignmentRepository {
  findById(id: number): Promise<Assignment | null>
  findByOrderId(orderId: number): Promise<Assignment | null>
  findMany(params: {
    page: number
    limit: number
    filters?: AssignmentFilters
  }): Promise<{ items: Assignment[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreateAssignmentInput): Promise<Assignment>
  update(id: number, data: UpdateAssignmentInput): Promise<Assignment | null>
  delete(id: number): Promise<boolean>
  broadcastToDrivers(bookingId: number, driverIds: number[], expiresAt: string): Promise<Assignment[]>
  acceptAssignment(assignmentId: number, driverId: number): Promise<Assignment | null>
  rejectAssignment(assignmentId: number, driverId: number, reason: string): Promise<Assignment | null>
}

// ──────────────────────────────────────────────
// Assignment Service
// ──────────────────────────────────────────────

export class AssignmentService extends BaseDomainService {
  constructor(private assignmentRepo: AssignmentRepository) {
    super('AssignmentService')
  }

  async findById(id: number): Promise<Result<Assignment | null>> {
    const assignment = await this.assignmentRepo.findById(id)
    return ok(assignment)
  }

  async findByOrderId(orderId: number): Promise<Result<Assignment | null>> {
    const assignment = await this.assignmentRepo.findByOrderId(orderId)
    return ok(assignment)
  }

  async findMany(
    params: PaginationParams & { filters?: AssignmentFilters }
  ): Promise<Result<PaginatedResult<Assignment>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit } = paginationResult.value
    const result = await this.assignmentRepo.findMany({ page, limit, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreateAssignmentInput): Promise<Result<Assignment>> {
    if (!input.orderId) {
      return this.validationError('Order ID is required')
    }
    if (!input.driverId) {
      return this.validationError('Driver ID is required')
    }

    const assignment = await this.assignmentRepo.create(input)
    this.log('info', 'Assignment created', { id: assignment.id, orderId: assignment.orderId })
    return ok(assignment)
  }

  async update(id: number, input: UpdateAssignmentInput): Promise<Result<Assignment>> {
    const existing = await this.assignmentRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const updated = await this.assignmentRepo.update(id, input)
    if (!updated) {
      return this.internalError('Failed to update assignment')
    }

    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.assignmentRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const deleted = await this.assignmentRepo.delete(id)
    return ok(deleted)
  }

  async broadcastToDrivers(
    bookingId: number,
    driverIds: number[],
    expiresAt: string
  ): Promise<Result<Assignment[]>> {
    if (!driverIds.length) {
      return this.validationError('At least one driver ID is required')
    }

    const assignments = await this.assignmentRepo.broadcastToDrivers(bookingId, driverIds, expiresAt)
    this.log('info', 'Broadcast sent to drivers', { bookingId, driverCount: driverIds.length })
    return ok(assignments)
  }

  async acceptAssignment(assignmentId: number, driverId: number): Promise<Result<Assignment>> {
    const existing = await this.assignmentRepo.findById(assignmentId)
    if (!existing) {
      return this.notFound(assignmentId)
    }

    if (existing.status !== 'pending_acceptance') {
      return this.conflict('Assignment is not pending acceptance')
    }

    if (existing.driverId !== driverId) {
      return this.forbidden('Driver can only accept their own assignments')
    }

    const updated = await this.assignmentRepo.acceptAssignment(assignmentId, driverId)
    if (!updated) {
      return this.internalError('Failed to accept assignment')
    }

    this.log('info', 'Assignment accepted', { assignmentId, driverId })
    return ok(updated)
  }

  async rejectAssignment(
    assignmentId: number,
    driverId: number,
    reason: string
  ): Promise<Result<Assignment>> {
    const existing = await this.assignmentRepo.findById(assignmentId)
    if (!existing) {
      return this.notFound(assignmentId)
    }

    if (existing.status !== 'pending_acceptance') {
      return this.conflict('Assignment is not pending acceptance')
    }

    if (existing.driverId !== driverId) {
      return this.forbidden('Driver can only reject their own assignments')
    }

    const updated = await this.assignmentRepo.rejectAssignment(assignmentId, driverId, reason)
    if (!updated) {
      return this.internalError('Failed to reject assignment')
    }

    this.log('info', 'Assignment rejected', { assignmentId, driverId, reason })
    return ok(updated)
  }
}
