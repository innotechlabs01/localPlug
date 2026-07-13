// Logger interface primitive. Implementations may be injected by apps/runtimes.
export interface Logger {
  debug(message: string, meta?: unknown): void
  info(message: string, meta?: unknown): void
  warn(message: string, meta?: unknown): void
  error(message: string, meta?: unknown): void
}

export const consoleLogger: Logger = {
  debug: (m, meta) => console.debug(m, meta ?? ''),
  info: (m, meta) => console.info(m, meta ?? ''),
  warn: (m, meta) => console.warn(m, meta ?? ''),
  error: (m, meta) => console.error(m, meta ?? ''),
}
