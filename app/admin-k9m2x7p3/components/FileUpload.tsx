'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileImage, X, Check, MessageSquare, Loader2 } from 'lucide-react'
import { FileData, UploadRequest, Artwork } from '../../lib/types'

interface PendingArtwork {
  id: string
  filename: string
  comment: string
  isMonthBorder: boolean
  order: number
  file: File
  preview: string
}

interface FileUploadProps {
  artworks: Artwork[]
  setArtworks: (artworks: Artwork[]) => void
}

export default function FileUpload({ artworks, setArtworks }: FileUploadProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingArtwork[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // デフォルト年月を取得（最新のグループに追加されるように）
  const getDefaultYearMonth = () => {
    // 既存のアートワークがある場合、最新のものと同じ年月を使用
    // ない場合は2024-01をデフォルトにする
    if (artworks.length > 0) {
      const latestArtwork = [...artworks].sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];
      return latestArtwork.yearMonth || '2024-01';
    }
    return '2024-01'; // デフォルト
  }
  
  // 手動年月入力用のstate
  const [manualYearMonth, setManualYearMonth] = useState('')

  // 画像をWebPに変換してBase64化
  const fileToWebP = (file: File, comment?: string): Promise<{ base64: string; sizeKB: number; originalSizeKB: number }> => {
    return new Promise((resolve, reject) => {
      // 動画の場合はそのまま処理
      if (file.type.startsWith('video/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          const originalSizeKB = Math.round(file.size / 1024)
          resolve({ 
            base64, 
            sizeKB: originalSizeKB, 
            originalSizeKB 
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      // 画像の場合はWebP変換
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 画像サイズを取得
        canvas.width = img.width
        canvas.height = img.height
        
        // 画像を描画
        ctx.drawImage(img, 0, 0)
        
        // コメントのバイトサイズを計算（Base64変換時のオーバーヘッドも考慮）
        const commentBytes = comment ? new Blob([comment], { type: 'text/plain' }).size : 0
        const commentKB = Math.round(commentBytes / 1024)
        
        // 動的な圧縮目標サイズ：750KB - コメントのバイト数（最小300KB、最大750KB）
        const targetSizeKB = Math.max(300, Math.min(750, 750 - commentKB))
        
        const originalSizeKB = Math.round(file.size / 1024)
        console.log(`🖼️ Processing image: ${file.name} (${originalSizeKB}KB)`)
        console.log(`📝 Comment size: ${commentKB}KB, Target compression: ${targetSizeKB}KB`)
        
        // 初期品質をファイルサイズに応じて調整
        let quality = 0.85 // デフォルト品質
        
        // ファイルサイズに応じて初期品質を調整
        const originalSizeKB = Math.round(file.size / 1024)
        if (originalSizeKB > 5000) quality = 0.6       // 5MB超は品質60%から開始
        else if (originalSizeKB > 3000) quality = 0.65 // 3MB超は品質65%から開始
        else if (originalSizeKB > 2000) quality = 0.7  // 2MB超は品質70%から開始
        else if (originalSizeKB > 1000) quality = 0.75 // 1MB超は品質75%から開始
        else if (originalSizeKB > 500) quality = 0.8   // 500KB超は品質80%から開始
        
        let webpBlob: Blob | null = null
        let attempts = 0
        const maxAttempts = 12 // 最大試行回数を増加
        
        // 品質を段階的に下げて1MB以内に収まるまで繰り返し
        const processWebP = async (): Promise<void> => {
          while (attempts < maxAttempts) {
            attempts++
            
            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
            })
            
            if (!blob) {
              reject(new Error('WebP conversion failed'))
              return
            }
            
            const currentSizeKB = Math.round(blob.size / 1024)
            
            console.log(`🔄 WebP attempt ${attempts}: ${file.name} at quality ${(quality * 100).toFixed(0)}% = ${currentSizeKB}KB (target: ${targetSizeKB}KB)`)
            
            if (currentSizeKB <= targetSizeKB || quality <= 0.2) { // 目標サイズ以下または最低品質に達したら完了
              webpBlob = blob
              break
            }
            
            // 品質を下げて再試行（より細かく調整）
            const overshootKB = currentSizeKB - targetSizeKB
            if (overshootKB > 200) {
              quality = Math.max(0.2, quality - 0.15) // 大幅に超過している場合は大幅減
            } else if (overshootKB > 100) {
              quality = Math.max(0.2, quality - 0.1)  // 中程度超過の場合は中程度減
            } else {
              quality = Math.max(0.2, quality - 0.05) // 小さな調整
            }
          }
          
          if (!webpBlob) {
            reject(new Error('Could not compress image to acceptable size'))
            return
          }
          
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            const webpSizeKB = Math.round(webpBlob!.size / 1024)
            
            const reduction = Math.round((1 - webpBlob!.size / file.size) * 100)
            const finalQuality = Math.round(quality * 100)
            
            console.log(`🖼️ WebP conversion completed: ${file.name}`)
            console.log(`   Original: ${originalSizeKB}KB → WebP: ${webpSizeKB}KB (${reduction}% reduction, ${finalQuality}% quality, ${attempts} attempts)`)
            console.log(`   Target: ${targetSizeKB}KB, Comment size: ${commentKB}KB`)
            
            if (webpSizeKB > targetSizeKB) {
              console.warn(`⚠️ Warning: ${file.name} is still ${webpSizeKB}KB (over ${targetSizeKB}KB target limit)`)
            }
            
            resolve({ 
              base64, 
              sizeKB: webpSizeKB, 
              originalSizeKB 
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(webpBlob)
        }
        
        processWebP().catch(reject)
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // ファイル選択処理（順番保持が重要）
  const handleFileSelect = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    const newPendingUploads: PendingArtwork[] = []

    // 選択された順番通りに処理
    fileArray.forEach((file, index) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const id = `temp_${Date.now()}_${index}` // 順番保証のためindexを含める
        const preview = URL.createObjectURL(file)
        const order = artworks.length + pendingUploads.length + index
        
        newPendingUploads.push({
          id,
          filename: file.name,
          file,
          preview,
          order,
          comment: '',
          isMonthBorder: false
        })
      }
    })

    setPendingUploads(prev => [...prev, ...newPendingUploads])
  }, [artworks.length, pendingUploads.length])

  // ドラッグ&ドロップ処理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // ファイル選択ダイアログ
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  // 個別アップロード削除
  const removePendingUpload = (id: string) => {
    setPendingUploads(prev => {
      const updated = prev.filter(item => item.id !== id)
      // プレビューURLをクリーンアップ
      const toRemove = prev.find(item => item.id === id)
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview)
      }
      return updated
    })
  }

  // コメント更新
  const updateComment = (id: string, comment: string) => {
    setPendingUploads(prev => 
      prev.map(item => item.id === id ? { ...item, comment } : item)
    )
  }

  // 月境目フラグ更新
  const toggleMonthBorder = (id: string) => {
    setPendingUploads(prev => 
      prev.map(item => item.id === id ? { ...item, isMonthBorder: !item.isMonthBorder } : item)
    )
  }

  // フロントエンドバッチアップロード実行（大量ファイル対応）
  const handleUpload = async () => {
    if (pendingUploads.length === 0) return

    setIsUploading(true)
    setUploadStatus('ファイルを準備中...')

    try {
      // ファイルデータを準備
      const fileDataArray: FileData[] = []
      
      for (const upload of pendingUploads) {
        setUploadStatus(`${upload.filename} を WebP変換中...`)
        
        const { base64: base64Content, sizeKB, originalSizeKB } = await fileToWebP(upload.file, upload.comment)
        
        // 大幅な圧縮が行われた場合の通知
        const reduction = Math.round((1 - (sizeKB * 1024) / upload.file.size) * 100)
        if (reduction > 70) {
          setUploadStatus(`${upload.filename} を最適化しました (${reduction}% 圧縮)`)
          // 少し長めに表示
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        // WebP変換後のファイル名を生成
        const originalName = upload.filename
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
        const newFilename = upload.file.type.startsWith('video/') 
          ? originalName // 動画はそのまま
          : `${nameWithoutExt}.webp` // 画像はWebPに
        
        fileDataArray.push({
          name: newFilename,
          content: base64Content,
          type: upload.file.type.startsWith('video/') ? upload.file.type : 'image/webp',
          comment: upload.comment || undefined,
        })
        
        console.log(`📊 File processed: ${originalName} → ${newFilename} (${originalSizeKB}KB → ${sizeKB}KB)`)
      }

      const yearMonth = manualYearMonth || getDefaultYearMonth()
      const monthBoundary = pendingUploads.some(upload => upload.isMonthBorder)

      // 安全性優先：すべて1ファイルずつ送信
      const allResults: any[] = []
      const allErrors: string[] = []
      const totalFiles = fileDataArray.length

      console.log(`📊 Safe upload: ${totalFiles} files, one by one`)
      setUploadProgress({ current: 0, total: totalFiles })

      for (let i = 0; i < totalFiles; i++) {
        const currentFile = fileDataArray[i]
        
        setUploadStatus(`ファイル ${i + 1}/${totalFiles}: ${currentFile.name} をアップロード中...`)
        setUploadProgress({ current: i, total: totalFiles })

        try {
          const uploadRequest: UploadRequest = {
            files: [currentFile], // 1ファイルのみ
            yearMonth,
            monthBoundary: i === 0 ? monthBoundary : false, // 最初のファイルのみmonthBoundaryを適用
          }

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(uploadRequest),
          })

          if (!response.ok) {
            if (response.status === 413) {
              throw new Error(`ファイル ${currentFile.name}: サイズが大きすぎます`)
            }
            
            let errorMessage = `ファイル ${currentFile.name}: アップロードに失敗しました`
            try {
              const responseText = await response.text()
              try {
                const errorData = JSON.parse(responseText)
                errorMessage = errorData.error || errorMessage
              } catch {
                errorMessage = responseText || errorMessage
              }
            } catch {
              // レスポンス読み取り失敗時はデフォルトメッセージ
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          if (result.artworks) {
            allResults.push(...result.artworks)
          }

          console.log(`✅ File ${i + 1}/${totalFiles} completed: ${currentFile.name}`)

          // ファイル間の短い待機時間（API制限対策）
          if (i < totalFiles - 1) {
            await new Promise(resolve => setTimeout(resolve, 300)) // 0.3秒待機
          }

        } catch (fileError) {
          console.error(`❌ File ${i + 1} failed:`, fileError)
          allErrors.push(`${currentFile.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`)
          
          // 1つのファイルが失敗しても続行
          continue
        }
      }

      setUploadProgress({ current: totalFiles, total: totalFiles })

      // 結果の集計とメッセージ表示
      const successCount = allResults.length
      const errorCount = allErrors.length

      if (errorCount === 0) {
        // 全て成功
        setUploadStatus(`✅ ${successCount}件のファイルをアップロードしました！`)
      } else if (successCount > 0) {
        // 部分的成功
        setUploadStatus(`⚠️ ${successCount}件成功、${errorCount}件エラー`)
        console.warn('Frontend batch errors:', allErrors)
      } else {
        // 全て失敗
        throw new Error(`すべてのアップロードに失敗しました: ${allErrors.join(', ')}`)
      }

      // 成功時の処理
      // プレビューURLをクリーンアップ
      pendingUploads.forEach(upload => {
        URL.revokeObjectURL(upload.preview)
      })

      // 手動年月入力をリセット
      setManualYearMonth('')

      // 追加されたアートワーク（成功分のみ）を既存リストに反映
      if (allResults.length > 0) {
        const newArtworks: Artwork[] = allResults.map((artwork: any, index: number) => ({
          id: artwork.id,
          filename: artwork.filename,
          originalName: artwork.originalName || artwork.filename,
          type: artwork.type || 'image',
          url: artwork.url || '',
          comment: artwork.comment,
          uploadedAt: artwork.uploadedAt || new Date().toISOString(),
          yearMonth: artwork.yearMonth || '2024-01',
          isMonthBoundary: artwork.isMonthBoundary || false
        }))

        setArtworks([...artworks, ...newArtworks])
      }
      
      setPendingUploads([])

      // 3秒後にステータスをクリア
      setTimeout(() => {
        setUploadStatus('')
        setUploadProgress(null)
      }, 3000)

    } catch (error) {
      console.error('Upload failed:', error)
      setUploadStatus(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      
      // 10秒後にエラーメッセージをクリア
      setTimeout(() => {
        setUploadStatus('')
        setUploadProgress(null)
      }, 10000)
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  // 全削除
  const clearAllPending = () => {
    pendingUploads.forEach(upload => {
      URL.revokeObjectURL(upload.preview)
    })
    setPendingUploads([])
  }

  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-amber-100/30">
      {/* ドロップゾーン */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-amber-400 bg-amber-50/50 scale-102' 
            : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-amber-500' : 'text-amber-400'}`} />
        <p className="text-lg font-medium text-amber-700 mb-2">
          ファイルをドラッグ&ドロップ
        </p>
        <p className="text-sm text-amber-600">
          または、クリックして選択
        </p>
      </div>

      {/* アップロード状況表示 */}
      {(isUploading || uploadStatus) && (
        <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-200/50">
          <div className="flex items-center gap-3 mb-2">
            {isUploading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            <span className={`text-sm ${isUploading ? 'text-blue-700' : 'text-green-700'}`}>
              {uploadStatus}
            </span>
          </div>
          
          {/* プログレスバー（バッチ処理時） */}
          {uploadProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-blue-600 mb-1">
                <span>進捗</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ペンディングアップロード一覧 */}
      {pendingUploads.length > 0 && (
        <div className="mt-6">
          {/* 年月入力エリア */}
          <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-amber-800">
                年月指定（例外時のみ）:
              </label>
              <input
                type="text"
                placeholder="2023-07 (YYYY-MM形式)"
                value={manualYearMonth}
                onChange={(e) => setManualYearMonth(e.target.value)}
                disabled={isUploading}
                className="px-3 py-2 text-sm border border-amber-300 rounded-2xl bg-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              {manualYearMonth && (
                <button
                  onClick={() => setManualYearMonth('')}
                  disabled={isUploading}
                  className="text-xs text-amber-600 hover:text-amber-800 underline disabled:opacity-50"
                >
                  クリア
                </button>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              空の場合は自動で現在の年月になります。月の境目は各画像の「月境目」ボタンで指定してください。
            </p>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-800">
              アップロード予定: {pendingUploads.length}件
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearAllPending}
                disabled={isUploading}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-2xl border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                全削除
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    アップロード開始
                  </>
                )}
              </button>
            </div>
          </div>

          {/* アップロード予定ファイルのグリッド */}
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {pendingUploads
              .sort((a, b) => a.order - b.order) // 順番保持
              .map((upload) => (
                <div key={upload.id} className="group">
                  <div className="relative bg-white/60 rounded-2xl border border-amber-100/50 overflow-hidden">
                    {/* プレビュー画像 */}
                    <div className="aspect-square relative">
                      {upload.file.type.startsWith('image/') ? (
                        <img
                          src={upload.preview}
                          alt={upload.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <FileImage className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* 削除ボタン */}
                      <button
                        onClick={() => removePendingUpload(upload.id)}
                        disabled={isUploading}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* 月境目フラグ */}
                      {upload.isMonthBorder && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          境目
                        </div>
                      )}
                    </div>

                    {/* ファイル情報 */}
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate mb-1" title={upload.filename}>
                        {upload.filename}
                      </p>
                      
                      {/* コメント入力 */}
                      <input
                        type="text"
                        placeholder="コメント"
                        value={upload.comment}
                        onChange={(e) => updateComment(upload.id, e.target.value)}
                        disabled={isUploading}
                        className="w-full text-xs p-1 border border-gray-200 rounded bg-white/50 focus:outline-none focus:border-amber-300 disabled:opacity-50"
                      />
                      
                      {/* 月境目フラグボタン */}
                      <button
                        onClick={() => toggleMonthBorder(upload.id)}
                        disabled={isUploading}
                        className={`
                          mt-1 w-full text-xs py-1 px-2 rounded transition-colors disabled:opacity-50
                          ${upload.isMonthBorder 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {upload.isMonthBorder ? '境目解除' : '月境目'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
