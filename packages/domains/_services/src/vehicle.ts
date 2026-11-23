// @lp/domains — Vehicle Service (Stub)
// Part of B9. Full implementation follows same patterns as BookingService.

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Vehicle {
  id: number
  plate: string
  type: string
  status: string
  fuelType: string | null
  assignedDriverId: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleInput {
  plate: string
  type: string
  fuelType?: string
}

export interface UpdateVehicleInput {
  type?: string
  status?: string
  fuelType?: string
  assignedDriverId?: number | null
}

export interface VehicleFilters {
  status?: string
  type?: string
  fuelType?: string
  driverId?: number
  plate?: string
}

// ──────────────────────────────────────────────
// Repository Contract
// ──────────────────────────────────────────────

export interface VehicleRepository {
  findById(id: number): Promise<Vehicle | null>
  findByPlate(plate: string): Promise<Vehicle | null>
  findMany(params: {
    page: number
    limit: number
    filters?: VehicleFilters
  }): Promise<{ items: Vehicle[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreateVehicleInput): Promise<Vehicle>
  update(id: number, data: UpdateVehicleInput): Promise<Vehicle | null>
  delete(id: number): Promise<boolean>
  getActiveVehicles(): Promise<Vehicle[]>
}

// ──────────────────────────────────────────────
// Vehicle Service
// ──────────────────────────────────────────────

export class VehicleService extends BaseDomainService {
  constructor(private vehicleRepo: VehicleRepository) {
    super('VehicleService')
  }

  async findById(id: number): Promise<Result<Vehicle | null>> {
    const vehicle = await this.vehicleRepo.findById(id)
    return ok(vehicle)
  }

  async findByPlate(plate: string): Promise<Result<Vehicle | null>> {
    const vehicle = await this.vehicleRepo.findByPlate(plate)
    return ok(vehicle)
  }

  async findMany(
    params: PaginationParams & { filters?: VehicleFilters }
  ): Promise<Result<PaginatedResult<Vehicle>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit } = paginationResult.value
    const result = await this.vehicleRepo.findMany({ page, limit, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreateVehicleInput): Promise<Result<Vehicle>> {
    if (!input.plate?.trim()) {
      return this.validationError('Vehicle plate is required')
    }

    const existing = await this.vehicleRepo.findByPlate(input.plate)
    if (existing) {
      return this.alreadyExists(`Vehicle with plate ${input.plate} already exists`)
    }

    const vehicle = await this.vehicleRepo.create(input)
    this.log('info', 'Vehicle created', { id: vehicle.id, plate: vehicle.plate })
    return ok(vehicle)
  }

  async update(id: number, input: UpdateVehicleInput): Promise<Result<Vehicle>> {
    const existing = await this.vehicleRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const updated = await this.vehicleRepo.update(id, input)
    if (!updated) {
      return this.internalError('Failed to update vehicle')
    }

    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.vehicleRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const deleted = await this.vehicleRepo.delete(id)
    return ok(deleted)
  }
}
