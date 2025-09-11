/**
 * メディアアイテムの型定義
 * 拡張性とバリデーションを考慮した設計
 */

// メディアタイプの定数定義（型安全性の向上）
export const MEDIA_TYPES = {
  IMAGE: 'image',
  TEXT: 'text', 
  VIDEO: 'video'
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

// ファイルメタデータ
export interface FileMetadata {
  fileSize?: number;
  mimeType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // 動画用（秒）
  encoding?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// 画像固有のメタデータ
export interface ImageMetadata extends FileMetadata {
  colorSpace?: 'sRGB' | 'P3' | 'Rec2020';
  hasAlpha?: boolean;
  orientation?: number; // EXIF orientation
}

// テキスト固有のメタデータ
export interface TextMetadata {
  wordCount?: number;
  characterCount?: number;
  language?: string;
  encoding?: 'utf-8' | 'shift_jis' | 'euc-jp';
}

// 動画固有のメタデータ
export interface VideoMetadata extends FileMetadata {
  framerate?: number;
  codec?: string;
  bitrate?: number;
  hasAudio?: boolean;
}
