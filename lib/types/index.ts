/**
 * 型定義のエクスポート集約ファイル
 * 他のモジュールからの import を簡潔にする
 */

// メディア関連
export * from './media';
export * from './item';
export * from './search';

// デフォルト値の定義
export const DEFAULT_PERMISSIONS = {
  canView: true,
  canEdit: true,
  canDelete: true,
  canShare: false,
} as const;

// バリデーション用の定数
export const VALIDATION_RULES = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_MEMO_LENGTH: 2000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_COUNT: 20,
  MAX_CATEGORIES_COUNT: 10,
  MIN_SEARCH_QUERY_LENGTH: 1,
  MAX_SEARCH_QUERY_LENGTH: 200,
} as const;
