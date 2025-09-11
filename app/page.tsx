'use client'

import React, { useState, useEffect } from 'react'

// 画像データ型
interface ImageData {
  id: string
  year: string
  filename: string
  comment?: string
  width: number
  height: number
}

// モックデータ
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

export default function Gallery() {
  const [images] = useState<ImageData[]>(mockImages)
  const [columns, setColumns] = useState(3)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedMonth, setSelectedMonth] = useState(9)
  const [showModalControls, setShowModalControls] = useState(true)

  // レスポンシブ対応
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setColumns(3) // スマホは3列
      } else {
        setColumns(7) // PCは7列
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ESC・クリックでモーダル/ドロップダウンを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
        setShowColumnDropdown(false)
        setShowCalendar(false)
      }
    }
    
    const handleClickOutside = (e: Event) => {
      const target = e.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowColumnDropdown(false)
      }
      if (!target.closest('.calendar-modal') && !target.closest('.month-btn')) {
        setShowCalendar(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // 横長画像かどうかを判定
  const isLandscape = (image: ImageData) => image.width > image.height

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300">
        
        {/* ヘッダー */}
        <header className="header">
          <h1>シロの保管庫</h1>
          
          <div className="controls">
            {/* 列選択ドロップダウン */}
            <div className="control-group dropdown-container">
              <button 
                className="btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowColumnDropdown(!showColumnDropdown)
                }}
              >
                列 ({columns})
              </button>
              {showColumnDropdown && (
                <div className="dropdown show">
                  {[1,2,3,4,5,6,7].map(num => (
                    <div 
                      key={num}
                      className={`dropdown-item ${columns === num ? 'active' : ''}`}
                      onClick={() => {
                        setColumns(num)
                        setShowColumnDropdown(false)
                      }}
                    >
                      {num}列
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 月ジャンプボタン */}
            <button 
              className="btn month-btn"
              onClick={() => setShowCalendar(true)}
            >
              月
            </button>
            
            {/* テーマ切替 */}
            <button 
              className="btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '🌙 ダーク' : '☀️ ライト'}
            </button>
          </div>
        </header>

        {/* ギャラリー */}
        <main className="gallery">
          <div className="gallery-info">
            総画像数: {images.length}
          </div>
          
          <div 
            className="image-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                className={`image-card ${isLandscape(image) ? 'landscape' : ''}`}
                onClick={() => setSelectedImage(image)}
              >
                <div className="image-placeholder">
                  <div className="image-text">
                    {image.filename}<br />
                    {image.width} × {image.height}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 月ジャンプモーダル */}
        {showCalendar && (
          <div className="calendar-modal show">
            <div className="calendar-content">
              <button 
                className="close-btn"
                onClick={() => setShowCalendar(false)}
              >
                ×
              </button>
              <div className="calendar-header">
                <h3>年月を選択</h3>
              </div>
              
              <div className="year-selector">
                {[2024, 2025].map(year => (
                  <button
                    key={year}
                    className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}年
                  </button>
                ))}
              </div>
              
              <div className="month-grid">
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <button
                    key={month}
                    className={`month-btn ${selectedMonth === month && selectedYear === 2024 ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMonth(month)
                      console.log(`${selectedYear}年${month}月にジャンプ`)
                      setTimeout(() => setShowCalendar(false), 300)
                    }}
                  >
                    {month}月
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 画像拡大モーダル */}
        {selectedImage && (
          <div 
            className="image-modal"
            onClick={() => setSelectedImage(null)}
          >
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* 拡大画像 */}
              <div 
                className="expanded-image"
                onClick={() => setShowModalControls(!showModalControls)}
                style={{
                  width: selectedImage.width > selectedImage.height 
                    ? '90vw' 
                    : `${(selectedImage.width / selectedImage.height) * 90}vh`,
                  height: selectedImage.height > selectedImage.width 
                    ? '90vh' 
                    : `${(selectedImage.height / selectedImage.width) * 90}vw`,
                  maxWidth: '90vw',
                  maxHeight: '90vh'
                }}
              >
                <div 
                  className="image-placeholder-large"
                  style={{
                    width: '100%',
                    height: '100%',
                    aspectRatio: `${selectedImage.width} / ${selectedImage.height}`
                  }}
                >
                  <div className="image-text-large">
                    {selectedImage.filename}<br />
                    {selectedImage.width} × {selectedImage.height}
                  </div>
                </div>
              </div>
              
              {/* コントロール（条件表示） */}
              {showModalControls && (
                <>
                  {/* 閉じるボタン */}
                  <button 
                    className="modal-close-btn"
                    onClick={() => setSelectedImage(null)}
                  >
                    ×
                  </button>
                  
                  {/* コメントボタン */}
                  {selectedImage.comment && (
                    <div className="comment-overlay">
                      <div className="comment-text">
                        {selectedImage.comment}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}