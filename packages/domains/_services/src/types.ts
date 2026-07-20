// @lp/domains — Service Contract Types
// Part of B9. Defines the standard interface for all domain services.

// ──────────────────────────────────────────────
// Result Type (Railway-oriented programming)
// ──────────────────────────────────────────────

export type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export interface DomainError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends DomainError>(error: E): Result<never, E> {
  return { ok: false, error }
}

// ──────────────────────────────────────────────
// Pagination (single convention, page 1-indexed)
// ──────────────────────────────────────────────

export interface PaginationParams {
  page: number    // 1-indexed
  limit: number   // 1-100, default 20
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ──────────────────────────────────────────────
// Service Contract (interface every domain service implements)
// ──────────────────────────────────────────────

/**
 * Base contract for all domain services.
 *
 * Every domain service must implement this interface.
 * The service is the SINGLE owner of business logic.
 * API routes call the service; they never contain business logic.
 *
 * Usage pattern:
 *   const service = new BookingService(bookingRepo, assignmentRepo)
 *   const result = await service.createBooking(input)
 *   if (!result.ok) return errorEnvelope(result.error)
 *   return successEnvelope(result.value)
 */
export interface ServiceContract<TDomain, TCreateInput, TUpdateInput, TFilters> {
  /** Find by ID. Returns null if not found. */
  findById(id: number): Promise<Result<TDomain | null>>

  /** Find many with pagination and filters. */
  findMany(params: PaginationParams & { filters?: TFilters }): Promise<Result<PaginatedResult<TDomain>>>

  /** Create a new domain entity. Validates input, applies business rules. */
  create(input: TCreateInput): Promise<Result<TDomain>>

  /** Update an existing domain entity. Validates input, applies business rules. */
  update(id: number, input: TUpdateInput): Promise<Result<TDomain>>

  /** Soft or hard delete. Returns true if deleted. */
  delete(id: number): Promise<Result<boolean>>
}

// ──────────────────────────────────────────────
// Common filter types
// ──────────────────────────────────────────────

export interface DateRangeFilter {
  dateFrom?: string
  dateTo?: string
}

export interface StatusFilter {
  status?: string
}
