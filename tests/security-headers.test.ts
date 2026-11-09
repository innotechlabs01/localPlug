import { describe, it, expect } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextConfig = require('../next.config.js')

describe('HTTP Security Headers Configuration', () => {
  it('defines an async headers function in next.config.js', async () => {
    expect(typeof nextConfig.headers).toBe('function')
  })

  it('configures security headers for all routes (/:path*)', async () => {
    const headerConfigs = await nextConfig.headers()
    expect(Array.isArray(headerConfigs)).toBe(true)

    const globalConfig = headerConfigs.find(
      (c: { source: string; headers: Array<{ key: string; value: string }> }) =>
        c.source === '/:path*',
    )
    expect(globalConfig).toBeDefined()

    const headersMap = new Map(
      globalConfig.headers.map((h: { key: string; value: string }) => [
        h.key.toLowerCase(),
        h.value,
      ]),
    )

    // X-Frame-Options prevents clickjacking
    expect(headersMap.get('x-frame-options')).toBe('DENY')

    // X-Content-Type-Options prevents MIME sniffing
    expect(headersMap.get('x-content-type-options')).toBe('nosniff')

    // Referrer-Policy protects user privacy on cross-origin requests
    expect(headersMap.get('referrer-policy')).toBe('strict-origin-when-cross-origin')

    // Permissions-Policy restricts sensitive device APIs
    expect(headersMap.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()')
  })
})
