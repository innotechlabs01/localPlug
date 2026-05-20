import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPersistence } from '../lib/persistence'
import type { Booking } from '../lib/types'

const store: Record<string, string> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.stubGlobal(
    'localStorage',
    {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k])
      }),
      get length() {
        return Object.keys(store).length
      },
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    } as Storage,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeMockBooking(overrides?: Partial<Booking>): Booking {
  return {
    id: 'test-uuid',
    flight: { flightNumber: 'AA123', airline: 'American', arrivalDate: '2026-06-15', arrivalTime: '14:30' },
    profile: 'nomad',
    destination: { hasPlace: true, address: 'Hotel Medellín', wantsGuatape: false },
    package: 'first-24',
    status: 'draft',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('PersistenceAPI', () => {
  let persistence: ReturnType<typeof createPersistence>

  beforeEach(() => {
    persistence = createPersistence({ latency: 0 })
  })

  describe('saveDraft / loadDraft', () => {
    it('persists a draft to localStorage', async () => {
      const draft = makeMockBooking()
      await persistence.saveDraft(draft)

      const raw = localStorage.getItem('booking_draft')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed.id).toBe('test-uuid')
      expect(parsed.flight.flightNumber).toBe('AA123')
    })

    it('restores a draft from localStorage', async () => {
      const draft = makeMockBooking()
      await persistence.saveDraft(draft)

      const restored = await persistence.loadDraft()
      expect(restored).not.toBeNull()
      expect(restored!.id).toBe('test-uuid')
    })

    it('returns null for expired drafts (>24h)', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const draft = makeMockBooking({ createdAt: oldDate })
      await persistence.saveDraft(draft)

      const restored = await persistence.loadDraft()
      expect(restored).toBeNull()
    })

    it('returns null when no draft exists', async () => {
      const restored = await persistence.loadDraft()
      expect(restored).toBeNull()
    })

    it('silently handles localStorage quota error', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      setItem.mockImplementationOnce(() => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') })

      const draft = makeMockBooking()
      await expect(persistence.saveDraft(draft)).resolves.toBeUndefined()

      setItem.mockRestore()
    })
  })

  describe('retry queue', () => {
    it('enqueues and dequeues a retry entry', async () => {
      const booking = makeMockBooking({ status: 'failed' })
      await persistence.enqueueRetry({
        id: 'retry-1',
        booking,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      })

      const dequeued = await persistence.dequeueRetry()
      expect(dequeued).not.toBeNull()
      expect(dequeued!.id).toBe('retry-1')
    })

    it('returns null when queue is empty', async () => {
      const dequeued = await persistence.dequeueRetry()
      expect(dequeued).toBeNull()
    })

    it('evicts oldest entry when queue exceeds 10', async () => {
      for (let i = 0; i < 11; i++) {
        await persistence.enqueueRetry({
          id: `retry-${i}`,
          booking: makeMockBooking(),
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          retryCount: 0,
        })
      }

      const queue = await persistence.getRetryQueue()
      expect(queue).toHaveLength(10)

      const ids = queue.map((e) => e.id)
      expect(ids).not.toContain('retry-0')
      expect(ids).toContain('retry-10')
    })

    it('removes a retry entry by id', async () => {
      await persistence.enqueueRetry({
        id: 'remove-me',
        booking: makeMockBooking(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      })
      await persistence.removeRetry('remove-me')

      const queue = await persistence.getRetryQueue()
      expect(queue).toHaveLength(0)
    })
  })

  describe('submit', () => {
    it('POSTs to /api/booking and returns success', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'success' }), { status: 200 }),
      )

      const booking = makeMockBooking({ status: 'submitted' })
      const result = await persistence.submit(booking)

      expect(fetchSpy).toHaveBeenCalledWith('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      expect(result.status).toBe('success')

      fetchSpy.mockRestore()
    })

    it('throws when __mock_fail is set in localStorage', async () => {
      localStorage.setItem('__mock_fail', 'true')
      const booking = makeMockBooking()

      await expect(persistence.submit(booking)).rejects.toThrow('Simulated failure')
    })

    it('throws on network error', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('NetworkError'))

      const booking = makeMockBooking()
      await expect(persistence.submit(booking)).rejects.toThrow('NetworkError')

      fetchSpy.mockRestore()
    })
  })

  describe('clear', () => {
    it('clears all booking localStorage keys', async () => {
      await persistence.saveDraft(makeMockBooking())
      localStorage.setItem('__mock_fail', 'true')

      await persistence.clear()

      expect(localStorage.getItem('booking_draft')).toBeNull()
      expect(localStorage.getItem('booking_queue')).toBeNull()
      expect(localStorage.getItem('booking_last_submitted')).toBeNull()
      expect(localStorage.getItem('__mock_fail')).toBeNull()
    })
  })
})
