import { describe, it, expect, beforeEach } from 'vitest'
import { bookingStore } from '../lib/booking-store'
import type { Booking } from '../lib/types'

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'test-id',
  flight: { flightNumber: 'AA1123', airline: 'American Airlines', arrivalDate: '2026-07-01', arrivalTime: '14:00' },
  profile: 'nomad',
  destination: { hasPlace: true, address: 'Hotel Medellín', wantsGuatape: false },
  package: 'first-24',
  status: 'submitted',
  createdAt: '2026-05-15T10:00:00.000Z',
  submittedAt: '2026-05-15T10:00:00.000Z',
  ...overrides,
})

beforeEach(() => {
  bookingStore.clear()
})

describe('bookingStore', () => {
  it('stores and retrieves a booking by flight number and airline', () => {
    const booking = makeBooking()
    bookingStore.add(booking)

    const results = bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('test-id')
  })

  it('returns empty array when no match is found', () => {
    bookingStore.add(makeBooking())
    const results = bookingStore.search('Unknown Airline', 'XX0000')
    expect(results).toHaveLength(0)
  })

  it('returns multiple bookings for the same flight', () => {
    const b1 = makeBooking({ id: 'booking-1', profile: 'nomad' })
    const b2 = makeBooking({ id: 'booking-2', profile: 'family' })
    bookingStore.add(b1)
    bookingStore.add(b2)

    const results = bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(2)
  })

  it('performs case-insensitive search', () => {
    bookingStore.add(makeBooking())
    const results = bookingStore.search('american airlines', 'aa1123')
    expect(results).toHaveLength(1)
  })

  it('handles whitespace in search terms', () => {
    bookingStore.add(makeBooking())
    const results = bookingStore.search('  American Airlines  ', '  AA1123  ')
    expect(results).toHaveLength(1)
  })

  it('returns empty array when store is empty', () => {
    const results = bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(0)
  })

  it('ignores bookings without airline or flight number', () => {
    const booking1 = makeBooking({ flight: { ...makeBooking().flight, airline: '' } })
    const booking2 = makeBooking({ flight: { ...makeBooking().flight, flightNumber: '' } })
    bookingStore.add(booking1)
    bookingStore.add(booking2)
    expect(bookingStore.count()).toBe(0)
  })

  it('clears all entries on clear()', () => {
    bookingStore.add(makeBooking())
    expect(bookingStore.count()).toBe(1)
    bookingStore.clear()
    expect(bookingStore.count()).toBe(0)
  })

  it('returns isolated arrays so mutating results does not mutate internal store', () => {
    bookingStore.add(makeBooking())
    const results = bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(1)
    results.pop()
    expect(bookingStore.search('American Airlines', 'AA1123')).toHaveLength(1)
  })

  it('efficiently indexes and retrieves across many distinct flight entries', () => {
    const total = 5000
    for (let i = 0; i < total; i++) {
      bookingStore.add(
        makeBooking({
          id: `booking-${i}`,
          flight: {
            airline: `Airline-${i % 50}`,
            flightNumber: `FL${i % 50}`,
            arrivalDate: '2026-07-01',
            arrivalTime: '14:00',
          },
        }),
      )
    }

    expect(bookingStore.count()).toBe(total)
    const targetResults = bookingStore.search('Airline-10', 'FL10')
    expect(targetResults.length).toBe(100) // 5000 total / 50 keys = 100 entries per key
    expect(targetResults.every((b) => b.flight.airline === 'Airline-10' && b.flight.flightNumber === 'FL10')).toBe(true)
  })
})
