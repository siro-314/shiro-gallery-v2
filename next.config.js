/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境（Netlify）では静的エクスポート、開発環境ではAPIルートを使用
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
