'use client'

export interface FlightValidationResult {
  valid: boolean
  airlineName?: string
  flightNumber?: string
  error?: string
}

export interface FlightValidationParams {
  airline: string
  flightNumber: string
}

export interface FlightValidationService {
  validateFlight: (params: FlightValidationParams) => Promise<FlightValidationResult>
}

async function findFlight(airline: string, flightNumber: string): Promise<FlightValidationResult> {
  try {
    const res = await fetch(`/api/flights/validate?airline=${encodeURIComponent(airline)}&flightNumber=${encodeURIComponent(flightNumber)}`)
    if (!res.ok) {
      return { valid: false, error: 'Validation service unavailable' }
    }
    return await res.json()
  } catch {
    return { valid: false, error: 'Validation service unavailable' }
  }
}

export async function searchFlights(airline: string, flightNumber: string): Promise<FlightValidationResult> {
  return findFlight(airline, flightNumber)
}

export function createFlightValidation(options?: { latency?: number }): FlightValidationService {
  const latency = options?.latency ?? 200

  return {
    validateFlight: async ({ airline, flightNumber }: FlightValidationParams): Promise<FlightValidationResult> => {
      await new Promise((r) => setTimeout(r, latency))

      const trimmedAirline = airline.trim().toLowerCase()
      const trimmedFlight = flightNumber.trim().toUpperCase()

      if (!trimmedAirline || !trimmedFlight) {
        return { valid: false, error: 'Missing required fields' }
      }

      const result = await findFlight(trimmedAirline, trimmedFlight)

      if (result.valid) {
        return { valid: true, airlineName: result.airlineName, flightNumber: result.flightNumber }
      }
      if (result.error) {
        return { valid: false, error: result.error }
      }

      return { valid: false }
    },
  }
}
