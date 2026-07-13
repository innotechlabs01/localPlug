// @lp/domains — Base Domain Service
// Part of B9. Provides common utilities for all domain services.

import type { Result, DomainError, PaginatedResult, PaginationParams } from './types'
import { ok, err } from './types'

// ──────────────────────────────────────────────
// Standardized Error Codes
// ──────────────────────────────────────────────

export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// ──────────────────────────────────────────────
// Base Domain Service
// ──────────────────────────────────────────────

/**
 * Base class for all domain services.
 *
 * Provides:
 * - Standardized error creation
 * - Logging with domain context
 * - Pagination validation
 * - Result type helpers
 *
 * Every domain service extends this and adds its own business logic.
 * The service is the SINGLE owner of business logic (Rule 5).
 *
 * @example
 * class BookingService extends BaseDomainService {
 *   constructor(private bookingRepo: BookingRepository) {
 *     super('BookingService')
 *   }
 *
 *   async createBooking(input: CreateBookingInput) {
 *     // validation, business rules, persistence
 *   }
 * }
 */
export abstract class BaseDomainService {
  protected readonly domain: string

  constructor(domain: string) {
    this.domain = domain
  }

  // ──────────────────────────────────────────
  // Error helpers
  // ──────────────────────────────────────────

  protected notFound(id: number): Result<never> {
    return err({
      code: ErrorCode.NOT_FOUND,
      message: `${this.domain} with id ${id} not found`,
    })
  }

  protected validationError(message: string, details?: Record<string, unknown>): Result<never> {
    return err({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      details,
    })
  }

  protected alreadyExists(message: string): Result<never> {
    return err({
      code: ErrorCode.ALREADY_EXISTS,
      message,
    })
  }

  protected conflict(message: string): Result<never> {
    return err({
      code: ErrorCode.CONFLICT,
      message,
    })
  }

  protected unauthorized(message = 'Unauthorized'): Result<never> {
    return err({
      code: ErrorCode.UNAUTHORIZED,
      message,
    })
  }

  protected forbidden(message = 'Forbidden'): Result<never> {
    return err({
      code: ErrorCode.FORBIDDEN,
      message,
    })
  }

  protected internalError(message: string, details?: Record<string, unknown>): Result<never> {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      details,
    })
  }

  // ──────────────────────────────────────────
  // Pagination helpers
  // ──────────────────────────────────────────

  protected validatePagination(params: PaginationParams): Result<PaginationParams> {
    const page = Math.max(1, Math.floor(params.page || 1))
    const limit = Math.min(100, Math.max(1, Math.floor(params.limit || 20)))
    return ok({ ...params, page, limit })
  }

  protected paginateResult<T>(
    items: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    }
  }

  // ──────────────────────────────────────────
  // Logging
  // �─────────────────────────────────────────

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
    const prefix = `[${this.domain}]`
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    logFn(`${prefix} ${message}`, data || '')
  }
}
