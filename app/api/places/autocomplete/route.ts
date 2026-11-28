import { NextResponse } from 'next/server'
import { filterLocalPlaces } from '@/lib/rides/places'

export interface PlaceSuggestion {
  id: string
  label: string
  detail: string
  lat: number
  lng: number
}

interface PhotonFeature {
  properties?: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    locality?: string
    district?: string
    city?: string
    state?: string
    country?: string
  }
  geometry?: { coordinates?: [number, number] }
}

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_LIMIT = 100
const MEDELLIN_BBOX = '-75.72,6.15,-75.45,6.32'
const cache = new Map<string, { at: number; suggestions: PlaceSuggestion[] }>()

function labelFromFeature(props: NonNullable<PhotonFeature['properties']>): string {
  const street = [props.street, props.housenumber].filter(Boolean).join(' ')
  const name = props.name || street || 'Dirección'
  const qualifier = props.locality || props.district || ''
  return [name, qualifier].filter(Boolean).join(', ')
}

function detailFromFeature(props: NonNullable<PhotonFeature['properties']>): string {
  return [props.city, props.state, props.country]
    .filter(Boolean)
    .join(', ')
}

export async function GET(req: Request) {
  const query = (new URL(req.url).searchParams.get('q') || '').trim()
  if (query.length < 3) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  const key = query.toLocaleLowerCase('es-CO')
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, suggestions: cached.suggestions })
  }

  const suggestions: PlaceSuggestion[] = filterLocalPlaces(query).map((place) => ({
    id: place.id,
    label: place.label,
    detail: place.detail,
    lat: place.lat,
    lng: place.lng,
  }))
  const seen = new Set(suggestions.map((place) => place.id))

  try {
    // Photon only accepts default/de/en/fr. Sending lang=es makes every
    // request fail with 400, so the free-text provider is left at its default.
    const params = new URLSearchParams({
      q: query,
      bbox: MEDELLIN_BBOX,
      limit: '6',
    })
    const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      headers: { 'User-Agent': 'LocalPlug/1.0 (https://localplug.vercel.app)' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })

    if (res.ok) {
      const data = (await res.json()) as { features?: PhotonFeature[] }
      for (const feature of data.features || []) {
        const coords = feature.geometry?.coordinates
        const props = feature.properties
        if (!props || !Array.isArray(coords) || coords.length < 2) continue
        const [lng, lat] = coords
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
        const id = `${props.osm_type || 'osm'}-${props.osm_id || `${lat},${lng}`}`
        if (seen.has(id)) continue
        seen.add(id)
        suggestions.push({
          id,
          label: labelFromFeature(props),
          detail: detailFromFeature(props),
          lat,
          lng,
        })
      }
    }
  } catch (err) {
    console.error('[Places Autocomplete] upstream error:', err)
  }

  const limited = suggestions.slice(0, 8)
  if (cache.size >= CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, { at: Date.now(), suggestions: limited })

  return NextResponse.json({ success: true, suggestions: limited })
}
