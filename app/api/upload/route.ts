import { NextRequest, NextResponse } from 'next/server';
import { GitHubStorageManager } from '../../lib/GitHubStorageManager';
import { ArtworkDataManager } from '../../lib/ArtworkDataManager';
import { ConfigManager } from '../../lib/ConfigManager';
import { UploadRequest } from '../../lib/types';

// Next.js Runtime環境ではAPI機能を有効化
export const dynamic = 'force-dynamic';

/**
 * ファイルアップロードAPI（POST /api/upload）
 * 疎結合設計により、将来的な拡張に対応
 */
export async function POST(request: NextRequest) {
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
      uploadRequest.yearMonth,
      uploadRequest.monthBoundary
    );

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
