type ServiceState = 'closed' | 'open' | 'half-open'

interface CircuitEntry {
  failures: number
  lastFailure: number
  state: ServiceState
  openedAt: number
}

const circuits = new Map<string, CircuitEntry>()

const DEFAULT_THRESHOLD = 5
const DEFAULT_COOLDOWN_MS = 30_000
const DEFAULT_HALF_OPEN_MAX = 3

function getEntry(service: string): CircuitEntry {
  let entry = circuits.get(service)
  if (!entry) {
    entry = { failures: 0, lastFailure: 0, state: 'closed', openedAt: 0 }
    circuits.set(service, entry)
  }
  return entry
}

export function isCircuitOpen(
  service: string,
  threshold: number = DEFAULT_THRESHOLD,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean {
  const entry = getEntry(service)
  const now = Date.now()

  if (entry.state === 'open') {
    if (now - entry.openedAt > cooldownMs) {
      entry.state = 'half-open'
      entry.failures = 0
      return false
    }
    return true
  }

  return false
}

export function recordSuccess(service: string): void {
  const entry = getEntry(service)
  entry.failures = 0
  if (entry.state === 'half-open') {
    entry.state = 'closed'
  }
}

export function recordFailure(
  service: string,
  threshold: number = DEFAULT_THRESHOLD,
): void {
  const entry = getEntry(service)
  const now = Date.now()
  entry.failures++
  entry.lastFailure = now

  if (entry.state === 'half-open') {
    entry.state = 'open'
    entry.openedAt = now
    return
  }

  if (entry.failures >= threshold) {
    entry.state = 'open'
    entry.openedAt = now
  }
}

export function getCircuitState(service: string): ServiceState {
  return getEntry(service).state
}

export function resetCircuit(service: string): void {
  circuits.set(service, {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
    openedAt: 0,
  })
}

export function getCircuitStats(service: string): CircuitEntry {
  return { ...getEntry(service) }
}

export function getAllCircuitStats(): Record<string, CircuitEntry> {
  const result: Record<string, CircuitEntry> = {}
  for (const [key, entry] of circuits) {
    result[key] = { ...entry }
  }
  return result
}
