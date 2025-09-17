'use client'

import React, { useState, useEffect } from 'react'
import { useArtworks, useAvailableMonths } from './hooks/useArtworks'
import { useStaticData } from './hooks/useStaticData'
import { Artwork } from './lib/types'

export default function Gallery() {
  const [columns, setColumns] = useState(3)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Artwork | null>(null)
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [targetMonth, setTargetMonth] = useState<string | undefined>()
  const [showModalControls, setShowModalControls] = useState(true)

  // 環境に応じたデータ取得方法を選択
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 動的データ取得（開発環境）
  const dynamicData = useArtworks({ 
    month: targetMonth,
    autoFetch: !isProduction 
  })
  const dynamicMonths = useAvailableMonths()
  
  // 静的データ取得（本番環境）
  const staticData = useStaticData()
  
  // 環境に応じてデータソースを切り替え
  const {
    artworks: allArtworks,
    loading,
    error,
    refresh
  } = isProduction ? {
    artworks: staticData.artworks,
    loading: staticData.loading,
    error: staticData.error,
    refresh: staticData.refresh
  } : {
    artworks: dynamicData.artworks,
    loading: dynamicData.loading,
    error: dynamicData.error,
    refresh: dynamicData.refresh
  }
  
  const { months, years } = isProduction ? staticData : dynamicMonths
  
  // 月フィルタリング（本番環境用）
  const artworks = isProduction 
    ? staticData.getArtworksByMonth(targetMonth)
    : allArtworks

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

  // 年の初期化
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0])
    }
  }, [years, selectedYear])

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
  const isLandscape = (artwork: Artwork) => {
    if (!artwork.dimensions) return false
    return artwork.dimensions.width > artwork.dimensions.height
  }

  // 月ジャンプ処理
  const jumpToMonth = (year: number, month: number) => {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`
    setTargetMonth(yearMonth)
    setSelectedYear(year)
    setSelectedMonth(month)
    setShowCalendar(false)
    
    // 該当する月にスクロール
    setTimeout(() => {
      const element = document.querySelector(`[data-month="${yearMonth}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // 全表示に戻る
  const showAllArtworks = () => {
    setTargetMonth(undefined)
  }

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
            
            {/* 全表示ボタン */}
            {targetMonth && (
              <button 
                className="btn"
                onClick={showAllArtworks}
                title="全ての作品を表示"
              >
                全表示
              </button>
            )}
            
            {/* リフレッシュボタン */}
            <button 
              className="btn"
              onClick={refresh}
              disabled={loading}
              title="データを更新"
            >
              {loading ? '🔄' : '↻'}
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
          {/* 状態表示 */}
          <div className="gallery-info">
            {loading && <span>読み込み中...</span>}
            {error && (
              <span className="error" style={{ color: '#ef4444' }}>
                エラー: {error}
              </span>
            )}
            {!loading && !error && (
              <>
                総画像数: {artworks.length}
                {targetMonth && (
                  <span className="filtered-info">
                    {' '}({targetMonth} のみ表示中)
                  </span>
                )}
              </>
            )}
          </div>
          
          {/* 作品グリッド */}
          {!loading && !error && artworks.length === 0 ? (
            <div className="empty-state">
              <p>まだ作品がアップロードされていません</p>
            </div>
          ) : (
            <div 
              className="image-grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className={`image-card ${isLandscape(artwork) ? 'landscape' : ''}`}
                  onClick={() => setSelectedImage(artwork)}
                  data-month={artwork.yearMonth}
                >
                  {artwork.type === 'image' ? (
                    <img 
                      src={artwork.url}
                      alt={artwork.originalName}
                      className="artwork-image"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : (
                    <video 
                      src={artwork.url}
                      className="artwork-video"
                      preload="metadata"
                      muted
                    />
                  )}
                  
                  {/* フォールバック表示 */}
                  <div className="image-placeholder hidden">
                    <div className="image-text">
                      {artwork.originalName}<br />
                      {artwork.dimensions ? 
                        `${artwork.dimensions.width} × ${artwork.dimensions.height}` : 
                        artwork.type
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                {months.length > 0 && (
                  <p className="calendar-subtitle">
                    {months.length}ヶ月分のデータがあります
                  </p>
                )}
              </div>
              
              <div className="year-selector">
                {years.map(year => (
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
                {Array.from({length: 12}, (_, i) => i + 1).map(month => {
                  const yearMonth = `${selectedYear}-${month.toString().padStart(2, '0')}`
                  const monthData = months.find(m => m.yearMonth === yearMonth)
                  const hasData = !!monthData
                  const count = monthData?.count || 0
                  
                  return (
                    <button
                      key={month}
                      className={`month-btn ${!hasData ? 'disabled' : ''} ${targetMonth === yearMonth ? 'active' : ''}`}
                      disabled={!hasData}
                      onClick={() => hasData && jumpToMonth(selectedYear, month)}
                    >
                      {month}月
                      {hasData && <span className="month-count">({count})</span>}
                    </button>
                  )
                })}
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
                  width: selectedImage.dimensions && selectedImage.dimensions.width > selectedImage.dimensions.height 
                    ? '90vw' 
                    : selectedImage.dimensions ? `${(selectedImage.dimensions.width / selectedImage.dimensions.height) * 90}vh` : '90vw',
                  height: selectedImage.dimensions && selectedImage.dimensions.height > selectedImage.dimensions.width 
                    ? '90vh' 
                    : selectedImage.dimensions ? `${(selectedImage.dimensions.height / selectedImage.dimensions.width) * 90}vw` : '90vh',
                  maxWidth: '90vw',
                  maxHeight: '90vh'
                }}
              >
                {selectedImage.type === 'image' ? (
                  <img 
                    src={selectedImage.url}
                    alt={selectedImage.originalName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                ) : (
                  <video 
                    src={selectedImage.url}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                )}
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
