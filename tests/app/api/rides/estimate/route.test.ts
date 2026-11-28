import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/rides/estimate/route'

const request = (body: Record<string, unknown>) =>
  new Request('http://localhost:3000/api/rides/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/rides/estimate', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('uses autocomplete coordinates and returns a route line for the map', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 5200,
            duration: 900,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-75.567, 6.2088],
                [-75.57, 6.21],
                [-75.575, 6.212],
              ],
            },
          },
        ],
      }),
    })

    const res = await POST(request({
      pickupLat: 6.2088,
      pickupLng: -75.567,
      destinationLat: 6.212,
      destinationLng: -75.575,
      destination: 'Provenza, El Poblado, Medellín',
    }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      distanceKm: 5.2,
      durationMin: 15,
      destLat: 6.212,
      destLng: -75.575,
      routeCoordinates: [
        [6.2088, -75.567],
        [6.21, -75.57],
        [6.212, -75.575],
      ],
      source: 'osrm',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('overview=full')
  })

  it('rejects missing destination', async () => {
    const res = await POST(request({ destination: '' }))
    expect(res.status).toBe(400)
  })

  it('routes through selected stops in order instead of adding fake kilometres', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{
          distance: 8400,
          duration: 1260,
          geometry: { type: 'LineString', coordinates: [[-75.567, 6.2088], [-75.6, 6.24]] },
        }],
      }),
    })

    const res = await POST(request({
      pickupLat: 6.2088,
      pickupLng: -75.567,
      destination: 'Laureles',
      destinationLat: 6.2445,
      destinationLng: -75.605,
      waypoints: [
        { lat: 6.2146, lng: -75.5395 },
        { lat: Number.NaN, lng: -75.6 },
      ],
    }))

    await expect(res.json()).resolves.toMatchObject({ distanceKm: 8.4, durationMin: 21, isFallback: false })
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('-75.567,6.2088;-75.5395,6.2146;-75.605,6.2445')
    expect(url).not.toContain('NaN')
  })

  it('computes a real straight-line fallback instead of hardcoded 6 km / 14 min', async () => {
    fetchMock.mockResolvedValue({ ok: false })

    const res = await POST(request({
      pickupLat: 6.2088,
      pickupLng: -75.567,
      destination: 'Laureles',
      destinationLat: 6.2445,
      destinationLng: -75.605,
    }))
    const data = await res.json()

    expect(data.isFallback).toBe(true)
    expect(data.distanceKm).toBeGreaterThan(4)
    expect(data.distanceKm).toBeLessThan(8)
    expect(data.durationMin).not.toBe(14)
    expect(data.routeCoordinates).toHaveLength(2)
  })

  it('does not send an unsupported Photon language', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{ geometry: { coordinates: [-75.605, 6.2445] } }],
      }),
    }).mockResolvedValueOnce({ ok: false })

    await POST(request({ pickupLat: 6.2088, pickupLng: -75.567, destination: 'Calle 10' }))

    const geocodeUrl = String(fetchMock.mock.calls[0][0])
    expect(geocodeUrl).toContain('photon.komoot.io')
    expect(geocodeUrl).not.toContain('lang=')
  })
})
