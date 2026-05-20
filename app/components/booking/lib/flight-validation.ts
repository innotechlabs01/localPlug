'use client'

interface AirlineEntry {
  name: string
  iata: string
  flights: string[]
}

const airlineDb: Record<string, AirlineEntry> = {
  'american airlines': { name: 'American Airlines', iata: 'AA', flights: ['AA1123', 'AA123', 'AA456'] },
  'aa': { name: 'American Airlines', iata: 'AA', flights: ['AA1123', 'AA123', 'AA456'] },
  'avianca': { name: 'Avianca', iata: 'AV', flights: ['AV123'] },
  'av': { name: 'Avianca', iata: 'AV', flights: ['AV123'] },
}

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

export function createFlightValidation(options?: { latency?: number }): FlightValidationService {
  const latency = options?.latency ?? 200

  return {
    validateFlight: async ({ airline, flightNumber }: FlightValidationParams): Promise<FlightValidationResult> => {
      await new Promise((r) => setTimeout(r, latency))

      if (localStorage.getItem('__mock_fail') === 'true') {
        return { valid: false, error: 'Validation service unavailable' }
      }

      const trimmedAirline = airline.trim().toLowerCase()
      const trimmedFlight = flightNumber.trim().toUpperCase()

      if (!trimmedAirline || !trimmedFlight) {
        return { valid: false, error: 'Missing required fields' }
      }

      const airlineEntry = airlineDb[trimmedAirline]
      if (!airlineEntry) {
        return { valid: false }
      }

      const flightStartsWithIata = trimmedFlight.startsWith(airlineEntry.iata)
      const isNumeric = /^\d+$/.test(trimmedFlight)

      let normalizedFlight: string
      if (isNumeric) {
        normalizedFlight = airlineEntry.iata + trimmedFlight
      } else if (flightStartsWithIata) {
        normalizedFlight = trimmedFlight
      } else {
        normalizedFlight = airlineEntry.iata + trimmedFlight
      }

      const isKnownFlight = airlineEntry.flights.some((f) => f.toUpperCase() === normalizedFlight)

      if (!isKnownFlight) {
        return { valid: false }
      }

      return { valid: true, airlineName: airlineEntry.name, flightNumber: normalizedFlight }
    },
  }
}
