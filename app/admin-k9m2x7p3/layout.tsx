import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'シロの保管庫 - 管理画面',
  description: '作品管理システム',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {children}
    </div>
  )
}
