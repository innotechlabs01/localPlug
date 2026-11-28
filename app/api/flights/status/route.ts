import { NextRequest, NextResponse } from 'next/server'
import { applySecurity } from '@/lib/rate-limit'

const FLIGHT_API_BASE_URL = 'https://api.aviationstack.com/v1/flights'
const FLIGHT_API_KEY = process.env.FLIGHT_API_KEY || process.env.AVIATIONSTACK_API_KEY

type FlightStatus = 'scheduled' | 'delayed' | 'advanced' | 'cancelled'

interface FlightStatusResponse {
  airline: string
  flightNumber: string
  date: string
  status: FlightStatus
  scheduledArrival: string
  estimatedArrival: string
  delayMinutes: number
  source: 'external' | 'mock'
}

interface ExternalFlightItem {
  flight_status?: string | null
  arrival?: {
    scheduled?: string | null
    estimated?: string | null
  } | null
  delay?: {
    arrival?: number | null
  } | null
}

interface ExternalFlightApiResponse {
  data?: Array<ExternalFlightItem | null> | null
}

/**
 * Genera un estado de vuelo estable pero variado a partir de aerolínea,
 * número y fecha. Es un placeholder determinista: el mismo vuelo/fecha
 * siempre devuelve el mismo resultado sin consumir API externa.
 *
 * Reemplazar por la integración real con AviationStack / Amadeus cuando
 * se disponga de FLIGHT_API_KEY (ver consigna más abajo).
 */
function deterministicStatus(
  airline: string,
  flightNumber: string,
  date: string | undefined,
): { status: FlightStatus; delayMinutes: number } {
  const input = `${airline.toUpperCase()}|${flightNumber.toUpperCase()}|${date ?? ''}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  const bucket = Math.abs(hash) % 100

  if (bucket < 5) {
    return { status: 'cancelled', delayMinutes: 0 }
  }
  if (bucket < 15) {
    return { status: 'advanced', delayMinutes: 0 }
  }
  if (bucket < 45) {
    const delay = 10 + (Math.abs(hash) % 90)
    return { status: 'delayed', delayMinutes: delay }
  }
  return { status: 'scheduled', delayMinutes: 0 }
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildMockResponse(
  airline: string,
  flightNumber: string,
  date: string | undefined,
): FlightStatusResponse {
  const { status, delayMinutes } = deterministicStatus(airline, flightNumber, date)
  const scheduledArrival = '14:30'
  const estimatedArrival = delayMinutes > 0 ? addMinutes(scheduledArrival, delayMinutes) : scheduledArrival
  return {
    airline: airline.toUpperCase(),
    flightNumber: flightNumber.toUpperCase(),
    date: date ?? '',
    status,
    scheduledArrival,
    estimatedArrival,
    delayMinutes,
    source: 'mock',
  }
}

export async function GET(request: NextRequest) {
  const security = await applySecurity(request)
  if (security) return security

  const { searchParams } = new URL(request.url)
  const airline = searchParams.get('airline')
  const flightNumber = searchParams.get('flightNumber')
  const date = searchParams.get('date') ?? undefined

  if (!airline || !flightNumber) {
    return NextResponse.json(
      { error: 'Missing required fields: airline and flightNumber' },
      { status: 400 },
    )
  }

  const trimmedAirline = airline.trim()
  const trimmedFlight = flightNumber.trim()

  // TODO: integrar con AviationStack / Amadeus cuando se disponga de FLIGHT_API_KEY
  // o AVIATIONSTACK_API_KEY en .env.local. Mientras tanto se devuelve un estado
  // mock con variación determinista (source: 'mock') como placeholder documentado.
  if (!FLIGHT_API_KEY) {
    return NextResponse.json(buildMockResponse(trimmedAirline, trimmedFlight, date))
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const url = new URL(FLIGHT_API_BASE_URL)
    url.searchParams.set('access_key', FLIGHT_API_KEY)
    url.searchParams.set('airline_iata', trimmedAirline)
    url.searchParams.set('flight_number', trimmedFlight)
    if (date) {
      url.searchParams.set('flight_date', date)
    }

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`External flight API responded ${response.status}`)
    }

    const data = (await response.json()) as ExternalFlightApiResponse
    const flight = Array.isArray(data.data) ? data.data[0] : null
    if (!flight) {
      throw new Error('No flight data returned by external API')
    }

    const externalStatus = String(flight.flight_status ?? 'scheduled').toLowerCase()
    const status: FlightStatus =
      externalStatus === 'delayed' ? 'delayed' :
      externalStatus === 'cancelled' ? 'cancelled' :
      externalStatus === 'advanced' ? 'advanced' :
      'scheduled'

    const scheduledRaw = flight.arrival?.scheduled ?? null
    const estimatedRaw = flight.arrival?.estimated ?? null
    const scheduledArrival = (scheduledRaw ? String(scheduledRaw).slice(11, 16) : '') || '14:30'
    const estimatedArrival = (estimatedRaw ? String(estimatedRaw).slice(11, 16) : scheduledArrival) || scheduledArrival

    const delayMinutes =
      typeof flight.delay?.arrival === 'number' ? flight.delay.arrival : status === 'delayed' ? 40 : 0

    return NextResponse.json({
      airline: trimmedAirline.toUpperCase(),
      flightNumber: trimmedFlight.toUpperCase(),
      date: date ?? '',
      status,
      scheduledArrival,
      estimatedArrival,
      delayMinutes,
      source: 'external',
    })
  } catch (err) {
    console.error('[Flight Status] External API error:', err)
    return NextResponse.json(
      { error: 'Flight status service unavailable' },
      { status: 500 },
    )
  }
}
