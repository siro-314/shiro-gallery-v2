'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileImage, X, Check, MessageSquare } from 'lucide-react'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      prev.map(item => 
        item.id === id ? { ...item, comment } : item
      )
    )
  }

  // 月境目フラグ更新
  const toggleMonthBorder = (id: string) => {
    setPendingUploads(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isMonthBorder: !item.isMonthBorder } : item
      )
    )
  }

  // アップロード実行（仮実装）
  const handleUpload = async () => {
    setIsUploading(true)
    
    try {
      // TODO: 実際のアップロード処理を実装
      // 現在は仮でローカル状態に追加
      const newArtworks: Artwork[] = pendingUploads.map(pending => ({
        id: `artwork_${Date.now()}_${pending.order}`,
        filename: pending.filename,
        comment: pending.comment,
        isMonthBorder: pending.isMonthBorder,
        order: pending.order
      }))
      
      setArtworks([...artworks, ...newArtworks])
      
      // クリーンアップ
      pendingUploads.forEach(item => URL.revokeObjectURL(item.preview))
      setPendingUploads([])
      
    } catch (error) {
      console.error('アップロードエラー:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      {/* ファイル選択エリア - 超シンプル版 */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          cursor-pointer transition-all rounded-2xl border-2 border-dashed p-12
          ${isDragging 
            ? 'border-[#6b5b4d] bg-[#f5f2eb]' 
            : 'border-[#d4c4b0] hover:border-[#6b5b4d] hover:bg-[#f9f7f2]'
          }
        `}
      >
        <div className="text-center">
          <Upload size={64} className="mx-auto mb-6 text-[#8b7355]" />
          <p className="text-xl text-[#6b5b4d] font-medium">
            ファイルをドロップ
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* アップロード待ちリスト - 最小限UI */}
      {pendingUploads.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#8b7355] text-sm">{pendingUploads.length}件</span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  pendingUploads.forEach(item => URL.revokeObjectURL(item.preview))
                  setPendingUploads([])
                }}
                className="text-[#8b7355] hover:text-red-500 text-sm transition-colors"
              >
                クリア
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="
                  px-4 py-2 bg-[#6b5b4d] text-white rounded-full text-sm font-medium
                  hover:bg-[#5a4a3d] transition-colors disabled:opacity-50
                "
              >
                {isUploading ? "..." : "アップロード"}
              </button>
            </div>
          </div>

          {/* プレビューグリッド - サイズ最適化版 */}
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {pendingUploads.map((item, index) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl overflow-hidden border border-[#e6ddd1] relative group"
              >
                {/* プレビュー画像 - アスペクト比最適化 */}
                <div className="aspect-[4/3] bg-[#f5f2eb] relative">
                  {item.file.type.startsWith('image/') ? (
                    <img
                      src={item.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage size={20} className="text-[#8b7355]" />
                    </div>
                  )}
                  
                  {/* 順番番号 */}
                  <div className="absolute top-1 left-1 bg-[#6b5b4d] text-white text-xs px-1.5 py-0.5 rounded-full">
                    {index + 1}
                  </div>
                  
                  {/* 削除ボタン */}
                  <button
                    onClick={() => removePendingUpload(item.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                  
                  {/* 月境目フラグ */}
                  {item.isMonthBorder && (
                    <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      月
                    </div>
                  )}
                </div>
                
                {/* コンパクト情報エリア */}
                <div className="p-2">
                  {/* コメント入力 - サイズ拡大 */}
                  <input
                    type="text"
                    value={item.comment || ''}
                    onChange={(e) => updateComment(item.id, e.target.value)}
                    placeholder="コメント"
                    className="
                      w-full text-xs p-2 border border-[#e6ddd1] rounded-lg 
                      focus:outline-none focus:ring-1 focus:ring-[#6b5b4d] focus:ring-opacity-20
                      bg-white mb-2 h-8
                    "
                  />
                  
                  {/* 月境目チェックボックス - 超コンパクト */}
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isMonthBorder || false}
                      onChange={() => toggleMonthBorder(item.id)}
                      className="w-3 h-3 text-[#6b5b4d] border border-[#d4c4b0] rounded"
                    />
                    <span className="text-xs text-[#8b7355]">月境目</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
