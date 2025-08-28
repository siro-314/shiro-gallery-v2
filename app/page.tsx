'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// 画像データの型定義
interface ImageData {
  id: string
  year: string
  filename: string
  comment?: string
  width: number
  height: number
}

// モックデータ（実際の運用では外部ファイルから読み込む）
const mockImages: ImageData[] = [
  { id: '2024-001', year: '2024', filename: '001.jpg', comment: 'サンプル画像1', width: 768, height: 1088 },
  { id: '2024-002', year: '2024', filename: '002.jpg', comment: 'サンプル画像2', width: 1088, height: 768 },
  { id: '2024-003', year: '2024', filename: '003.jpg', comment: 'サンプル画像3', width: 768, height: 1088 },
  { id: '2024-004', year: '2024', filename: '004.jpg', comment: 'サンプル画像4', width: 768, height: 1088 },
  { id: '2024-005', year: '2024', filename: '005.jpg', comment: 'サンプル画像5', width: 1088, height: 768 },
  { id: '2024-006', year: '2024', filename: '006.jpg', comment: 'サンプル画像6', width: 768, height: 1088 },
  { id: '2024-007', year: '2024', filename: '007.jpg', comment: 'サンプル画像7', width: 768, height: 1088 },
  { id: '2024-008', year: '2024', filename: '008.jpg', comment: 'サンプル画像8', width: 1088, height: 768 },
]

// Pinterest風グリッドレイアウトのフック
function useMasonryLayout(images: ImageData[], columns: number) {
  const [layout, setLayout] = useState<ImageData[][]>([])
  
  useEffect(() => {
    if (images.length === 0) return
    
    // カラム数に基づいて配列を初期化
    const columnArrays: ImageData[][] = Array.from({ length: columns }, () => [])
    const columnHeights = Array(columns).fill(0)
    
    images.forEach((image) => {
      // 最も高さの低いカラムを見つける
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // そのカラムに画像を追加
      columnArrays[shortestColumnIndex].push(image)
      
      // そのカラムの高さを更新（アスペクト比を考慮）
      const aspectRatio = image.height / image.width
      columnHeights[shortestColumnIndex] += aspectRatio * 300 + 20 // 基準幅300px + マージン20px
    })
    
    setLayout(columnArrays)
  }, [images, columns])
  
  return layout
}

export default function Gallery() {
  const [images] = useState<ImageData[]>(mockImages)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [columns, setColumns] = useState(4)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Masonryレイアウトの計算
  const layout = useMasonryLayout(images, columns)
  
  // ダークモードの切り替え
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])
  
  // レスポンシブ対応
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setColumns(1) // スマホ
      } else if (width < 1024) {
        setColumns(3) // タブレット
      } else if (width < 1280) {
        setColumns(4) // 小さいPC
      } else {
        setColumns(5) // 大きいPC
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 画像クリックハンドラー
  const handleImageClick = useCallback((image: ImageData) => {
    setSelectedImage(image)
  }, [])
  
  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setSelectedImage(null)
  }, [])
  
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    
    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage, closeModal])
  
  return (
    <div className="min-h-screen">
      {/* コントロールパネル */}
      <div className="glass-card mb-8 p-4 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* カラム数選択 */}
          <div className="flex items-center gap-2">
            <span className="text-glass-text font-medium">カラム数:</span>
            <div className="flex gap-1">
              {[1, 3, 4, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setColumns(num)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    columns === num
                      ? 'bg-blue-500 text-white'
                      : 'bg-glass-secondary text-glass-text hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          {/* ダークモード切り替え */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-glass-secondary text-glass-text hover:bg-glass-hover transition-colors"
          >
            <span>{isDarkMode ? '🌙' : '☀️'}</span>
            <span>{isDarkMode ? 'ダークモード' : 'ライトモード'}</span>
          </button>
          
          {/* 画像数表示 */}
          <div className="text-glass-text-secondary">
            総画像数: {images.length}
          </div>
        </div>
      </div>
      
      {/* Pinterest風ギャラリー */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {layout.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {column.map((image) => (
              <div
                key={image.id}
                className="glass-card rounded-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl"
                onClick={() => handleImageClick(image)}
              >
                {/* 画像プレースホルダー */}
                <div 
                  className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center"
                  style={{
                    aspectRatio: `${image.width} / ${image.height}`,
                    minHeight: '200px'
                  }}
                >
                  <div className="text-center p-4">
                    <div className="text-glass-text-secondary text-sm mb-2">
                      {image.filename}
                    </div>
                    <div className="text-glass-text-secondary text-xs">
                      {image.width} × {image.height}
                    </div>
                  </div>
                </div>
                
                {/* コメント */}
                {image.comment && (
                  <div className="p-3 bg-glass-secondary/50">
                    <p className="text-glass-text text-sm line-clamp-2">
                      {image.comment}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* モーダル */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="glass-card max-w-4xl max-h-[90vh] w-full overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="p-4 border-b border-glass-border flex justify-between items-center">
              <h3 className="text-glass-text font-bold text-lg">
                {selectedImage.filename}
              </h3>
              <button 
                onClick={closeModal}
                className="text-glass-text-secondary hover:text-glass-text text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* モーダル画像エリア */}
            <div className="p-4 overflow-auto max-h-[70vh]">
              <div 
                className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center mx-auto"
                style={{
                  aspectRatio: `${selectedImage.width} / ${selectedImage.height}`,
                  maxWidth: '100%',
                  maxHeight: '60vh'
                }}
              >
                <div className="text-center p-8">
                  <div className="text-glass-text text-xl mb-4">
                    {selectedImage.filename}
                  </div>
                  <div className="text-glass-text-secondary">
                    {selectedImage.width} × {selectedImage.height}
                  </div>
                  {selectedImage.comment && (
                    <div className="mt-4 text-glass-text">
                      {selectedImage.comment}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
