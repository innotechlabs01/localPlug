import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pickupLat = Number(body.pickupLat ?? 6.2088)
    const pickupLng = Number(body.pickupLng ?? -75.567)
    const destination = String(body.destination || '').trim()

    if (!destination || destination.length < 3) {
      return NextResponse.json({ error: 'destination is required' }, { status: 400 })
    }

    // 1. Geocode destination in Medellín via Nominatim (OpenStreetMap)
    const query = /medell[ií]n|envigado|sabaneta|itag[uü][ií]|bello/i.test(destination)
      ? destination
      : `${destination}, Medellín, Colombia`

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'LocalPlug-MedellinRide/1.0' },
        signal: AbortSignal.timeout(4000),
      },
    )

    if (!geoRes.ok) {
      return NextResponse.json({ success: true, distanceKm: 6, durationMin: 14, source: 'fallback' })
    }

    const geoData = (await geoRes.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (!geoData.length) {
      return NextResponse.json({ success: true, distanceKm: 6, durationMin: 14, source: 'fallback' })
    }

    const destLat = Number(geoData[0].lat)
    const destLng = Number(geoData[0].lon)

    // 2. Compute real driving route distance & duration via OSRM
    try {
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${destLng},${destLat}?overview=false`,
        { signal: AbortSignal.timeout(4000) },
      )
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json()
        const route = osrmData?.routes?.[0]
        if (route?.distance && route?.duration) {
          const distanceKm = Math.max(1, Math.round((route.distance / 1000) * 10) / 10)
          const durationMin = Math.max(4, Math.round(route.duration / 60))
          return NextResponse.json({
            success: true,
            distanceKm,
            durationMin,
            destLat,
            destLng,
            resolvedAddress: geoData[0].display_name,
            source: 'osrm',
          })
        }
      }
    } catch { /* fallback below */ }

    return NextResponse.json({
      success: true,
      distanceKm: 6,
      durationMin: 14,
      destLat,
      destLng,
      resolvedAddress: geoData[0].display_name,
      source: 'geocode_fallback',
    })
  } catch (err) {
    console.error('[Ride Estimate] POST error:', err)
    return NextResponse.json({ success: true, distanceKm: 6, durationMin: 14, source: 'error_fallback' })
  }
}
