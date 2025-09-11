import { MediaItem, SearchFilters, SortField, SortOrder } from '../types';

/**
 * ストレージアダプタの抽象基底クラス
 * 疎結合設計：具体的な実装に依存しない抽象インターフェース
 */
export abstract class StorageAdapter {
  protected abstract initialize(): Promise<void>;
  
  // CRUD操作
  abstract save(item: MediaItem): Promise<MediaItem>;
  abstract findById(id: string): Promise<MediaItem | null>;
  abstract findAll(): Promise<MediaItem[]>;
  abstract update(id: string, updates: Partial<MediaItem>): Promise<MediaItem>;
  abstract delete(id: string): Promise<void>;
  
  // 検索・フィルタリング
  abstract search(
    filters: SearchFilters, 
    sortField?: SortField, 
    sortOrder?: SortOrder,
    limit?: number,
    offset?: number
  ): Promise<{
    items: MediaItem[];
    total: number;
    hasMore: boolean;
  }>;
  
  // バッチ操作（パフォーマンス向上）
  abstract saveBatch(items: MediaItem[]): Promise<MediaItem[]>;
  abstract deleteBatch(ids: string[]): Promise<void>;
  
  // 統計情報
  abstract getStats(): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    storageUsed: number; // バイト単位
    lastUpdated: Date;
  }>;
  
  // タグ・カテゴリ管理
  abstract getAllTags(): Promise<string[]>;
  abstract getAllCategories(): Promise<string[]>;
  abstract getTagUsageCount(): Promise<Record<string, number>>;
  
  // データ整合性チェック
  abstract validateData(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}
