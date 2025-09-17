import { StorageConfig } from './types';

/**
 * アプリケーション設定管理（堅牢性重視）
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: StorageConfig | null = null;

  private constructor() {}

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 設定を初期化
   */
  initializeConfig(): StorageConfig {
    if (this.config) {
      return this.config;
    }

    // 環境変数から設定を取得（デフォルト値付き）
    this.config = {
      owner: process.env.GITHUB_OWNER || 'your-github-username',
      repo: process.env.GITHUB_REPO || 'shiro-gallery-data',
      branch: process.env.GITHUB_BRANCH || 'main',
      dataPath: process.env.DATA_PATH || 'public/data',
      imagePath: process.env.IMAGE_PATH || 'public/images',
    };

    return this.config;
  }

  /**
   * GitHub Tokenを取得（セキュリティ重視）
   */
  getGitHubToken(): string {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error(
        'GitHub token not found. Please set GITHUB_TOKEN environment variable.'
      );
    }
    
    if (typeof token !== 'string') {
      throw new Error(
        'GitHub token must be a string. Current type: ' + typeof token
      );
    }

    return token;
  }

  /**
   * 設定の妥当性チェック
   */
  validateConfig(): boolean {
    const config = this.initializeConfig();
    
    const requiredFields = ['owner', 'repo', 'branch', 'dataPath', 'imagePath'];
    for (const field of requiredFields) {
      if (!config[field as keyof StorageConfig]) {
        console.error(`Missing required config field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 開発環境判定
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * ストレージ設定を取得（静的メソッド - API用）
   */
  static getStorageConfig(): StorageConfig {
    const instance = ConfigManager.getInstance();
    return instance.initializeConfig();
  }

  /**
   * GitHub Tokenを取得（静的メソッド - API用）
   */
  static getGitHubToken(): string {
    const instance = ConfigManager.getInstance();
    return instance.getGitHubToken();
  }
}
