/**
 * ライブラリ全体のエクスポート集約
 * クリーンなAPIを提供
 */

export * from './types';
export * from './storage';
export * from './utils';

// 主要なクラス・関数のre-export
export { StorageFactory as Storage } from './storage/factory';
export { generateId, formatFileSize, formatRelativeDate } from './utils/format';
export { validateMediaItem, validateSearchQuery, validateTag } from './utils/validation';
