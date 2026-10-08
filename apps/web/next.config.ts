import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@docai/document', '@docai/shared'],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    }
    return webpackConfig
  },
}

export default config
