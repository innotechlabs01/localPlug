// @lp/domains — Notification Service (Stub)
// Part of B9. Full implementation in B11 (notifications domain).

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Notification {
  id: number
  type: string
  channel: string
  recipientId: number
  recipientType: string
  title: string
  body: string
  status: string
  sentAt: string | null
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface CreateNotificationInput {
  type: string
  channel: string
  recipientId: number
  recipientType: string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export interface NotificationFilters {
  type?: string
  channel?: string
  recipientId?: number
  recipientType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// ──────────────────────────────────────────────
// Repository Contract
// ──────────────────────────────────────────────

export interface NotificationRepository {
  findById(id: number): Promise<Notification | null>
  findMany(params: {
    page: number
    limit: number
    filters?: NotificationFilters
  }): Promise<{ items: Notification[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreateNotificationInput): Promise<Notification>
  update(id: number, data: Partial<Notification>): Promise<Notification | null>
  delete(id: number): Promise<boolean>
}

// ──────────────────────────────────────────────
// Notification Service
// ──────────────────────────────────────────────

export class NotificationService extends BaseDomainService {
  constructor(private notificationRepo: NotificationRepository) {
    super('NotificationService')
  }

  async findById(id: number): Promise<Result<Notification | null>> {
    const notification = await this.notificationRepo.findById(id)
    return ok(notification)
  }

  async findMany(
    params: PaginationParams & { filters?: NotificationFilters }
  ): Promise<Result<PaginatedResult<Notification>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit } = paginationResult.value
    const result = await this.notificationRepo.findMany({ page, limit, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreateNotificationInput): Promise<Result<Notification>> {
    if (!input.type?.trim()) {
      return this.validationError('Notification type is required')
    }
    if (!input.recipientId) {
      return this.validationError('Recipient ID is required')
    }

    const notification = await this.notificationRepo.create(input)
    this.log('info', 'Notification created', { id: notification.id, type: notification.type })
    return ok(notification)
  }

  async markAsRead(id: number): Promise<Result<Notification>> {
    const existing = await this.notificationRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const updated = await this.notificationRepo.update(id, {
      readAt: new Date().toISOString(),
    })
    if (!updated) {
      return this.internalError('Failed to mark notification as read')
    }

    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.notificationRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const deleted = await this.notificationRepo.delete(id)
    return ok(deleted)
  }
}
