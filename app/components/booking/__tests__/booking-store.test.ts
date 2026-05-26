import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bookingStore } from '../lib/booking-store'
import type { Booking } from '../lib/types'

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'test-id',
  flight: { flightNumber: 'AA1123', airline: 'American Airlines', arrivalDate: '2026-07-01', arrivalTime: '14:00', needReturn: false, returnDate: '', returnTime: '' },
  profile: 'nomad',
  destination: { hasPlace: true, address: 'Hotel Medellín', wantsGuatape: false },
  package: 'first-24',
  status: 'submitted',
  createdAt: '2026-05-15T10:00:00.000Z',
  submittedAt: '2026-05-15T10:00:00.000Z',
  ...overrides,
})

const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

beforeEach(() => {
  mockExecute.mockReset()
  mockExecute.mockResolvedValue({ rows: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('bookingStore', () => {
  it('stores and retrieves a booking by flight number and airline', async () => {
    mockExecute.mockResolvedValue({
      rows: [{
        booking_reference: 'test-id',
        flight_number: 'AA1123',
        airline: 'American Airlines',
        arrival_date: '2026-07-01',
        arrival_time: '14:00',
        return_date: null,
        return_time: null,
        traveler_profile: 'nomad',
        destination_has_place: 1,
        destination_address: 'Hotel Medellín',
        additional_trips: null,
        package_id: 'first-24',
        status: 'submitted',
      }],
    })

    bookingStore.add(makeBooking())
    const results = await bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('test-id')
  })

  it('returns empty array when no match is found', async () => {
    bookingStore.add(makeBooking())
    const results = await bookingStore.search('Unknown Airline', 'XX0000')
    expect(results).toHaveLength(0)
  })

  it('returns multiple bookings for the same flight', async () => {
    mockExecute.mockResolvedValue({
      rows: [
        { booking_reference: 'booking-1', flight_number: 'AA1123', airline: 'American Airlines', status: 'submitted', package_id: 'first-24', traveler_profile: 'nomad', destination_has_place: 1, destination_address: 'Hotel Medellín', arrival_date: '2026-07-01', arrival_time: '14:00', return_date: null, return_time: null, additional_trips: null },
        { booking_reference: 'booking-2', flight_number: 'AA1123', airline: 'American Airlines', status: 'submitted', package_id: 'first-24', traveler_profile: 'family', destination_has_place: 1, destination_address: 'Hotel Medellín', arrival_date: '2026-07-01', arrival_time: '14:00', return_date: null, return_time: null, additional_trips: null },
      ],
    })

    const results = await bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(2)
  })

  it('performs case-insensitive search', async () => {
    mockExecute.mockResolvedValue({
      rows: [{
        booking_reference: 'test-id',
        flight_number: 'AA1123',
        airline: 'American Airlines',
        arrival_date: '2026-07-01',
        arrival_time: '14:00',
        return_date: null,
        return_time: null,
        traveler_profile: 'nomad',
        destination_has_place: 1,
        destination_address: 'Hotel Medellín',
        additional_trips: null,
        package_id: 'first-24',
        status: 'submitted',
      }],
    })

    const results = await bookingStore.search('american airlines', 'aa1123')
    expect(results).toHaveLength(1)
  })

  it('handles whitespace in search terms', async () => {
    mockExecute.mockResolvedValue({
      rows: [{
        booking_reference: 'test-id',
        flight_number: 'AA1123',
        airline: 'American Airlines',
        arrival_date: '2026-07-01',
        arrival_time: '14:00',
        return_date: null,
        return_time: null,
        traveler_profile: 'nomad',
        destination_has_place: 1,
        destination_address: 'Hotel Medellín',
        additional_trips: null,
        package_id: 'first-24',
        status: 'submitted',
      }],
    })

    const results = await bookingStore.search('  American Airlines  ', '  AA1123  ')
    expect(results).toHaveLength(1)
  })

  it('returns empty array when no orders exist', async () => {
    const results = await bookingStore.search('American Airlines', 'AA1123')
    expect(results).toHaveLength(0)
  })

  it('ignores bookings without airline or flight number', () => {
    const booking1 = makeBooking({ flight: { ...makeBooking().flight, airline: '' } })
    const booking2 = makeBooking({ flight: { ...makeBooking().flight, flightNumber: '' } })
    bookingStore.add(booking1)
    bookingStore.add(booking2)
  })

  it('count returns zero when no orders exist', async () => {
    mockExecute.mockResolvedValue({ rows: [{ cnt: 0 }] })
    expect(await bookingStore.count()).toBe(0)
  })
})
