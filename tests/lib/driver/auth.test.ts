import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureDriverProfile } from '@/lib/driver/auth'
import { getDb } from '@/lib/db'

const { mockAuth, mockGetUser } = vi.hoisted(() => ({
  mockAuth: vi.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve({ userId: 'user_driver' })),
  mockGetUser: vi.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve({
    firstName: 'Karen',
    lastName: 'Jimenez',
    primaryEmailAddress: { emailAddress: 'karen@example.com' },
    emailAddresses: [],
    primaryPhoneNumber: null,
    phoneNumbers: [],
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  clerkClient: vi.fn(() => Promise.resolve({ users: { getUser: mockGetUser } })),
}))

vi.mock('@/lib/db', () => ({ getDb: vi.fn() }))

const driverRow = {
  id: 21,
  clerk_user_id: 'user_driver',
  name: 'Karen Jimenez',
  email: 'karen@example.com',
  status: 'inactive',
}

function mockDb(responses: Array<{ rows: unknown[]; rowsAffected?: number }>) {
  const execute = vi.fn()
  responses.forEach((response) => execute.mockResolvedValueOnce(response))
  vi.mocked(getDb).mockReturnValue({ execute } as never)
  return execute
}

describe('ensureDriverProfile role assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_driver' })
  })

  it('promotes a viewer to driver when the driver profile already exists', async () => {
    const execute = mockDb([
      { rows: [driverRow] },
      { rows: [{ id: 4, name: 'viewer' }, { id: 6, name: 'driver' }] },
      { rows: [{ id: 23, role_name: 'viewer' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    await ensureDriverProfile('user_driver')

    const updateUser = execute.mock.calls.find(([stmt]) =>
      String(stmt.sql).includes('UPDATE users SET role_id'),
    )
    expect(updateUser?.[0].args).toEqual([6, 23])
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('INSERT OR IGNORE INTO user_roles'),
      args: [23, 6],
    }))
  })

  it('promotes a viewer when auto-creating the onboarding driver profile', async () => {
    const execute = mockDb([
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [driverRow] },
      { rows: [{ id: 4, name: 'viewer' }, { id: 6, name: 'driver' }] },
      { rows: [{ id: 23, role_name: 'viewer' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    await ensureDriverProfile('user_driver')

    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('INSERT OR IGNORE INTO drivers'),
    }))
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('UPDATE users SET role_id'),
      args: [6, 23],
    }))
  })

  it('does not downgrade an explicitly assigned role', async () => {
    const execute = mockDb([
      { rows: [driverRow] },
      { rows: [{ id: 4, name: 'viewer' }, { id: 6, name: 'driver' }, { id: 7, name: 'super_admin' }] },
      { rows: [{ id: 23, role_name: 'super_admin' }] },
    ])

    await ensureDriverProfile('user_driver')

    expect(execute.mock.calls.some(([stmt]) => String(stmt.sql).includes('UPDATE users SET role_id'))).toBe(false)
  })

  it('creates the users row and promotes when the webhook has not arrived yet', async () => {
    const execute = mockDb([
      { rows: [driverRow] },
      { rows: [{ id: 4, name: 'viewer' }, { id: 6, name: 'driver' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [{ id: 23, role_name: 'viewer' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    await ensureDriverProfile('user_driver')

    const insertUser = execute.mock.calls.find(([stmt]) =>
      String(stmt.sql).includes('INSERT OR IGNORE INTO users'),
    )
    expect(insertUser?.[0].args).toEqual(['user_driver', 'Karen Jimenez', 'karen@example.com', 4])
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('UPDATE users SET role_id'),
      args: [6, 23],
    }))
  })
})
