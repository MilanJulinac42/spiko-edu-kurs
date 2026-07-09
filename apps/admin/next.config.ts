import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@spiko/shared'],

  onDemandEntries: {
    maxInactiveAge: 5 * 60 * 1000,
    pagesBufferLength: 4,
  },

  poweredByHeader: false,

  // Dozvoljeni izvori za next/image — Bunny CDN (thumbnail-i kurseva, mediji).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.b-cdn.net' },
    ],
  },

  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },

  productionBrowserSourceMaps: false,
}

export default config
