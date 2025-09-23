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
    console.log('🚀 Upload API: Starting request processing');

    // リクエストの解析
    let uploadRequest: UploadRequest;
    try {
      uploadRequest = await request.json();
      console.log('✅ Upload API: Request JSON parsed successfully');
    } catch (jsonError) {
      console.error('❌ Upload API: JSON parsing failed:', jsonError);
      return NextResponse.json(
        { error: 'STEP_1_JSON_PARSE_ERROR', details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error' },
        { status: 400 }
      );
    }
    
    if (!uploadRequest.files || uploadRequest.files.length === 0) {
      console.error('❌ Upload API: No files provided');
      return NextResponse.json(
        { error: 'STEP_2_NO_FILES_PROVIDED' },
        { status: 400 }
      );
    }

    console.log(`✅ Upload API: ${uploadRequest.files.length} files received`);

    // 設定管理の初期化
    let configManager;
    try {
      configManager = ConfigManager.getInstance();
      console.log('✅ Upload API: ConfigManager instance created');
    } catch (configError) {
      console.error('❌ Upload API: ConfigManager creation failed:', configError);
      return NextResponse.json(
        { error: 'STEP_3_CONFIG_MANAGER_ERROR', details: configError instanceof Error ? configError.message : 'Unknown config error' },
        { status: 500 }
      );
    }
    
    // 設定の検証
    let isConfigValid;
    try {
      isConfigValid = configManager.validateConfig();
      console.log('✅ Upload API: Config validation completed:', isConfigValid);
    } catch (validateError) {
      console.error('❌ Upload API: Config validation failed:', validateError);
      return NextResponse.json(
        { error: 'STEP_4_CONFIG_VALIDATION_ERROR', details: validateError instanceof Error ? validateError.message : 'Unknown validation error' },
        { status: 500 }
      );
    }
    
    if (!isConfigValid) {
      console.error('❌ Upload API: Configuration is invalid');
      return NextResponse.json(
        { error: 'STEP_4_INVALID_CONFIGURATION' },
        { status: 500 }
      );
    }

    // GitHub Token検証
    let githubToken;
    try {
      githubToken = configManager.getGitHubToken();
      console.log('✅ Upload API: GitHub Token obtained successfully');
    } catch (tokenError) {
      console.error('❌ Upload API: GitHub Token error:', tokenError);
      return NextResponse.json(
        { error: 'STEP_5_GITHUB_TOKEN_ERROR', details: tokenError instanceof Error ? tokenError.message : 'Unknown token error' },
        { status: 500 }
      );
    }

    let config;
    try {
      config = configManager.initializeConfig();
      console.log('✅ Upload API: Config initialized:', config);
    } catch (initError) {
      console.error('❌ Upload API: Config initialization failed:', initError);
      return NextResponse.json(
        { error: 'STEP_6_CONFIG_INIT_ERROR', details: initError instanceof Error ? initError.message : 'Unknown init error' },
        { status: 500 }
      );
    }

    // ストレージマネージャーとデータマネージャーを初期化
    let storageManager;
    try {
      storageManager = new GitHubStorageManager(config);
      console.log('✅ Upload API: GitHubStorageManager created');
    } catch (storageError) {
      console.error('❌ Upload API: GitHubStorageManager creation failed:', storageError);
      return NextResponse.json(
        { error: 'STEP_7_STORAGE_MANAGER_ERROR', details: storageError instanceof Error ? storageError.message : 'Unknown storage error' },
        { status: 500 }
      );
    }

    let dataManager;
    try {
      dataManager = new ArtworkDataManager(storageManager);
      console.log('✅ Upload API: ArtworkDataManager created');
    } catch (dataManagerError) {
      console.error('❌ Upload API: ArtworkDataManager creation failed:', dataManagerError);
      return NextResponse.json(
        { error: 'STEP_8_DATA_MANAGER_ERROR', details: dataManagerError instanceof Error ? dataManagerError.message : 'Unknown data manager error' },
        { status: 500 }
      );
    }

    // ファイルをアップロード・保存
    console.log('🚀 Upload API: Starting file save process');
    let savedArtworks;
    try {
      savedArtworks = await dataManager.saveArtworks(
        uploadRequest.files,
        uploadRequest.yearMonth,
        uploadRequest.monthBoundary
      );
      console.log('✅ Upload API: Files saved successfully:', savedArtworks.length);
    } catch (saveError) {
      console.error('❌ Upload API: File save failed:', saveError);
      return NextResponse.json(
        { error: 'STEP_9_FILE_SAVE_ERROR', details: saveError instanceof Error ? saveError.message : 'Unknown save error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${savedArtworks.length} files uploaded successfully`,
      artworks: savedArtworks,
    });

  } catch (error) {
    console.error('💥 Upload API: Unexpected error caught in main catch block:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'STEP_UNKNOWN_UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
