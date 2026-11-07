import type { Booking, PersistenceQueueEntry } from './types'

const DRAFT_KEY = 'booking_draft'
const QUEUE_KEY = 'booking_queue'
const LAST_SUBMITTED_KEY = 'booking_last_submitted'

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000
const MAX_QUEUE_SIZE = 10
const DEFAULT_LATENCY = 200

interface PersistenceOptions {
  latency?: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // noop
  }
}

export function createPersistence(options?: PersistenceOptions) {
  const latency = options?.latency ?? DEFAULT_LATENCY

  async function saveDraft(booking: Partial<Booking>): Promise<void> {
    await delay(latency)
    safeSetItem(DRAFT_KEY, JSON.stringify(booking))
  }

  async function loadDraft(): Promise<Partial<Booking> | null> {
    await delay(latency)
    const raw = safeGetItem(DRAFT_KEY)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as Partial<Booking>
      if (parsed.createdAt) {
        const age = Date.now() - new Date(parsed.createdAt).getTime()
        if (age > DRAFT_TTL_MS) {
          safeRemoveItem(DRAFT_KEY)
          return null
        }
      }
      return parsed
    } catch {
      safeRemoveItem(DRAFT_KEY)
      return null
    }
  }

  async function enqueueRetry(entry: PersistenceQueueEntry): Promise<void> {
    await delay(latency)
    const raw = safeGetItem(QUEUE_KEY)
    let queue: PersistenceQueueEntry[] = raw ? tryParseJSON(raw) : []

    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift()
    }

    queue.push(entry)
    safeSetItem(QUEUE_KEY, JSON.stringify(queue))
  }

  async function dequeueRetry(): Promise<PersistenceQueueEntry | null> {
    await delay(latency)
    const raw = safeGetItem(QUEUE_KEY)
    if (!raw) return null

    const queue: PersistenceQueueEntry[] = tryParseJSON(raw)
    if (queue.length === 0) return null

    const entry = queue.shift()!
    safeSetItem(QUEUE_KEY, JSON.stringify(queue))
    return entry
  }

  async function getRetryQueue(): Promise<PersistenceQueueEntry[]> {
    await delay(latency)
    const raw = safeGetItem(QUEUE_KEY)
    if (!raw) return []
    return tryParseJSON(raw)
  }

  async function removeRetry(id: string): Promise<void> {
    await delay(latency)
    const raw = safeGetItem(QUEUE_KEY)
    if (!raw) return

    const queue: PersistenceQueueEntry[] = tryParseJSON(raw)
    const filtered = queue.filter((e) => e.id !== id)
    safeSetItem(QUEUE_KEY, JSON.stringify(filtered))
  }

  async function submit(booking: Booking): Promise<{ status: string }> {
    await delay(latency)
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    })

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`)
    }

    const data = await res.json()
    safeSetItem(LAST_SUBMITTED_KEY, JSON.stringify(booking))
    safeRemoveItem(DRAFT_KEY)
    return data
  }

  async function clear(): Promise<void> {
    await delay(latency)
    safeRemoveItem(DRAFT_KEY)
    safeRemoveItem(QUEUE_KEY)
    safeRemoveItem(LAST_SUBMITTED_KEY)
  }

  return {
    saveDraft,
    loadDraft,
    enqueueRetry,
    dequeueRetry,
    getRetryQueue,
    removeRetry,
    submit,
    clear,
  }
}

function tryParseJSON(raw: string) {
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export type PersistenceAPI = ReturnType<typeof createPersistence>
