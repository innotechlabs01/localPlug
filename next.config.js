/** @type {import('next').NextConfig} */
const nextConfig = {
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
