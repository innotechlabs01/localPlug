export const CONFIG_DEFAULTS = {
  returnTripCharge: 48,
  serviceFee: 5,
  taxRate: 0.19,
  currency: 'USD',
  advanceBookingDays: 10,
  paymentPollInterval: 2000,
  paymentMaxAttempts: 45,
  paymentTimeout: 60000,
} as const
