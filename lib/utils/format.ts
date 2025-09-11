/**
 * ID生成用のユーティリティ関数
 * クリーンで拡張可能な設計
 */

/**
 * 一意のIDを生成
 * 形式: YYYY-MMDD-HHMMSS-RANDOM
 */
export function generateId(prefix?: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const randomPart = Math.random().toString(36).substr(2, 8);
  
  return prefix 
    ? `${prefix}-${datePart}-${randomPart}`
    : `${datePart}-${randomPart}`;
}

/**
 * ファイル名から拡張子を取得
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 日付を相対的な形式でフォーマット（"3日前"など）
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'たった今' : `${diffMinutes}分前`;
    }
    return `${diffHours}時間前`;
  } else if (diffDays === 1) {
    return '昨日';
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}週間前`;
  } else {
    return date.toLocaleDateString('ja-JP');
  }
}
