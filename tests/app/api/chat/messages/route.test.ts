import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/chat/messages/route'
import { NextRequest } from 'next/server'

const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test_user_id' })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockRequest(url: string) {
  return new NextRequest(url)
}

describe('GET /api/chat/messages', () => {
  it('returns messages for valid conversationId (web channel)', async () => {
    mockExecute
      .mockResolvedValueOnce({ rows: [{ channel: 'web', status: 'active' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, conversation_id: 1, sender_type: 'ai', content: 'Hello!', message_type: 'text', created_at: '2026-01-01T00:00:00Z' },
          { id: 2, conversation_id: 1, sender_type: 'user', content: 'Hi', message_type: 'text', created_at: '2026-01-01T00:01:00Z' },
        ],
      })

    const req = mockRequest('http://localhost:3000/api/chat/messages?conversationId=1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.messages).toHaveLength(2)
  })

  it('returns 400 when conversationId is missing', async () => {
    const req = mockRequest('http://localhost:3000/api/chat/messages')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('conversationId')
  })

  it('returns 404 when conversation is not found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })

    const req = mockRequest('http://localhost:3000/api/chat/messages?conversationId=999')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain('Conversation not found')
  })
})
