import crypto from 'crypto'

const SECRET = process.env.CLERK_SECRET_KEY || process.env.NEXTAUTH_SECRET || 'localplug-ride-token-dev'

export function signRideToken(rideId: number, bookingRef: string): string {
  const payload = `${rideId}:${bookingRef}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32)
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifyRideToken(token: string | null, expectedRideId: number): boolean {
  if (!token || !token.includes('.')) return false
  try {
    const [encoded, sig] = token.split('.')
    const payload = Buffer.from(encoded, 'base64url').toString('utf8')
    const [rideIdStr] = payload.split(':')
    if (Number(rideIdStr) !== expectedRideId) return false
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32)
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  } catch {
    return false
  }
}
