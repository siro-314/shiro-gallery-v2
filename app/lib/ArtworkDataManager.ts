import { Artwork, MonthData, FileData } from './types';
import { GitHubStorageManager } from './GitHubStorageManager';

/**
 * アートワークデータ管理クラス（拡張性重視設計）
 * ストレージ層との疎結合を実現し、将来的な拡張に対応
 */
export class ArtworkDataManager {
  private storageManager: GitHubStorageManager;
  private dataFileName = 'artworks.json';

  constructor(storageManager: GitHubStorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * 全アートワークデータを取得
   */
  async getAllArtworks(): Promise<Artwork[]> {
    try {
      const config = this.storageManager.getConfig();
      const dataPath = `${config.dataPath}/${this.dataFileName}`;
      
      const exists = await this.storageManager.fileExists(dataPath);
      if (!exists) {
        return [];
      }

      const content = await this.storageManager.getFileContent(dataPath);
      return JSON.parse(content) as Artwork[];
    } catch (error) {
      console.error('Failed to get artworks:', error);
      return [];
    }
  }

  /**
   * 月別データを取得
   */
  async getArtworksByMonth(yearMonth: string): Promise<MonthData> {
    const allArtworks = await this.getAllArtworks();
    const monthArtworks = allArtworks.filter(
      artwork => artwork.yearMonth === yearMonth
    );

    return {
      yearMonth,
      artworks: monthArtworks,
      totalCount: monthArtworks.length,
    };
  }

  /**
   * アートワークを追加保存
   */
  async saveArtworks(newFiles: FileData[], yearMonth: string): Promise<Artwork[]> {
    const config = this.storageManager.getConfig();
    const savedArtworks: Artwork[] = [];

    // 既存データを取得
    const existingArtworks = await this.getAllArtworks();

    for (const fileData of newFiles) {
      try {
        // ファイル名の生成（重複回避）
        const fileId = this.generateFileId();
        const fileExtension = this.extractFileExtension(fileData.name);
        const fileName = `${fileId}.${fileExtension}`;
        
        // 画像ファイルをアップロード
        const imagePath = `${config.imagePath}/${yearMonth}/${fileName}`;
        await this.storageManager.uploadFile(
          imagePath,
          fileData.content,
          `Add artwork: ${fileData.name} (${yearMonth})`,
          'base64'
        );

        // アートワークオブジェクトを作成
        const artwork: Artwork = {
          id: fileId,
          filename: fileName,
          originalName: fileData.name,
          type: fileData.type.startsWith('image/') ? 'image' : 'video',
          url: `/${config.imagePath}/${yearMonth}/${fileName}`,
          comment: fileData.comment,
          uploadedAt: new Date().toISOString(),
          yearMonth,
          isMonthBoundary: false, // 後で設定
        };

        savedArtworks.push(artwork);
      } catch (error) {
        console.error(`Failed to save file: ${fileData.name}`, error);
        throw error;
      }
    }

    // アートワークリストを更新
    const updatedArtworks = [...existingArtworks, ...savedArtworks]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    // データファイルを保存
    await this.saveArtworkData(updatedArtworks);

    return savedArtworks;
  }

  /**
   * アートワークデータをJSONファイルに保存
   */
  private async saveArtworkData(artworks: Artwork[]): Promise<void> {
    const config = this.storageManager.getConfig();
    const dataPath = `${config.dataPath}/${this.dataFileName}`;
    const content = JSON.stringify(artworks, null, 2);

    await this.storageManager.uploadFile(
      dataPath,
      Buffer.from(content, 'utf-8').toString('base64'),
      'Update artworks data',
      'base64'
    );
  }

  /**
   * ユニークなファイルIDを生成
   */
  private generateFileId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  /**
   * ファイル拡張子を抽出
   */
  private extractFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * 月境目フラグを更新
   */
  async updateMonthBoundary(artworkId: string, isMonthBoundary: boolean): Promise<void> {
    const allArtworks = await this.getAllArtworks();
    const updatedArtworks = allArtworks.map(artwork =>
      artwork.id === artworkId 
        ? { ...artwork, isMonthBoundary }
        : artwork
    );

    await this.saveArtworkData(updatedArtworks);
  }

  /**
   * 利用可能な年月一覧を取得
   */
  async getAvailableMonths(): Promise<string[]> {
    const allArtworks = await this.getAllArtworks();
    const months = [...new Set(allArtworks.map(artwork => artwork.yearMonth))];
    return months.sort().reverse(); // 新しい順
  }

  /**
   * 堅牢性: データ整合性チェック
   */
  async validateDataIntegrity(): Promise<boolean> {
    try {
      const artworks = await this.getAllArtworks();
      
      // 基本的なバリデーション
      for (const artwork of artworks) {
        if (!artwork.id || !artwork.filename || !artwork.yearMonth) {
          console.error('Invalid artwork data:', artwork);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return false;
    }
  }
}
