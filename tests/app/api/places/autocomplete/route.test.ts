import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/places/autocomplete/route'

function request(query: string) {
  return new Request(`http://localhost:3000/api/places/autocomplete?q=${encodeURIComponent(query)}`)
}

function photonResponse() {
  return {
    ok: true,
    json: async () => ({
      features: [
        {
          properties: {
            osm_type: 'W',
            osm_id: 42,
            name: 'Carrera 43A',
            locality: 'El Poblado',
            city: 'Medellín',
            state: 'Antioquia',
            country: 'Colombia',
          },
          geometry: { coordinates: [-75.567, 6.2088] },
        },
      ],
    }),
  }
}

describe('GET /api/places/autocomplete', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('rejects queries shorter than three characters', async () => {
    const res = await GET(request('Pr'))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns curated neighbourhoods and Medellín-bounded Photon results', async () => {
    fetchMock.mockResolvedValue(photonResponse())

    const res = await GET(request('Provenza'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'local-provenza',
          label: 'Provenza, El Poblado',
          lat: 6.2088,
          lng: -75.5627,
        }),
        expect.objectContaining({
          label: 'Carrera 43A, El Poblado',
          lat: 6.2088,
          lng: -75.567,
        }),
      ]),
    )

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('photon.komoot.io/api')
    expect(url).toContain('bbox=-75.72%2C6.15%2C-75.45%2C6.32')
    // Photon rejects lang=es, which made every free-text search return 400.
    expect(url).not.toContain('lang=')
    expect(options.headers['User-Agent']).toContain('LocalPlug')
  })

  it('labels numbered streets from Photon street and housenumber', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              osm_type: 'W',
              osm_id: 43,
              street: 'Calle 10',
              housenumber: '20-35',
              city: 'Medellín',
              state: 'Antioquia',
              country: 'Colombia',
            },
            geometry: { coordinates: [-75.567, 6.2088] },
          },
        ],
      }),
    })

    const res = await GET(request('Calle 10'))
    await expect(res.json()).resolves.toMatchObject({
      suggestions: expect.arrayContaining([
        expect.objectContaining({ label: 'Calle 10 20-35' }),
      ]),
    })
  })

  it('still returns curated places when the upstream geocoder fails', async () => {
    fetchMock.mockRejectedValue(new Error('upstream down'))
    const res = await GET(request('Laureles'))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      suggestions: expect.arrayContaining([
        expect.objectContaining({ id: 'local-laureles', lat: 6.2445 }),
      ]),
    })
  })

  it('returns an empty list when nothing matches', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [] }) })
    const res = await GET(request('Calle Inexistente 98765'))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ success: true, suggestions: [] })
  })
})
