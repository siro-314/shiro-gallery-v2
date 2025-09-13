'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'

interface Artwork {
  id: string
  filename: string
  comment?: string
  isMonthBorder?: boolean
  order: number
}

export default function AdminPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 超シンプルヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#6b5b4d]">管理</h1>
      </div>

      {/* タブなし - アップロードのみ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <FileUpload artworks={artworks} setArtworks={setArtworks} />
      </div>
    </div>
  )
}
