import { Octokit } from '@octokit/rest';
import { StorageConfig, GitHubFileResponse } from './types';
import { ConfigManager } from './ConfigManager';

/**
 * GitHub API管理クラス（疎結合設計）
 * 将来的に他のストレージサービスへの移行が容易になるよう、
 * インターフェースを統一しています。
 */
export class GitHubStorageManager {
  private octokit: Octokit;
  private config: StorageConfig;

  constructor(config?: StorageConfig) {
    // configが提供されない場合は、ConfigManagerから自動取得
    this.config = config || ConfigManager.getStorageConfig();
    
    // GitHub Tokenを取得
    const token = ConfigManager.getGitHubToken();
    
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * 設定を取得
   */
  getConfig(): StorageConfig {
    return this.config;
  }

  /**
   * ファイルをリポジトリにアップロード
   */
  async uploadFile(
    filePath: string, 
    content: string, 
    commitMessage: string,
    encoding: 'base64' | 'utf-8' = 'base64'
  ): Promise<GitHubFileResponse> {
    try {
      // 既存ファイルのSHAを取得（更新の場合に必要）
      let existingFileSha: string | undefined;
      
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
          ref: this.config.branch,
        });
        
        if (!Array.isArray(existingFile.data)) {
          existingFileSha = existingFile.data.sha;
        }
      } catch (error) {
        // ファイルが存在しない場合は新規作成
        // エラーは無視してcontinue
      }

      // GitHub APIの仕様に合わせて、encodingパラメータを削除
      // GitHub APIは常にbase64エンコードされたcontentを期待する
      const requestBody: any = {
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: commitMessage,
        content: content, // すでにbase64エンコードされている前提
        branch: this.config.branch,
      };

      // 既存ファイルの場合はSHAを追加
      if (existingFileSha) {
        requestBody.sha = existingFileSha;
      }

      const response = await this.octokit.rest.repos.createOrUpdateFileContents(requestBody);
      
      return response.data as GitHubFileResponse;
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error(`Failed to upload file: ${filePath}`);
    }
  }

  /**
   * ファイルの存在確認
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ファイルを取得（テキストファイル用）
   */
  async getFileContent(filePath: string): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      });

      if (Array.isArray(response.data)) {
        throw new Error(`Path is a directory: ${filePath}`);
      }

      const file = response.data as any;
      if (file.encoding === 'base64') {
        return Buffer.from(file.content, 'base64').toString('utf-8');
      }
      return file.content;
    } catch (error) {
      console.error('Failed to get file:', error);
      throw new Error(`Failed to get file: ${filePath}`);
    }
  }

  /**
   * ディレクトリ内のファイル一覧を取得
   */
  async listFiles(directoryPath: string): Promise<string[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: directoryPath,
        ref: this.config.branch,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter(item => item.type === 'file')
        .map(item => item.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }
}
