/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'media.formula1.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/previsoes', destination: '/predict', permanent: true },
      { source: '/previsoes/:path*', destination: '/predict/:path*', permanent: true },
    ]
  },
}

module.exports = withPWA(nextConfig)
