import crypto from 'crypto'

const SECRET = process.env.RIDE_TOKEN_SECRET || process.env.CLERK_SECRET_KEY || 'localplug-ride-token-dev'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function signRideToken(rideId: number, bookingRef: string): string {
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = `${rideId}:${bookingRef}:${exp}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32)
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifyRideToken(token: string | null, expectedRideId: number): boolean {
  if (!token || !token.includes('.')) return false
  try {
    const [encoded, sig] = token.split('.')
    const payload = Buffer.from(encoded, 'base64url').toString('utf8')
    const [rideIdStr, , expStr] = payload.split(':')
    if (Number(rideIdStr) !== expectedRideId) return false
    if (expStr && Number(expStr) < Date.now()) return false
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32)
    return sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  } catch {
    return false
  }
}
