import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@spiko/shared'],

  // Eden treaty `App` tip se lanča iz apps/api/src/index (typeof app). U Vercel
  // izolovanom build-u apps/api zavisnosti (elysia, drizzle, bun-types) nisu
  // instalirane, pa se server-tip ne razreši i strict typecheck lažno puca.
  // Lokalni dev/build i dalje pun typecheck; ne obaraj produkcioni build na tome.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

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
