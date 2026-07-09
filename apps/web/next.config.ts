import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const config: NextConfig = {
  transpilePackages: ['@spiko/shared'],

  // Dev-mode performance: ograniči koliko ruta drži u memoriji.
  // Bez ovoga dev server gomila kompajlovane rute → leak → jest-worker crash.
  onDemandEntries: {
    maxInactiveAge: 5 * 60 * 1000, // 5 min
    pagesBufferLength: 4,
  },

  // Onemogući X-Powered-By header (sitni perf + manje header tokena)
  poweredByHeader: false,

  // Kompresija je u Bun-u (gzip middleware) za API; Next sam zna za HTML.
  compress: true,

  // Dozvoljeni izvori za next/image — Bunny CDN (avatari, thumbnail-i kurseva,
  // audio cover-i). Svi `*.b-cdn.net` domeni su Bunny Pull Zone-e.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.b-cdn.net' },
    ],
  },

  experimental: {
    // Optimize package imports — Next 15 ovo razume; samo paketi koje stvarno koristimo.
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'lucide-react',
    ],
  },

  // Build performance + cache
  productionBrowserSourceMaps: false,
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(config)
