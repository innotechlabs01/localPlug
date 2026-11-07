// @lp/domains — Driver Service (Stub)
// Part of B9. Full implementation follows same patterns as BookingService.

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Driver {
  id: number
  userId: number
  clerkId: string
  status: string
  isOnline: boolean
  vehicleId: number | null
  licenseType: string | null
  preferredZones: string | null
  currentLat: number | null
  currentLng: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateDriverInput {
  userId: number
  clerkId: string
  status?: string
  licenseType?: string
  preferredZones?: string
}

export interface UpdateDriverInput {
  status?: string
  isOnline?: boolean
  vehicleId?: number | null
  licenseType?: string
  preferredZones?: string
  currentLat?: number | null
  currentLng?: number | null
}

export interface DriverFilters {
  status?: string
  vehicleId?: number
  licenseType?: string
  zone?: string
}

// ──────────────────────────────────────────────
// Repository Contract
// ──────────────────────────────────────────────

export interface DriverRepository {
  findById(id: number): Promise<Driver | null>
  findByClerkId(clerkId: string): Promise<Driver | null>
  findMany(params: {
    page: number
    limit: number
    filters?: DriverFilters
  }): Promise<{ items: Driver[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreateDriverInput): Promise<Driver>
  update(id: number, data: UpdateDriverInput): Promise<Driver | null>
  delete(id: number): Promise<boolean>
  updateAvailability(driverId: number, isAvailable: boolean, location?: { lat: number; lng: number }): Promise<Driver | null>
  getAvailableDrivers(zoneId?: number, vehicleType?: string): Promise<Driver[]>
}

// ──────────────────────────────────────────────
// Driver Service
// ──────────────────────────────────────────────

export class DriverService extends BaseDomainService {
  constructor(private driverRepo: DriverRepository) {
    super('DriverService')
  }

  async findById(id: number): Promise<Result<Driver | null>> {
    const driver = await this.driverRepo.findById(id)
    return ok(driver)
  }

  async findByClerkId(clerkId: string): Promise<Result<Driver | null>> {
    const driver = await this.driverRepo.findByClerkId(clerkId)
    return ok(driver)
  }

  async findMany(
    params: PaginationParams & { filters?: DriverFilters }
  ): Promise<Result<PaginatedResult<Driver>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit } = paginationResult.value
    const result = await this.driverRepo.findMany({ page, limit, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreateDriverInput): Promise<Result<Driver>> {
    if (!input.clerkId?.trim()) {
      return this.validationError('Clerk ID is required')
    }

    const existing = await this.driverRepo.findByClerkId(input.clerkId)
    if (existing) {
      return this.alreadyExists('Driver with this Clerk ID already exists')
    }

    const driver = await this.driverRepo.create(input)
    this.log('info', 'Driver created', { id: driver.id })
    return ok(driver)
  }

  async update(id: number, input: UpdateDriverInput): Promise<Result<Driver>> {
    const existing = await this.driverRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const updated = await this.driverRepo.update(id, input)
    if (!updated) {
      return this.internalError('Failed to update driver')
    }

    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.driverRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const deleted = await this.driverRepo.delete(id)
    return ok(deleted)
  }

  async updateAvailability(
    driverId: number,
    isAvailable: boolean,
    location?: { lat: number; lng: number }
  ): Promise<Result<Driver>> {
    const existing = await this.driverRepo.findById(driverId)
    if (!existing) {
      return this.notFound(driverId)
    }

    const updated = await this.driverRepo.updateAvailability(driverId, isAvailable, location)
    if (!updated) {
      return this.internalError('Failed to update availability')
    }

    this.log('info', 'Driver availability updated', { driverId, isAvailable })
    return ok(updated)
  }
}
