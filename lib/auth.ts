export const SESSION_COOKIE_NAME = 'lp_admin_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || 'lp-local-dev-admin-secret-key-must-be-changed-in-prod'
}

export interface AdminSessionPayload {
  email: string
  role: 'admin'
  exp: number
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/**
 * Creates a cryptographically signed HMAC token for admin sessions using Web Crypto API.
 * Compatible with Node.js, Edge runtime, and browser environments.
 */
export async function createSessionToken(email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const payload: AdminSessionPayload = { email, role: 'admin', exp }
  const jsonStr = JSON.stringify(payload)
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(jsonStr))

  const key = await getHmacKey()
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload),
  )
  const signature = base64UrlEncode(signatureBuffer)

  return `${encodedPayload}.${signature}`
}

/**
 * Verifies an HMAC-signed session token using Web Crypto API constant-time verification.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  if (!token || !token.includes('.')) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  try {
    const key = await getHmacKey()
    const rawSig = base64UrlDecode(signature)
    const sigBytes = new Uint8Array(rawSig.length)
    for (let i = 0; i < rawSig.length; i++) {
      sigBytes[i] = rawSig.charCodeAt(i)
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(encodedPayload),
    )

    if (!isValid) return null

    const payload: AdminSessionPayload = JSON.parse(base64UrlDecode(encodedPayload))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
