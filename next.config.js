/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      {
        source: '/admin/logistics',
        destination: '/admin/fleet',
        permanent: true,
      },
      {
        source: '/admin/grid',
        destination: '/admin/payments',
        permanent: true,
      },
      {
        source: '/admin/team',
        destination: '/admin/employees',
        permanent: true,
      },
      {
        source: '/admin/support',
        destination: '/admin/ia-chat',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://*.turso.io https://api-message.innotechlabssas.lat https://api.upstash.com https://api.paddle.com https://sandbox-api.paddle.com; frame-src 'self' https://challenges.cloudflare.com https://*.accounts.dev https://*.clerk.accounts.dev https://sandbox-checkout.paddle.com https://checkout.paddle.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'" },
        ],
      },
    ]
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
