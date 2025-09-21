/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlifyで動的APIを使用するため、静的エクスポートを無効化
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
