import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/rides/quick-distances/route'

const request = (query = 'lat=6.2088&lng=-75.567') =>
  new Request(`http://localhost:3000/api/rides/quick-distances?${query}`)

describe('GET /api/rides/quick-distances', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('asks OSRM for road distances from the rider position', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        distances: [[0, 8410, 5640, 5842, 37163, 1200]],
        durations: [[0, 1500, 900, 1000, 4200, 300]],
      }),
    })

    const res = await GET(request('lat=6.21&lng=-75.57'))
    const data = await res.json()

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/table/v1/driving/-75.57,6.21;')
    expect(url).toContain('sources=0')
    expect(data.distances[0]).toMatchObject({ placeId: 'local-provenza', distanceKm: 8.4, source: 'osrm' })
    expect(data.distances[0].durationMin).toBe(25)
  })

  it('falls back to a clearly labelled straight-line distance', async () => {
    fetchMock.mockResolvedValue({ ok: false })

    const data = await (await GET(request())).json()
    expect(data.distances[0].source).toBe('straight_line')
    expect(data.distances[0].distanceKm).toBeGreaterThan(0)
  })
})
