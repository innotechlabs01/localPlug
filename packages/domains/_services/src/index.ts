// @lp/domains — Domain Services
// Part of B9. Standard service shape for all domains.

// Types and contracts
export type {
  Result,
  DomainError,
  PaginationParams,
  PaginatedResult,
  ServiceContract,
  DateRangeFilter,
  StatusFilter,
} from './types'
export { ok, err } from './types'

// Base service
export { BaseDomainService, ErrorCode } from './base'
export type { ErrorCode as ErrorCodeType } from './base'

// Domain services
export { BookingService } from './booking'
export type {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilters,
  BookingRepository,
} from './booking'

export { PaymentService } from './payment'
export type {
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  PaymentFilters,
  PaymentRepository,
} from './payment'

export { DriverService } from './driver'
export type {
  Driver,
  CreateDriverInput,
  UpdateDriverInput,
  DriverFilters,
  DriverRepository,
} from './driver'

export { VehicleService } from './vehicle'
export type {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleFilters,
  VehicleRepository,
} from './vehicle'

export { AssignmentService } from './assignment'
export type {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentFilters,
  AssignmentRepository,
} from './assignment'

export { NotificationService } from './notification'
export type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationRepository,
} from './notification'
