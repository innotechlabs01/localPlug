import { NextResponse } from 'next/server'
import { filterLocalPlaces } from '@/lib/rides/places'
import { haversineKm, isFiniteCoordinate, roundKm } from '@/lib/rides/geo'

type Coordinate = [number, number]

interface GeocodedPlace {
  lat: number
  lng: number
  displayName: string
}

interface Waypoint {
  lat: number
  lng: number
}

async function geocodeDestination(destination: string): Promise<GeocodedPlace | null> {
  // Known Medellín anchors win first so "Provenza" never resolves to France.
  const local = filterLocalPlaces(destination)[0]
  if (local) {
    return {
      lat: local.lat,
      lng: local.lng,
      displayName: `${local.label}, ${local.detail}`,
    }
  }

  const params = new URLSearchParams({
    q: destination,
    bbox: '-75.72,6.15,-75.45,6.32',
    limit: '1',
  })
  const geoRes = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { 'User-Agent': 'LocalPlug-MedellinRide/1.0 (https://localplug.vercel.app)' },
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  })
  if (!geoRes.ok) return null

  const data = (await geoRes.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>
  }
  const coords = data.features?.[0]?.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const [lng, lat] = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return { lat, lng, displayName: destination }
}

function fallbackResponse(
  pickupLat: number,
  pickupLng: number,
  destination: GeocodedPlace | null,
  waypoints: Waypoint[],
  source: string,
) {
  const destLat = destination?.lat ?? pickupLat
  const destLng = destination?.lng ?? pickupLng
  const points: Coordinate[] = [[pickupLat, pickupLng]]
  for (const point of waypoints) points.push([point.lat, point.lng])
  points.push([destLat, destLng])

  let km = 0
  for (let index = 1; index < points.length; index += 1) {
    const [fromLat, fromLng] = points[index - 1]
    const [toLat, toLng] = points[index]
    km += haversineKm(fromLat, fromLng, toLat, toLng)
  }

  return NextResponse.json({
    success: true,
    distanceKm: Math.max(0.1, Math.round(km * 10) / 10),
    durationMin: Math.max(1, Math.round((km / 28) * 60)),
    destLat,
    destLng,
    resolvedAddress: destination?.displayName || null,
    routeCoordinates: points,
    source,
    isFallback: true,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pickupLat = Number(body.pickupLat ?? 6.2088)
    const pickupLng = Number(body.pickupLng ?? -75.567)
    const destination = String(body.destination || '').trim()

    if (!destination || destination.length < 3) {
      return NextResponse.json({ error: 'destination is required' }, { status: 400 })
    }

    // Up to three selected stops become real OSRM waypoints, in display order.
    const waypoints: Waypoint[] = Array.isArray(body.waypoints)
      ? body.waypoints
          .slice(0, 3)
          .filter((entry: { lat?: unknown; lng?: unknown }) =>
            isFiniteCoordinate(entry?.lat) && isFiniteCoordinate(entry?.lng))
          .map((entry: { lat: number; lng: number }) => ({ lat: entry.lat, lng: entry.lng }))
      : []

    const hasDestinationCoords = isFiniteCoordinate(Number(body.destinationLat)) && isFiniteCoordinate(Number(body.destinationLng))
    const suppliedDestination: GeocodedPlace | null = hasDestinationCoords
      ? {
          lat: Number(body.destinationLat),
          lng: Number(body.destinationLng),
          displayName: destination,
        }
      : null

    let resolvedDestination = suppliedDestination
    if (!resolvedDestination) {
      try {
        resolvedDestination = await geocodeDestination(destination)
      } catch {
        return fallbackResponse(pickupLat, pickupLng, null, waypoints, 'geocode_error_fallback')
      }
    }

    if (!resolvedDestination) {
      return fallbackResponse(pickupLat, pickupLng, null, waypoints, 'geocode_fallback')
    }

    const coords: string[] = [`${pickupLng},${pickupLat}`]
    for (const point of waypoints) coords.push(`${point.lng},${point.lat}`)
    coords.push(`${resolvedDestination.lng},${resolvedDestination.lat}`)

    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'false',
    })
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords.join(';')}?${params.toString()}`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' },
    )

    if (!osrmRes.ok) {
      return fallbackResponse(pickupLat, pickupLng, resolvedDestination, waypoints, 'osrm_fallback')
    }

    const osrmData = await osrmRes.json()
    const route = osrmData?.routes?.[0]
    const rawCoordinates = route?.geometry?.coordinates as Array<[number, number]> | undefined
    const directCoordinates: Coordinate[] = [
      [pickupLat, pickupLng],
      ...waypoints.map((point) => [point.lat, point.lng] as Coordinate),
      [resolvedDestination.lat, resolvedDestination.lng],
    ]
    const routeCoordinates: Coordinate[] = Array.isArray(rawCoordinates)
      ? rawCoordinates.map(([lng, lat]) => [Number(lat), Number(lng)])
      : directCoordinates

    if (!route?.distance || !route?.duration) {
      return fallbackResponse(pickupLat, pickupLng, resolvedDestination, waypoints, 'osrm_fallback')
    }

    return NextResponse.json({
      success: true,
      distanceKm: roundKm(route.distance),
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      destLat: resolvedDestination.lat,
      destLng: resolvedDestination.lng,
      resolvedAddress: resolvedDestination.displayName,
      routeCoordinates,
      source: 'osrm',
      isFallback: false,
    })
  } catch (err) {
    console.error('[Ride Estimate] POST error:', err)
    return fallbackResponse(6.2088, -75.567, null, [], 'error_fallback')
  }
}
