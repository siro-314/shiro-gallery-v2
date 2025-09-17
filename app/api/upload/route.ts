import { NextRequest, NextResponse } from 'next/server';
import { GitHubStorageManager } from '../../lib/GitHubStorageManager';
import { ArtworkDataManager } from '../../lib/ArtworkDataManager';
import { ConfigManager } from '../../lib/ConfigManager';
import { UploadRequest } from '../../lib/types';

// 本番環境では静的エクスポートのためAPIルートを無効化
export const dynamic = 'force-static';

/**
 * ファイルアップロードAPI（POST /api/upload）
 * 疎結合設計により、将来的な拡張に対応
 */
export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Upload API not available in production' },
      { status: 403 }
    );
  }
  
  try {
    // リクエストの解析
    const uploadRequest: UploadRequest = await request.json();
    
    if (!uploadRequest.files || uploadRequest.files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // 設定管理の初期化
    const configManager = ConfigManager.getInstance();
    
    if (!configManager.validateConfig()) {
      return NextResponse.json(
        { error: 'Invalid configuration' },
        { status: 500 }
      );
    }

    const config = configManager.initializeConfig();

    // ストレージマネージャーとデータマネージャーを初期化
    const storageManager = new GitHubStorageManager(config);
    const dataManager = new ArtworkDataManager(storageManager);

    // ファイルをアップロード・保存
    const savedArtworks = await dataManager.saveArtworks(
      uploadRequest.files,
      uploadRequest.yearMonth
    );

    // 月境目フラグの設定
    if (uploadRequest.monthBoundary && savedArtworks.length > 0) {
      await dataManager.updateMonthBoundary(savedArtworks[0].id, true);
    }

    return NextResponse.json({
      success: true,
      message: `${savedArtworks.length} files uploaded successfully`,
      artworks: savedArtworks,
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
