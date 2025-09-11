import { 
  MediaType, 
  FileMetadata, 
  ImageMetadata, 
  TextMetadata, 
  VideoMetadata 
} from './media';

/**
 * メインのメディアアイテム型定義
 * 全てのメディアタイプを統合した型
 */
export interface MediaItem {
  // 基本情報
  id: string;
  type: MediaType;
  title: string;
  description?: string;
  
  // コンテンツ関連
  content: string; // ファイルパス、URL、またはテキストコンテンツ
  thumbnail?: string; // サムネイル画像のパス/URL
  
  // 分類・検索用
  tags: string[];
  categories: string[];
  memo: string;
  
  // メタデータ（型によって異なる）
  metadata: FileMetadata | ImageMetadata | TextMetadata | VideoMetadata;
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  
  // 状態管理
  isArchived?: boolean;
  isFavorite?: boolean;
  isPublic?: boolean;
  
  // 権限・共有
  ownerId?: string;
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
}
