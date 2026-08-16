import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/chat/send/route'
import { NextRequest } from 'next/server'

const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

const mockTriggerAiChatMessage = vi.fn()
const mockTriggerFraudDetection = vi.fn()
vi.mock('@/lib/n8n/client', () => ({
  triggerAiChatMessage: (...args: any[]) => mockTriggerAiChatMessage(...args),
  triggerFraudDetection: (...args: any[]) => mockTriggerFraudDetection(...args),
}))

const mockGenerateOpenAIResponse = vi.fn()
vi.mock('@/lib/services/openai-service', () => ({
  generateOpenAIResponse: (...args: any[]) => mockGenerateOpenAIResponse(...args),
}))

const mockGenerateOllamaResponse = vi.fn()
vi.mock('@/lib/services/ollama-service', () => ({
  generateOllamaResponse: (...args: any[]) => mockGenerateOllamaResponse(...args),
}))

vi.mock('@/lib/i18n/server', () => ({
  t: (locale: string, key: string) => {
    const fallbacks: Record<string, string> = {
      'chat.blockedTopic': 'I am sorry, I cannot help with that topic.',
      'chat.fraudDetected': 'Thank you. A team member will review your case.',
      'chat.fallback': 'Our AI assistant is unavailable. Your message has been queued.',
    }
    return fallbacks[key] || key
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/chat/send', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat/send', () => {
  it('returns 400 when message is missing', async () => {
    const req = mockRequest({ userIdentifier: 'user123' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('message')
  })

  it('returns 400 when userIdentifier is missing', async () => {
    const req = mockRequest({ message: 'Hello' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('userIdentifier')
  })

  it('returns NVIDIA (OpenAI-compatible) response as primary provider', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ user_name: 'John', user_email: 'john@test.com', user_country: 'US', booking_reference: null }] })
      .mockResolvedValueOnce({ rows: [{ sender_type: 'user', content: 'Hello' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    mockGenerateOpenAIResponse.mockResolvedValue({
      message: 'Hi John! How can I help?',
      confidence: 0.9,
    })

    const req = mockRequest({
      conversationId: 1,
      message: 'Hello',
      userIdentifier: 'user123',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.source).toBe('openai')
    expect(json.response.sender).toBe('ai')
    expect(json.response.content).toBe('Hi John! How can I help?')
  })

  it('falls back to Ollama when NVIDIA returns empty', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ user_name: 'John', user_email: 'john@test.com', user_country: 'US', booking_reference: null }] })
      .mockResolvedValueOnce({ rows: [{ sender_type: 'user', content: 'Hello' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    mockGenerateOpenAIResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    mockGenerateOllamaResponse.mockResolvedValue({
      message: 'Ollama response here',
      confidence: 0.85,
    })

    const req = mockRequest({
      conversationId: 1,
      message: 'Hello',
      userIdentifier: 'user123',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.source).toBe('ollama')
    expect(json.response.content).toBe('Ollama response here')
  })

  it('escalates to human_active when provider confidence < 0.5', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ user_name: 'John', user_email: 'john@test.com', user_country: 'US', booking_reference: null }] })
      .mockResolvedValueOnce({ rows: [{ sender_type: 'user', content: 'Help' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    mockGenerateOpenAIResponse.mockResolvedValue({
      message: 'I can help',
      confidence: 0.3,
    })

    mockGenerateOllamaResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    const req = mockRequest({
      conversationId: 1,
      message: 'Help',
      userIdentifier: 'user123',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const escalationCall = mockExecute.mock.calls.find((c: any) => c[0].sql.includes("status = 'human_active'"))
    expect(escalationCall).toBeDefined()
    expect(escalationCall![0].args).toHaveLength(1)
  })

  it('falls back to n8n when NVIDIA and Ollama both fail', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ user_name: 'John', user_email: 'john@test.com', user_country: 'US', booking_reference: null }] })
      .mockResolvedValueOnce({ rows: [{ sender_type: 'user', content: 'Hello' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    mockGenerateOpenAIResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    mockGenerateOllamaResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    mockTriggerAiChatMessage.mockResolvedValue({
      success: true,
      message: 'Response from n8n',
      confidence: 0.9,
    })

    const req = mockRequest({
      conversationId: 1,
      message: 'Hello',
      userIdentifier: 'user123',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.response.content).toBe('Response from n8n')
  })

  it('returns localized fallback when NVIDIA, Ollama, and n8n all fail', async () => {
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rows: [{ user_name: 'John', user_email: 'john@test.com', user_country: 'US', booking_reference: null }] })
      .mockResolvedValueOnce({ rows: [{ sender_type: 'user', content: 'Hello' }] })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })

    mockGenerateOpenAIResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    mockGenerateOllamaResponse.mockResolvedValue({
      message: '',
      confidence: 0,
    })

    mockTriggerAiChatMessage.mockResolvedValue({
      success: false,
      error: 'n8n timeout',
    })

    const req = mockRequest({
      conversationId: 1,
      message: 'Hello',
      userIdentifier: 'user123',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.source).toBe('fallback')
    expect(json.response.content).toContain('unavailable')
  })
})