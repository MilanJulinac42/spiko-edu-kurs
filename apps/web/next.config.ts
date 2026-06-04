import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@spiko/shared'],
  experimental: {
    typedRoutes: true,
  },
}

export default config
