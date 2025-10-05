import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'シロの保管庫',
  description: 'イラスト・動画ギャラリーサイト - 健全版からR15版まで全てのアートワークを保管',
  keywords: 'イラスト,動画,ギャラリー,アート,シロ',
  authors: [{ name: 'Siro' }],
  creator: 'Siro',
  publisher: 'Siro',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
