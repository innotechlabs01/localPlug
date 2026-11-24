import { describe, it, expect, vi, afterEach } from 'vitest'
import { signRideToken, verifyRideToken } from '@/lib/ride-token'

describe('ride-token (signRideToken / verifyRideToken)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('verifies a freshly signed token for the matching rideId', () => {
    const token = signRideToken(42, 'LP-2026-0042')
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[0-9a-f]{32}$/)
    expect(verifyRideToken(token, 42)).toBe(true)
  })

  it('fails verification when rideId does not match the signed token', () => {
    const token = signRideToken(101, 'LP-2026-0101')
    expect(verifyRideToken(token, 102)).toBe(false)
    expect(verifyRideToken(token, 0)).toBe(false)
    expect(verifyRideToken(token, -101)).toBe(false)
  })

  it('fails verification when the signature is tampered with', () => {
    const token = signRideToken(77, 'LP-2026-0077')
    const [encoded, sig] = token.split('.')

    // Flip first hex character of signature
    const flippedChar = sig[0] === 'a' ? 'b' : 'a'
    const tamperedSig = `${flippedChar}${sig.slice(1)}`
    expect(verifyRideToken(`${encoded}.${tamperedSig}`, 77)).toBe(false)

    // Truncated signature
    expect(verifyRideToken(`${encoded}.${sig.slice(0, 16)}`, 77)).toBe(false)

    // Extended signature
    expect(verifyRideToken(`${encoded}.${sig}ff`, 77)).toBe(false)
  })

  it('fails verification when the payload is tampered with', () => {
    const token = signRideToken(55, 'LP-2026-0055')
    const [, sig] = token.split('.')
    const forgedPayload = Buffer.from(`55:LP-2026-9999:${Date.now() + 60_000}`).toString(
      'base64url',
    )
    expect(verifyRideToken(`${forgedPayload}.${sig}`, 55)).toBe(false)
  })

  it('fails verification for null, empty, or malformed tokens', () => {
    expect(verifyRideToken(null, 1)).toBe(false)
    expect(verifyRideToken('', 1)).toBe(false)
    expect(verifyRideToken('no-separator-here', 1)).toBe(false)
    expect(verifyRideToken('.', 1)).toBe(false)
    expect(verifyRideToken('abc.', 1)).toBe(false)
    expect(verifyRideToken('.0123456789abcdef0123456789abcdef', 1)).toBe(false)
    expect(verifyRideToken('not-valid-base64.0123456789abcdef0123456789abcdef', 1)).toBe(false)
  })

  it('fails verification once the 24-hour TTL has expired', () => {
    vi.useFakeTimers()
    const baseTime = new Date('2026-05-01T12:00:00Z').getTime()
    vi.setSystemTime(baseTime)

    const token = signRideToken(88, 'LP-2026-0088')
    expect(verifyRideToken(token, 88)).toBe(true)

    // Still valid just before 24h
    vi.setSystemTime(baseTime + 24 * 60 * 60 * 1000 - 1000)
    expect(verifyRideToken(token, 88)).toBe(true)

    // Expired after 24h
    vi.setSystemTime(baseTime + 24 * 60 * 60 * 1000 + 1)
    expect(verifyRideToken(token, 88)).toBe(false)
  })
})
