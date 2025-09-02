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

export default function RootLayout({
            children,
}: {
            children: React.ReactNode
}) {
            return (
                          <html lang="ja">
                                <body className={inter.className}>
                                        <div className="min-h-screen bg-gradient">
                                                  <header className="glass-card border-b border-glass-border mb-8 sticky top-0 z-50">
                                                              <div className="container mx-auto px-4 py-4">
                                                                            <h1 className="text-2xl font-bold text-center text-glass-text">
                                                                                            シロの保管庫
                                                                                          </h1>h1>
                                                                          </div>div>
                                                            </header>header>
                                                  <main className="container mx-auto px-4 pb-8">
                                                            {children}
                                                            </main>main>
                                                </div>div>
                                      </body>body>
                              </html>html>
                        )
}</html>
