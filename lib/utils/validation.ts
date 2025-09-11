import { MediaItem, MEDIA_TYPES, VALIDATION_RULES } from '../types';

/**
 * バリデーション関数群
 * 堅牢性を確保するための入力検証
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * MediaItem全体のバリデーション
 */
export function validateMediaItem(item: Partial<MediaItem>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 必須フィールドの検証
  if (!item.id?.trim()) {
    errors.push('IDは必須です');
  }
  
  if (!item.title?.trim()) {
    errors.push('タイトルは必須です');
  } else if (item.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push(`タイトルは${VALIDATION_RULES.MAX_TITLE_LENGTH}文字以内で入力してください`);
  }
  
  if (!item.type || !Object.values(MEDIA_TYPES).includes(item.type as any)) {
    errors.push('有効なメディアタイプを指定してください');
  }
  
  if (!item.content?.trim()) {
    errors.push('コンテンツは必須です');
  }
  
  // オプションフィールドの検証
  if (item.description && item.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(`説明文は${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH}文字以内で入力してください`);
  }
  
  if (item.memo && item.memo.length > VALIDATION_RULES.MAX_MEMO_LENGTH) {
    errors.push(`メモは${VALIDATION_RULES.MAX_MEMO_LENGTH}文字以内で入力してください`);
  }
  
  // タグの検証
  if (item.tags) {
    if (item.tags.length > VALIDATION_RULES.MAX_TAGS_COUNT) {
      errors.push(`タグは${VALIDATION_RULES.MAX_TAGS_COUNT}個まで設定できます`);
    }
    
    const invalidTags = item.tags.filter(tag => 
      !tag.trim() || tag.length > VALIDATION_RULES.MAX_TAG_LENGTH
    );
    
    if (invalidTags.length > 0) {
      errors.push(`無効なタグが含まれています（空文字または${VALIDATION_RULES.MAX_TAG_LENGTH}文字超過）`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
/**
 * 検索クエリのバリデーション
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (query.length < VALIDATION_RULES.MIN_SEARCH_QUERY_LENGTH) {
    errors.push(`検索クエリは${VALIDATION_RULES.MIN_SEARCH_QUERY_LENGTH}文字以上で入力してください`);
  }
  
  if (query.length > VALIDATION_RULES.MAX_SEARCH_QUERY_LENGTH) {
    errors.push(`検索クエリは${VALIDATION_RULES.MAX_SEARCH_QUERY_LENGTH}文字以内で入力してください`);
  }
  
  // 危険な文字の検出（SQLインジェクション対策）
  const dangerousChars = /[<>'"&;\\]/;
  if (dangerousChars.test(query)) {
    warnings.push('特殊文字が含まれています。検索結果に影響する場合があります。');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * タグ名のバリデーション
 */
export function validateTag(tag: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!tag.trim()) {
    errors.push('タグ名を入力してください');
  }
  
  if (tag.length > VALIDATION_RULES.MAX_TAG_LENGTH) {
    errors.push(`タグ名は${VALIDATION_RULES.MAX_TAG_LENGTH}文字以内で入力してください`);
  }
  
  // 特殊文字チェック（英数字、日本語、ハイフン、アンダースコアのみ許可）
  const allowedChars = /^[a-zA-Z0-9ひらがなカタカナ漢字\-_\s]+$/u;
  if (!allowedChars.test(tag)) {
    errors.push('タグ名には英数字、日本語、ハイフン、アンダースコアのみ使用できます');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ファイルサイズの検証（10MBまで）
 */
export function validateFileSize(size: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  const warningSize = 5 * 1024 * 1024; // 5MB
  
  if (size > maxSize) {
    errors.push(`ファイルサイズが大きすぎます（上限: ${formatFileSize(maxSize)}）`);
  } else if (size > warningSize) {
    warnings.push(`ファイルサイズが大きいです（${formatFileSize(size)}）。アップロードに時間がかかる場合があります。`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// format.tsからの関数をインポート（循環依存を避けるため、ここで再定義）
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
