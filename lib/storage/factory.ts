import { StorageAdapter } from './base';
import { LocalStorageAdapter } from './local-storage';

/**
 * ストレージアダプター選択のファクトリーパターン
 * 疎結合設計：実行時に適切なストレージを選択
 */

export type StorageType = 'localStorage' | 'indexedDB' | 'remoteAPI';

export class StorageFactory {
  private static instance: StorageAdapter | null = null;
  
  /**
   * シングルトンパターンでストレージインスタンスを取得
   */
  static async getInstance(type: StorageType = 'localStorage'): Promise<StorageAdapter> {
    if (!StorageFactory.instance) {
      StorageFactory.instance = await StorageFactory.createAdapter(type);
    }
    return StorageFactory.instance;
  }
  
  /**
   * ストレージタイプを変更（テスト用）
   */
  static async switchStorageType(type: StorageType): Promise<StorageAdapter> {
    StorageFactory.instance = await StorageFactory.createAdapter(type);
    return StorageFactory.instance;
  }
  
  /**
   * ストレージアダプターを作成
   */
  private static async createAdapter(type: StorageType): Promise<StorageAdapter> {
    let adapter: StorageAdapter;
    
    switch (type) {
      case 'localStorage':
        adapter = new LocalStorageAdapter();
        break;
        
      case 'indexedDB':
        // TODO: IndexedDBAdapter の実装
        throw new Error('IndexedDB adapter not implemented yet');
        
      case 'remoteAPI':
        // TODO: RemoteAPIAdapter の実装
        throw new Error('Remote API adapter not implemented yet');
        
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
    
    // 初期化実行
    await (adapter as any).initialize();
    
    return adapter;
  }
  
  /**
   * ストレージ可用性チェック
   */
  static async checkAvailability(type: StorageType): Promise<boolean> {
    try {
      switch (type) {
        case 'localStorage':
          if (typeof window === 'undefined' || !window.localStorage) {
            return false;
          }
          // 書き込みテスト
          const testKey = '__storage_test__';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          return true;
          
        case 'indexedDB':
          return typeof window !== 'undefined' && 'indexedDB' in window;
          
        case 'remoteAPI':
          // TODO: API疎通チェック
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Storage availability check failed for ${type}:`, error);
      return false;
    }
  }
}
