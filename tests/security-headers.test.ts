import { describe, it, expect } from 'vitest'
// @ts-expect-error next.config.js is commonjs
import nextConfig from '../next.config.js'

describe('Security Headers Configuration', () => {
  it('defines headers function returning standard security headers for all routes', async () => {
    expect(typeof nextConfig.headers).toBe('function')

    const headersConfig = await nextConfig.headers()
    expect(Array.isArray(headersConfig)).toBe(true)

    const globalRouteConfig = headersConfig.find(
      (entry: { source: string }) => entry.source === '/:path*',
    )
    expect(globalRouteConfig).toBeDefined()

    const headersMap = new Map(
      globalRouteConfig.headers.map((h: { key: string; value: string }) => [
        h.key.toLowerCase(),
        h.value,
      ]),
    )

    expect(headersMap.get('x-frame-options')).toBe('DENY')
    expect(headersMap.get('x-content-type-options')).toBe('nosniff')
    expect(headersMap.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(headersMap.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()')
  })
})
