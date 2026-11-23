import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/chat/start/route'
import { NextRequest } from 'next/server'

const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

const mockTriggerAiChatMessage = vi.fn()
vi.mock('@/lib/n8n/client', () => ({
  triggerAiChatMessage: (...args: any[]) => mockTriggerAiChatMessage(...args),
}))

vi.mock('@/lib/i18n/server', () => ({
  t: (locale: string, key: string) => {
    if (key === 'chatWidget.startMessage') return '¡Hola! 👋 How can I help you today?'
    return key
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/chat/start', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat/start', () => {
  it('creates conversation and returns 200 with valid data', async () => {
    mockExecute
      .mockResolvedValueOnce({ lastInsertRowid: 42, rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    mockTriggerAiChatMessage.mockResolvedValue({ success: true })

    const req = mockRequest({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+573001234567',
      country: 'Colombia',
      countryCode: '+57',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.conversationId).toBe(42)
    expect(json.sessionId).toBeTruthy()
  })

  it('returns 400 when required fields are missing', async () => {
    const req = mockRequest({
      name: 'John Doe',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('required')
  })

  it('returns 400 when email is missing', async () => {
    const req = mockRequest({
      name: 'John Doe',
      phone: '+573001234567',
      country: 'Colombia',
      countryCode: '+57',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('required')
  })
})
