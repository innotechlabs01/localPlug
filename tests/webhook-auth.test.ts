import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST as evolutionPost } from '@/app/api/webhooks/evolution/route'
import { POST as n8nPost } from '@/app/api/webhooks/n8n/route'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))

describe('Webhook Authentication Security', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Evolution API Webhook (/api/webhooks/evolution)', () => {
    it('rejects requests with 401 when EVOLUTION_API_KEY is configured and Authorization header is missing', async () => {
      process.env.EVOLUTION_API_KEY = 'secret-evolution-key-123'

      const req = new Request('http://localhost:3000/api/webhooks/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'messages.upsert', instance: 'main', data: {} }),
      })

      const res = await evolutionPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('rejects requests with 401 when Authorization header has an invalid token', async () => {
      process.env.EVOLUTION_API_KEY = 'secret-evolution-key-123'

      const req = new Request('http://localhost:3000/api/webhooks/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-token',
        },
        body: JSON.stringify({ event: 'messages.upsert', instance: 'main', data: {} }),
      })

      const res = await evolutionPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('rejects requests with 401 when token format is not Bearer', async () => {
      process.env.EVOLUTION_API_KEY = 'secret-evolution-key-123'

      const req = new Request('http://localhost:3000/api/webhooks/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic secret-evolution-key-123',
        },
        body: JSON.stringify({ event: 'messages.upsert', instance: 'main', data: {} }),
      })

      const res = await evolutionPost(req)
      expect(res.status).toBe(401)
    })

    it('accepts requests when valid Bearer token is provided', async () => {
      process.env.EVOLUTION_API_KEY = 'secret-evolution-key-123'

      const req = new Request('http://localhost:3000/api/webhooks/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secret-evolution-key-123',
        },
        body: JSON.stringify({ event: 'unknown-event', instance: 'main', data: {} }),
      })

      const res = await evolutionPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({ success: true, processed: 'unknown-event' })
    })
  })

  describe('n8n Webhook (/api/webhooks/n8n)', () => {
    it('rejects requests with 401 when N8N_API_KEY is configured and Authorization header is missing', async () => {
      process.env.N8N_API_KEY = 'secret-n8n-key-456'

      const req = new Request('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test-event', data: {}, timestamp: new Date().toISOString() }),
      })

      const res = await n8nPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('rejects requests with 401 when Authorization header has an invalid token', async () => {
      process.env.N8N_API_KEY = 'secret-n8n-key-456'

      const req = new Request('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify({ event: 'test-event', data: {}, timestamp: new Date().toISOString() }),
      })

      const res = await n8nPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('accepts requests when valid Bearer token is provided', async () => {
      process.env.N8N_API_KEY = 'secret-n8n-key-456'

      const req = new Request('http://localhost:3000/api/webhooks/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secret-n8n-key-456',
        },
        body: JSON.stringify({ event: 'unknown-event', data: {}, timestamp: new Date().toISOString() }),
      })

      const res = await n8nPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({ success: true, processed: 'unknown-event' })
    })
  })
})
