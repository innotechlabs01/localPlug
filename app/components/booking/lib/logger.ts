export function logBookingEvent(event: string, data: unknown) {
  console.log(
    `[Booking] ${event}`,
    JSON.stringify(data, null, 2),
  )
}

export function logBookingError(event: string, error: unknown) {
  console.warn(
    `[Booking] ${event} failed:`,
    error instanceof Error ? error.message : String(error),
  )
}
