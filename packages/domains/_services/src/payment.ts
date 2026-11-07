// @lp/domains — Payment Service (Stub)
// Part of B9. Full implementation follows same patterns as BookingService.

import { BaseDomainService } from './base'
import type { Result, PaginatedResult, PaginationParams } from './types'
import { ok } from './types'

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Payment {
  id: number
  orderId: number
  amount: number
  currency: string
  status: string
  provider: string
  type: string | null
  providerPaymentId: string | null
  providerData: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentInput {
  orderId: number
  amount: number
  currency: string
  provider: string
  type?: string
}

export interface UpdatePaymentInput {
  status?: string
  providerPaymentId?: string
  providerData?: Record<string, unknown>
}

export interface PaymentFilters {
  status?: string
  provider?: string
  type?: string
  bookingId?: number
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
}

// ──────────────────────────────────────────────
// Repository Contract
// ──────────────────────────────────────────────

export interface PaymentRepository {
  findById(id: number): Promise<Payment | null>
  findByOrderId(orderId: number): Promise<Payment[]>
  findByProviderPaymentId(providerId: string): Promise<Payment | null>
  findMany(params: {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: PaymentFilters
  }): Promise<{ items: Payment[]; total: number; page: number; limit: number; totalPages: number }>
  create(data: CreatePaymentInput): Promise<Payment>
  update(id: number, data: UpdatePaymentInput): Promise<Payment | null>
  delete(id: number): Promise<boolean>
  processPayment(paymentId: number, providerPaymentId: string, providerData: Record<string, unknown>): Promise<Payment | null>
  refund(paymentId: number, amount?: number, reason?: string, refundToOriginal?: boolean): Promise<Payment | null>
}

// ──────────────────────────────────────────────
// Payment Service
// ──────────────────────────────────────────────

export class PaymentService extends BaseDomainService {
  constructor(private paymentRepo: PaymentRepository) {
    super('PaymentService')
  }

  async findById(id: number): Promise<Result<Payment | null>> {
    const payment = await this.paymentRepo.findById(id)
    return ok(payment)
  }

  async findMany(
    params: PaginationParams & { filters?: PaymentFilters }
  ): Promise<Result<PaginatedResult<Payment>>> {
    const paginationResult = this.validatePagination(params)
    if (!paginationResult.ok) return paginationResult

    const { page, limit, sortBy, sortOrder } = paginationResult.value
    const result = await this.paymentRepo.findMany({ page, limit, sortBy, sortOrder, filters: params.filters })
    return ok(this.paginateResult(result.items, result.total, { page, limit }))
  }

  async create(input: CreatePaymentInput): Promise<Result<Payment>> {
    if (!input.orderId) {
      return this.validationError('Order ID is required')
    }
    if (input.amount <= 0) {
      return this.validationError('Amount must be positive')
    }

    const payment = await this.paymentRepo.create(input)
    this.log('info', 'Payment created', { id: payment.id, orderId: payment.orderId })
    return ok(payment)
  }

  async update(id: number, input: UpdatePaymentInput): Promise<Result<Payment>> {
    const existing = await this.paymentRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const updated = await this.paymentRepo.update(id, input)
    if (!updated) {
      return this.internalError('Failed to update payment')
    }

    return ok(updated)
  }

  async delete(id: number): Promise<Result<boolean>> {
    const existing = await this.paymentRepo.findById(id)
    if (!existing) {
      return this.notFound(id)
    }

    const deleted = await this.paymentRepo.delete(id)
    return ok(deleted)
  }

  async processPayment(
    paymentId: number,
    providerPaymentId: string,
    providerData: Record<string, unknown>
  ): Promise<Result<Payment>> {
    const existing = await this.paymentRepo.findById(paymentId)
    if (!existing) {
      return this.notFound(paymentId)
    }

    if (existing.status === 'completed') {
      return this.conflict('Payment already completed')
    }

    const processed = await this.paymentRepo.processPayment(paymentId, providerPaymentId, providerData)
    if (!processed) {
      return this.internalError('Failed to process payment')
    }

    this.log('info', 'Payment processed', { id: paymentId })
    return ok(processed)
  }

  async refund(
    paymentId: number,
    amount?: number,
    reason?: string,
    refundToOriginal?: boolean
  ): Promise<Result<Payment>> {
    const existing = await this.paymentRepo.findById(paymentId)
    if (!existing) {
      return this.notFound(paymentId)
    }

    if (existing.status !== 'completed') {
      return this.conflict('Can only refund completed payments')
    }

    const refunded = await this.paymentRepo.refund(paymentId, amount, reason, refundToOriginal)
    if (!refunded) {
      return this.internalError('Failed to process refund')
    }

    this.log('info', 'Payment refunded', { id: paymentId, amount })
    return ok(refunded)
  }
}
