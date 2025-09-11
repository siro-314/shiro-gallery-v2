/**
 * ストレージ層のエクスポート集約
 */

export * from './base';
export * from './local-storage';
export * from './factory';

// デフォルトストレージの取得
export { StorageFactory as Storage } from './factory';
