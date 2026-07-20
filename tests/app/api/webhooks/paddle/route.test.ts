import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/webhooks/paddle/route';
import { NextRequest } from 'next/server';

const mockExecute = vi.fn().mockResolvedValue({ rows: [], rowsAffected: 1 });

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({ execute: mockExecute })),
}));

vi.mock('@/lib/config', () => ({
  getPlatformFeePercent: vi.fn().mockResolvedValue(0.10),
}));

const mockUnmarshal = vi.fn();

vi.mock('@paddle/paddle-node-sdk', () => ({
  Paddle: class MockPaddle {
    webhooks = { unmarshal: mockUnmarshal }
  }
}));

describe('Paddle webhook handler', () => {
  const SECRET = 'test-paddle-secret';

  beforeEach(() => {
    process.env.PADDLE_WEBHOOK_SECRET = SECRET;
    process.env.PADDLE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.PADDLE_WEBHOOK_SECRET;
    delete process.env.PADDLE_API_KEY;
  });

  const makeReq = (body: string, signature = 'sig_test') =>
    new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      headers: { 'paddle-signature': signature },
      body,
    });

  it('returns 401 when signature is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('missing_signature');
  });

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.PADDLE_WEBHOOK_SECRET;
    delete process.env.PADDLE_SANDBOX_WEBHOOK_SECRET;
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('server_config_error');
  });

  it('returns 401 when signature verification fails', async () => {
    mockUnmarshal.mockRejectedValue(new Error('Invalid signature'));
    const res = await POST(makeReq('bad-body', 'bad-sig'));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('invalid_signature');
  });

  it('returns 200 for non-transaction.completed events', async () => {
    mockUnmarshal.mockResolvedValue({ eventType: 'transaction.created', data: {} });
    const res = await POST(makeReq('body'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('returns 400 when transaction data is missing', async () => {
    mockUnmarshal.mockResolvedValue({ eventType: 'transaction.completed', data: undefined });
    const res = await POST(makeReq('body'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('missing_transaction_data');
  });

  it('returns 400 when booking_reference is missing', async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: 'transaction.completed',
      data: { id: 'txn_123', custom_data: {} },
    });
    const res = await POST(makeReq('body'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('missing_data');
  });

  it('processes a valid transaction.completed event', async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: 'transaction.completed',
      data: {
        id: 'txn_123',
        custom_data: { booking_reference: 'BK-001' },
        details: { totals: { total: 1000 } },
      },
    });
    const res = await POST(makeReq('body'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE payments SET'),
      })
    );
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE orders SET'),
      })
    );
  });

  it('calculates platform fee correctly (10% of 1000 = 100)', async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: 'transaction.completed',
      data: {
        id: 'txn_456',
        custom_data: { booking_reference: 'BK-002' },
        details: { totals: { total: 1000 } },
      },
    });
    await POST(makeReq('body'));

    const paymentCall = mockExecute.mock.calls.find(
      ([arg]: any) => typeof arg === 'object' && arg.sql.includes('UPDATE payments')
    );
    expect(paymentCall).toBeDefined();
    const args = paymentCall![0].args;
    expect(args[0]).toBe('txn_456');
    expect(args[1]).toBe(100);
    expect(args[2]).toBe(0);
    expect(args[3]).toBe('completed');
    expect(args[5]).toBe('BK-002');
  });

  it('returns 500 on unexpected error', async () => {
    mockUnmarshal.mockRejectedValue(new Error('Boom'));
    const res = await POST(makeReq('body', 'sig'));
    expect(res.status).toBe(401);
  });
});
