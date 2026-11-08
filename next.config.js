/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
  // The telemetry page is live and carries the guide card: never serve it from the app's cache, or members see the previous
  // version (without the latest panels or the updated guide) on the first visit after each deploy.
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      { urlPattern: ({ url }) => url.pathname.startsWith('/telemetria'), handler: 'NetworkOnly' },
    ],
  },
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
