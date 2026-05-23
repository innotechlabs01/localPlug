import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/webhooks/n8n/route';
import { NextRequest } from 'next/server';

// Mock the database
vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}));

describe('n8n webhook handler', () => {
  const mockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/webhooks/n8n', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle whatsapp-ai-response event', async () => {
    const req = mockRequest({
      event: 'whatsapp-ai-response',
      data: {
        conversationId: 1,
        message: 'Hola',
        confidence: 0.9,
      },
      timestamp: new Date().toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processed).toBe('whatsapp-ai-response');
  });

  it('should handle unknown event', async () => {
    const req = mockRequest({
      event: 'unknown-event',
      data: {},
      timestamp: new Date().toISOString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processed).toBe('unknown-event');
  });
});