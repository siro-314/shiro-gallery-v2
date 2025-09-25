'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileImage, X, Check, MessageSquare, Loader2 } from 'lucide-react'
import { FileData, UploadRequest } from '../../lib/types'

interface Artwork {
  id: string
  filename: string
  comment?: string
  isMonthBorder?: boolean
  order: number
}

interface PendingArtwork extends Artwork {
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

  // 現在の年月を取得
  const getCurrentYearMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  }
  
  // 手動年月入力用のstate
  const [manualYearMonth, setManualYearMonth] = useState('')

  // ファイルをBase64に変換
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // data:image/jpeg;base64, の部分を除去
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
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

  // バッチアップロード実行（大量ファイル対応）
  const handleUpload = async () => {
    if (pendingUploads.length === 0) return

    setIsUploading(true)
    setUploadStatus('ファイルを準備中...')

    try {
      // ファイルデータを準備
      const fileDataArray: FileData[] = []
      
      for (const upload of pendingUploads) {
        setUploadStatus(`${upload.filename} を変換中...`)
        
        const base64Content = await fileToBase64(upload.file)
        
        fileDataArray.push({
          name: upload.filename,
          content: base64Content,
          type: upload.file.type,
          comment: upload.comment || undefined,
        })
      }

      // アップロードリクエストを準備
      const uploadRequest: UploadRequest = {
        files: fileDataArray,
        yearMonth: manualYearMonth || getCurrentYearMonth(),
        monthBoundary: pendingUploads.some(upload => upload.isMonthBorder),
      }

      // ファイル数とサイズに応じてAPIを選択
      // 3ファイル以上、または総サイズが3MB以上の場合はバッチAPI使用
      const totalSize = fileDataArray.reduce((sum, file) => sum + file.content.length, 0)
      const totalSizeMB = totalSize / (1024 * 1024) // MB変換
      
      const shouldUseBatchAPI = fileDataArray.length >= 3 || totalSizeMB > 3
      const apiEndpoint = shouldUseBatchAPI ? '/api/upload-batch' : '/api/upload'
      
      console.log(`📊 Upload decision: ${fileDataArray.length} files, ${totalSizeMB.toFixed(2)}MB total`)
      console.log(`🔀 Using API: ${apiEndpoint}`)
      
      setUploadStatus(`${fileDataArray.length}ファイルを${shouldUseBatchAPI ? 'バッチ' : '一括'}アップロード中...`)

      // API呼び出し
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadRequest),
      })

      if (!response.ok) {
        if (response.status === 413) {
          // Content Too Large エラーの特別処理
          throw new Error('ファイルサイズが大きすぎます。ファイル数を減らすか、小さなファイルに分割してください。')
        }
        
        let errorMessage = 'アップロードに失敗しました'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // JSON解析失敗時はレスポンステキストを使用
          errorMessage = await response.text() || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // バッチ処理の結果に応じてメッセージを変更
      if (result.success) {
        // 全て成功
        setUploadStatus(`✅ ${result.artworks.length}件のファイルをアップロードしました！`)
      } else if (result.artworks && result.artworks.length > 0) {
        // 部分的成功（207 Multi-Status）
        setUploadStatus(`⚠️ ${result.artworks.length}件成功、${result.summary?.failed || 0}件失敗`)
        
        // エラー詳細をコンソールに出力
        if (result.errors) {
          console.warn('Batch upload errors:', result.errors)
        }
      } else {
        throw new Error('すべてのファイルのアップロードに失敗しました')
      }

      // 成功時の処理
      // プレビューURLをクリーンアップ
      pendingUploads.forEach(upload => {
        URL.revokeObjectURL(upload.preview)
      })

      // 手動年月入力をリセット
      setManualYearMonth('')

      // 追加されたアートワーク（成功分のみ）を既存リストに反映
      if (result.artworks && result.artworks.length > 0) {
        const newArtworks = result.artworks.map((artwork: any, index: number) => ({
          id: artwork.id,
          filename: artwork.filename,
          comment: artwork.comment,
          order: artworks.length + index,
          isMonthBorder: artwork.isMonthBoundary || false,
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
      
      // 5秒後にエラーメッセージをクリア
      setTimeout(() => {
        setUploadStatus('')
        setUploadProgress(null)
      }, 5000)
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
