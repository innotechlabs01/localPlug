import { NextResponse } from 'next/server'
import { LOCAL_PLACES } from '@/lib/rides/places'
import { haversineKm, roundKm } from '@/lib/rides/geo'

export interface QuickDistance {
  placeId: string
  label: string
  distanceKm: number
  durationMin: number
  source: 'osrm' | 'straight_line'
}

const MEDELLIN_CENTER = { lat: 6.2088, lng: -75.567 }

function coordinate(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const pickupLat = coordinate(params.get('lat'), MEDELLIN_CENTER.lat)
  const pickupLng = coordinate(params.get('lng'), MEDELLIN_CENTER.lng)

  const coords = [`${pickupLng},${pickupLat}`, ...LOCAL_PLACES.map((place) => `${place.lng},${place.lat}`)]
  const url =
    `https://router.project-osrm.org/table/v1/driving/${coords.join(';')}` +
    '?sources=0&annotations=distance,duration'

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LocalPlug-MedellinRide/1.0 (https://localplug.vercel.app)' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })

    if (res.ok) {
      const data = (await res.json()) as { distances?: number[][]; durations?: number[][] }
      const distances = data.distances?.[0]
      const durations = data.durations?.[0]
      // OSRM includes the source itself at index 0, so destinations start at 1.
      if (Array.isArray(distances) && distances.length > LOCAL_PLACES.length) {
        const results: QuickDistance[] = LOCAL_PLACES.map((place, index) => ({
          placeId: place.id,
          label: place.label,
          distanceKm: roundKm(distances[index + 1]),
          durationMin: Math.max(1, Math.round((durations?.[index + 1] ?? distances[index + 1] / 7.8) / 60)),
          source: 'osrm',
        }))
        return NextResponse.json({ success: true, distances: results })
      }
    }
  } catch {
    // Fall through to a clearly labelled straight-line estimate.
  }

  const results: QuickDistance[] = LOCAL_PLACES.map((place) => {
    const km = haversineKm(pickupLat, pickupLng, place.lat, place.lng)
    return {
      placeId: place.id,
      label: place.label,
      distanceKm: Math.max(0.1, Math.round(km * 10) / 10),
      durationMin: Math.max(1, Math.round((km / 28) * 60)),
      source: 'straight_line' as const,
    }
  })

  return NextResponse.json({ success: true, distances: results })
}
