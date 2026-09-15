// @lp/events — Lightweight in-memory metrics recorder.
//
// Wraps metric emission so the rest of the app can safely record business
// metrics (latencies, counters, gauges) without depending on a specific
// backend. The default recorder buffers metrics in memory and logs them via
// console.debug. A Prometheus / StatsD exporter can subscribe via
// setMetricSink() so metrics are scraped/exported at the deployment layer.

export interface MetricSample {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: number
}

export type MetricSink = (sample: MetricSample) => void

let buffer: MetricSample[] = []
let sink: MetricSink | null = null

/** Replace the default sink (e.g. wire a Prometheus/StatsD exporter). */
export function setMetricSink(next: MetricSink | null): void {
  sink = next
}

/** Record a single metric sample (default: buffered + debug log, no-op safe). */
export function recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
  const sample: MetricSample = { name, value, tags, timestamp: Date.now() }
  // Bound the buffer to avoid unbounded growth in long-running processes.
  if (buffer.length > 10_000) buffer = buffer.slice(-5000)
  buffer.push(sample)
  if (sink) {
    try {
      sink(sample)
    } catch (err) {
      console.error('[recordMetric] sink error', err)
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[metric] ${name} = ${value}`, tags)
  }
}

/** Return a snapshot of the in-memory metric buffer. */
export function getMetricsBuffer(): MetricSample[] {
  return buffer
}

/** Clear the in-memory metric buffer (used mainly in tests). */
export function clearMetricsBuffer(): void {
  buffer = []
}