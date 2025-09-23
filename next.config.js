/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlifyで動的APIを使用するため、静的エクスポートを無効化
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Netlify Next.js Runtime用のAPIルート最適化
  experimental: {
    serverComponentsExternalPackages: []
  },
  // APIルートが確実に動的に処理されるように設定
  async rewrites() {
    return []
  }
}

module.exports = nextConfig
