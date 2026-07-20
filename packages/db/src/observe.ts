// Observability wrapper for database client migration.
// Provides lightweight metrics to compare Legacy vs Drizzle paths during rollout.
// Remove after Drizzle is proven in production and legacy path is retired.

export interface DbMetrics {
  label: string
  requestCount: number
  errorCount: number
  totalLatencyMs: number
  lastResetAt: Date
}

const metrics = new Map<string, DbMetrics>()

export function getMetrics(label: string): DbMetrics {
  if (!metrics.has(label)) {
    metrics.set(label, {
      label,
      requestCount: 0,
      errorCount: 0,
      totalLatencyMs: 0,
      lastResetAt: new Date(),
    })
  }
  return metrics.get(label)!
}

export function recordRequest(label: string, latencyMs: number, isError: boolean) {
  const m = getMetrics(label)
  m.requestCount++
  m.totalLatencyMs += latencyMs
  if (isError) m.errorCount++
}

export function resetMetrics(label: string) {
  metrics.delete(label)
}

export function logMetrics() {
  for (const m of metrics.values()) {
    const avgLatency = m.requestCount > 0 ? (m.totalLatencyMs / m.requestCount).toFixed(1) : '0'
    // eslint-disable-next-line no-console
    console.log(
      `[DB ${m.label}] requests=${m.requestCount} errors=${m.errorCount} avgLatency=${avgLatency}ms`,
    )
  }
}

// Expose metrics endpoint for admin health check
export function getAllMetrics(): DbMetrics[] {
  return Array.from(metrics.values())
}
