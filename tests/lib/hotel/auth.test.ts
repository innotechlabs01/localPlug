import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureHotelProfile } from '@/lib/hotel/auth'
import { getDb } from '@/lib/db'

const { mockGetUser, mockExecute } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockExecute: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'user_hotel' })),
  clerkClient: vi.fn(() => Promise.resolve({ users: { getUser: mockGetUser } })),
}))

vi.mock('@/lib/db', () => ({ getDb: vi.fn() }))

const userRow = {
  id: 23,
  clerk_id: 'user_hotel',
  name: 'Ana Garcia',
  email: 'ana@example.com',
  role_id: 5,
  hotel_id: 9,
}
const hotelRow = { id: 9, name: 'Hotel Prueba', slug: 'hotel-prueba' }

function mockDb(responses: Array<{ rows: unknown[] }>) {
  mockExecute.mockReset()
  mockExecute.mockResolvedValue({ rows: [] })
  responses.forEach((response) => mockExecute.mockResolvedValueOnce(response))
  vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as never)
}

describe('hotel login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      firstName: 'Ana',
      lastName: 'Garcia',
      primaryEmailAddress: { emailAddress: 'ana@example.com' },
      emailAddresses: [],
    })
  })

  it('resolves hotel from an active manager row created by admin', async () => {
    mockDb([
      { rows: [userRow] },
      { rows: [hotelRow] },
    ])

    const result = await ensureHotelProfile('user_hotel')

    expect(result).toEqual({ user: userRow, hotel: hotelRow })
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('reactivates and relinks a deleted/recreated Clerk user by email', async () => {
    const recreatedUser = { ...userRow, clerk_id: 'user_hotel_recreated' }
    mockDb([
      { rows: [] },
      { rows: [{ id: 23, hotel_id: 9, status: 'inactive' }] },
      { rows: [] },
      { rows: [recreatedUser] },
      { rows: [hotelRow] },
    ])

    const result = await ensureHotelProfile('user_hotel_recreated')

    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('UPDATE users SET clerk_id'),
      args: ['user_hotel_recreated', 'active', 23],
    }))
    expect(result).toEqual({ user: recreatedUser, hotel: hotelRow })
  })
})
