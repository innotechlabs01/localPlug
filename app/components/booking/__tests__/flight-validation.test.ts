import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createFlightValidation } from '../lib/flight-validation'

beforeEach(() => {
  localStorage.removeItem('__mock_fail')
})

afterEach(() => {
  localStorage.removeItem('__mock_fail')
})

describe('createFlightValidation', () => {
  it('validates a known flight by airline name', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(true)
    expect(result.airlineName).toBe('American Airlines')
    expect(result.flightNumber).toBe('AA1123')
  })

  it('validates a known flight by IATA code', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'AA',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(true)
    expect(result.airlineName).toBe('American Airlines')
  })

  it('returns invalid for an unknown airline', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'Unknown Airline',
      flightNumber: 'XX9999',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('returns invalid for a valid airline but unknown flight number', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: 'AA9999',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('handles service failure when __mock_fail is set', async () => {
    localStorage.setItem('__mock_fail', 'true')
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Validation service unavailable')
  })

  it('returns invalid for empty airline', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: '',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing required fields')
  })

  it('returns invalid for empty flight number', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: '',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing required fields')
  })

  it('normalizes flight number with whitespace', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: '  AA1123  ',
    })
    expect(result.valid).toBe(true)
  })

  it('normalizes airline with different casing', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'american airlines',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(true)
  })

  it('validates by IATA code with lowercase input', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'aa',
      flightNumber: 'AA1123',
    })
    expect(result.valid).toBe(true)
    expect(result.airlineName).toBe('American Airlines')
  })

  it('handles flight number with only numeric part', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: '1123',
    })
    expect(result.valid).toBe(true)
  })

  it('uses default latency when not specified', async () => {
    const service = createFlightValidation()
    const start = Date.now()
    await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: 'AA1123',
    })
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(190)
  })

  it('validates Avianca flights', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'Avianca',
      flightNumber: 'AV123',
    })
    expect(result.valid).toBe(true)
    expect(result.airlineName).toBe('Avianca')
  })

  it('rejects flight number that does not match airline IATA prefix but is valid for another', async () => {
    const service = createFlightValidation({ latency: 0 })
    const result = await service.validateFlight({
      airline: 'American Airlines',
      flightNumber: 'AV123',
    })
    expect(result.valid).toBe(false)
  })
})
