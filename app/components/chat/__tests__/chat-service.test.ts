import { describe, it, expect, vi, beforeEach } from 'vitest'
import { takeOverConversation, releaseToAIMode, getConversationById, getConversations } from '@/lib/services/chat-service'

const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getConversations', () => {
  it('builds correct WHERE clause with status filter', async () => {
    mockExecute.mockResolvedValue({ rows: [] })
    await getConversations({ status: 'ai_active' })
    expect(mockExecute).toHaveBeenCalledTimes(1)
    const { sql, args } = mockExecute.mock.calls[0][0]
    expect(sql).toContain('WHERE 1=1')
    expect(sql).toContain('AND status = ?')
    expect(args).toContain('ai_active')
  })

  it('builds query without WHERE clause when no filters', async () => {
    mockExecute.mockResolvedValue({ rows: [] })
    await getConversations()
    expect(mockExecute).toHaveBeenCalledTimes(1)
    const { sql } = mockExecute.mock.calls[0][0]
    expect(sql).toContain('WHERE 1=1')
    expect(sql).not.toContain('AND status = ?')
  })
})

describe('getConversationById', () => {
  it('returns conversation when found', async () => {
    const fakeRow = { id: 1, status: 'ai_active', channel: 'web' }
    mockExecute.mockResolvedValue({ rows: [fakeRow] })
    const result = await getConversationById(1)
    expect(result).toEqual(fakeRow)
  })

  it('returns null when not found', async () => {
    mockExecute.mockResolvedValue({ rows: [] })
    const result = await getConversationById(999)
    expect(result).toBeNull()
  })
})

describe('takeOverConversation', () => {
  it('updates status and returns conversation on success', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'human_active', assigned_agent_id: 5 }] })
    const result = await takeOverConversation(1, 5, 'Customer needs help')
    expect(result).not.toBeNull()
    expect(mockExecute).toHaveBeenCalledTimes(2)
    const firstCall = mockExecute.mock.calls[0][0]
    expect(firstCall.args).toEqual([5, 1])
  })

  it('returns null when no rows affected', async () => {
    mockExecute.mockResolvedValue({ rowsAffected: 0 })
    const result = await takeOverConversation(1, 5)
    expect(result).toBeNull()
  })
})

describe('releaseToAIMode', () => {
  it('passes args in correct order [conversationId, agentId] (Plan 005 fix)', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ai_active' }] })
    const result = await releaseToAIMode(1, 5)
    expect(result).not.toBeNull()
    const firstCall = mockExecute.mock.calls[0][0]
    expect(firstCall.args).toEqual([1, 5])
  })

  it('returns null when rowsAffected === 0', async () => {
    mockExecute.mockResolvedValue({ rowsAffected: 0 })
    const result = await releaseToAIMode(1, 5)
    expect(result).toBeNull()
  })
})
