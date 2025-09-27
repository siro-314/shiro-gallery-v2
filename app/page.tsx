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
  const [showComment, setShowComment] = useState(false) // コメント表示状態を追加

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
  
  // 常に全データを表示
  const artworks = isProduction ? staticData.artworks : allArtworks

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
        setShowComment(false) // コメント表示もリセット
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

  // 月ジャンプ処理（スクロール移動）
  const jumpToMonth = (year: number, month: number) => {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`
    setSelectedYear(year)
    setSelectedMonth(month)
    setShowCalendar(false)
    
    // 該当する月にスクロール（フィルタリングはしない）
    setTimeout(() => {
      const element = document.querySelector(`[data-month="${yearMonth}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
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
              {(() => {
                // 年月別にグルーピング
                const groupedByYearMonth: { [key: string]: Artwork[] } = {}
                artworks.forEach(artwork => {
                  if (!groupedByYearMonth[artwork.yearMonth]) {
                    groupedByYearMonth[artwork.yearMonth] = []
                  }
                  groupedByYearMonth[artwork.yearMonth].push(artwork)
                })

                // 年月を新しい順にソート
                const sortedYearMonths = Object.keys(groupedByYearMonth)
                  .sort((a, b) => b.localeCompare(a)) // 降順（新しい順）

                const elements: React.ReactElement[] = []
                let lastYear: number | null = null

                sortedYearMonths.forEach((yearMonth, groupIndex) => {
                  const [yearStr, monthStr] = yearMonth.split('-')
                  const year = parseInt(yearStr)
                  const month = parseInt(monthStr)
                  const artworksInGroup = groupedByYearMonth[yearMonth]

                  // 年が変わった場合は年を表示（最新年は除く）
                  const showYear = lastYear !== null && lastYear !== year
                  
                  if (showYear) {
                    elements.push(
                      <div 
                        key={`year-${year}`}
                        className="year-separator"
                        style={{
                          gridColumn: `1 / -1`,
                          textAlign: 'center',
                          padding: '2rem 0 1rem 0',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: 'var(--warm-brown)',
                          borderTop: '3px solid var(--warm-brown)',
                          marginTop: '2rem',
                          marginBottom: '1rem',
                        }}
                      >
                        {year}年
                      </div>
                    )
                  }

                  // 月の表示
                  elements.push(
                    <div 
                      key={`month-${yearMonth}`}
                      className="month-boundary"
                      style={{
                        gridColumn: `1 / -1`,
                        textAlign: 'center',
                        padding: '1rem 0',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: 'var(--warm-brown)',
                        borderBottom: '2px solid var(--cream-bg)',
                        marginBottom: '1rem',
                      }}
                      data-month={yearMonth}
                    >
                      {month}月
                    </div>
                  )

                  // その月の画像を追加
                  artworksInGroup
                    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) // 月内では新しい順
                    .forEach((artwork, artworkIndex) => {
                      elements.push(
                        <div
                          key={artwork.id}
                          className={`image-card ${isLandscape(artwork) ? 'landscape' : ''}`}
                          onClick={() => {
                            setSelectedImage(artwork)
                            setShowComment(false) // 新しい画像を開く時はコメント表示をリセット
                          }}
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
                      )
                    })

                  lastYear = year
                })

                return elements
              })()}
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
                      className={`month-btn ${!hasData ? 'disabled' : ''}`}
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
            onClick={(e) => {
              // 背景のクリック時のみモーダルを閉じる
              if (e.target === e.currentTarget) {
                setSelectedImage(null)
                setShowComment(false) // コメント表示もリセット
              }
            }}
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
                    onClick={() => {
                      setSelectedImage(null)
                      setShowComment(false) // コメント表示もリセット
                    }}
                  >
                    ×
                  </button>
                  
                  {/* コメント関連 */}
                  {selectedImage.comment && (
                    <>
                      {!showComment ? (
                        /* 吹き出しアイコン */
                        <button 
                          className="comment-bubble-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowComment(true)
                          }}
                          title="コメントを表示"
                        >
                          💬
                        </button>
                      ) : (
                        /* 全文コメント表示 */
                        <div 
                          className="comment-overlay"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowComment(false)
                          }}
                        >
                          <div 
                            className="comment-text"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {selectedImage.comment}
                          </div>
                        </div>
                      )}
                    </>
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
