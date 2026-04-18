/** @type {import('next').NextConfig} */
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

module.exports = nextConfig
