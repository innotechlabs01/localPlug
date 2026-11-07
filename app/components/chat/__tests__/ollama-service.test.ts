import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateOllamaResponse } from '@/lib/services/ollama-service'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generateOllamaResponse', () => {
  it('returns message and high confidence for valid response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Hello! How can I help you?' },
      }),
    })

    const result = await generateOllamaResponse({
      message: 'Hi there',
      conversationHistory: [],
    })

    expect(result.message).toBe('Hello! How can I help you?')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('returns empty message and zero confidence on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })

    const result = await generateOllamaResponse({
      message: 'Test',
      conversationHistory: [],
    })

    expect(result.message).toBe('')
    expect(result.confidence).toBe(0)
  })

  it('sets low confidence for escalation keywords', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Un agente se pondrá en contacto contigo' },
      }),
    })

    const result = await generateOllamaResponse({
      message: 'I want to talk to a human agent',
      conversationHistory: [],
    })

    expect(result.confidence).toBeLessThan(0.5)
    expect(result.message).toBeTruthy()
  })

  it('handles empty history gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Welcome!' },
      }),
    })

    const result = await generateOllamaResponse({
      message: 'Hello',
      conversationHistory: [],
    })

    expect(result.message).toBe('Welcome!')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('handles fetch exception gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await generateOllamaResponse({
      message: 'Hi',
      conversationHistory: [],
    })

    expect(result.message).toBe('')
    expect(result.confidence).toBe(0)
  })
})
