type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: string
  requestId?: string
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = (process.env.LOG_LEVEL || 'info') as LogLevel
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
  return levels.indexOf(level) >= levels.indexOf(minLevel)
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  if (!shouldLog(level)) return

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
    ...(error ? { error: error.message, stack: error.stack } : {}),
  }

  const output = formatLog(entry)

  if (level === 'error') {
    console.error(output)
  } else if (level === 'warn') {
    console.warn(output)
  } else {
    console.log(output)
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => log('error', message, context, error),
}
