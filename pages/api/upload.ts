import { NextApiRequest, NextApiResponse } from 'next';
import { GitHubStorageManager } from '../../app/lib/GitHubStorageManager';
import { ArtworkDataManager } from '../../app/lib/ArtworkDataManager';
import { ConfigManager } from '../../app/lib/ConfigManager';
import { UploadRequest } from '../../app/lib/types';

/**
 * Pages Router版 ファイルアップロードAPI（POST /api/upload）
 * Netlify Next.js Runtime互換性のための代替実装
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is supported'
    });
  }

  try {
    console.log('🚀 Pages API: Starting request processing');

    // リクエストの解析
    const uploadRequest: UploadRequest = req.body;
    
    if (!uploadRequest.files || uploadRequest.files.length === 0) {
      console.error('❌ Pages API: No files provided');
      return res.status(400).json({
        error: 'STEP_2_NO_FILES_PROVIDED'
      });
    }

    console.log(`✅ Pages API: ${uploadRequest.files.length} files received`);

    // 設定管理の初期化
    let configManager;
    try {
      configManager = ConfigManager.getInstance();
      console.log('✅ Pages API: ConfigManager instance created');
    } catch (configError) {
      console.error('❌ Pages API: ConfigManager creation failed:', configError);
      return res.status(500).json({
        error: 'STEP_3_CONFIG_MANAGER_ERROR',
        details: configError instanceof Error ? configError.message : 'Unknown config error'
      });
    }
    
    // 設定の検証
    let isConfigValid;
    try {
      isConfigValid = configManager.validateConfig();
      console.log('✅ Pages API: Config validation completed:', isConfigValid);
    } catch (validateError) {
      console.error('❌ Pages API: Config validation failed:', validateError);
      return res.status(500).json({
        error: 'STEP_4_CONFIG_VALIDATION_ERROR',
        details: validateError instanceof Error ? validateError.message : 'Unknown validation error'
      });
    }
    
    if (!isConfigValid) {
      console.error('❌ Pages API: Configuration is invalid');
      return res.status(500).json({
        error: 'STEP_4_INVALID_CONFIGURATION'
      });
    }

    // GitHub Token検証
    let githubToken;
    try {
      githubToken = configManager.getGitHubToken();
      console.log('✅ Pages API: GitHub Token obtained successfully');
    } catch (tokenError) {
      console.error('❌ Pages API: GitHub Token error:', tokenError);
      return res.status(500).json({
        error: 'STEP_5_GITHUB_TOKEN_ERROR',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown token error'
      });
    }

    let config;
    try {
      config = configManager.initializeConfig();
      console.log('✅ Pages API: Config initialized:', config);
    } catch (initError) {
      console.error('❌ Pages API: Config initialization failed:', initError);
      return res.status(500).json({
        error: 'STEP_6_CONFIG_INIT_ERROR',
        details: initError instanceof Error ? initError.message : 'Unknown init error'
      });
    }

    // ストレージマネージャーとデータマネージャーを初期化
    let storageManager;
    try {
      storageManager = new GitHubStorageManager(config);
      console.log('✅ Pages API: GitHubStorageManager created');
    } catch (storageError) {
      console.error('❌ Pages API: GitHubStorageManager creation failed:', storageError);
      return res.status(500).json({
        error: 'STEP_7_STORAGE_MANAGER_ERROR',
        details: storageError instanceof Error ? storageError.message : 'Unknown storage error'
      });
    }

    let dataManager;
    try {
      dataManager = new ArtworkDataManager(storageManager);
      console.log('✅ Pages API: ArtworkDataManager created');
    } catch (dataManagerError) {
      console.error('❌ Pages API: ArtworkDataManager creation failed:', dataManagerError);
      return res.status(500).json({
        error: 'STEP_8_DATA_MANAGER_ERROR',
        details: dataManagerError instanceof Error ? dataManagerError.message : 'Unknown data manager error'
      });
    }

    // ファイルをアップロード・保存
    console.log('🚀 Pages API: Starting file save process');
    let savedArtworks;
    try {
      savedArtworks = await dataManager.saveArtworks(
        uploadRequest.files,
        uploadRequest.yearMonth,
        uploadRequest.monthBoundary
      );
      console.log('✅ Pages API: Files saved successfully:', savedArtworks.length);
    } catch (saveError) {
      console.error('❌ Pages API: File save failed:', saveError);
      return res.status(500).json({
        error: 'STEP_9_FILE_SAVE_ERROR',
        details: saveError instanceof Error ? saveError.message : 'Unknown save error'
      });
    }

    return res.status(200).json({
      success: true,
      message: `${savedArtworks.length} files uploaded successfully`,
      artworks: savedArtworks,
    });

  } catch (error) {
    console.error('💥 Pages API: Unexpected error caught in main catch block:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return res.status(500).json({
      error: 'STEP_UNKNOWN_UNEXPECTED_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}