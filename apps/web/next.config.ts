import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@claudecamp/campfire'],
  output: 'export',
}

export default nextConfig
