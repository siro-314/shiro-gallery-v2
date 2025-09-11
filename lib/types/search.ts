import { MediaType } from './media';

/**
 * 検索・フィルタリング関連の型定義
 * 拡張可能で複雑な条件指定に対応
 */

// ソート順序
export type SortOrder = 'asc' | 'desc';

// ソート対象フィールド
export type SortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'lastAccessedAt' 
  | 'title' 
  | 'fileSize';

// 日付範囲フィルター
export interface DateRange {
  start?: Date;
  end?: Date;
}

// 検索フィルター（複数条件の AND/OR 対応）
export interface SearchFilters {
  // テキスト検索
  query?: string;
  searchFields?: Array<'title' | 'description' | 'memo' | 'tags' | 'content'>;
  
  // メディアタイプフィルター
  types?: MediaType[];
  
  // タグ・カテゴリフィルター
  tags?: string[];
  categories?: string[];
  
  // 日付フィルター  
  dateRange?: DateRange;
  createdRange?: DateRange;
  updatedRange?: DateRange;
  
  // ステータスフィルター
  isArchived?: boolean;
  isFavorite?: boolean;
  isPublic?: boolean;
  
  // ファイルサイズフィルター（バイト単位）
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
}
