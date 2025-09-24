import { NextApiRequest, NextApiResponse } from 'next';
import { GitHubStorageManager } from '../../app/lib/GitHubStorageManager';
import { ArtworkDataManager } from '../../app/lib/ArtworkDataManager';
import { ConfigManager } from '../../app/lib/ConfigManager';
import { UploadRequest } from '../../app/lib/types';

/**
 * バッチアップロード処理API（POST /api/upload-batch）
 * 大量ファイルの安全な処理のため、分割して処理する
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is supported'
    });
  }

  try {
    console.log('🚀 Batch API: Starting batch upload processing');

    const uploadRequest: UploadRequest = req.body;
    
    if (!uploadRequest.files || uploadRequest.files.length === 0) {
      console.error('❌ Batch API: No files provided');
      return res.status(400).json({
        error: 'NO_FILES_PROVIDED'
      });
    }

    console.log(`✅ Batch API: ${uploadRequest.files.length} files received`);

    // 設定初期化（既存コードと同様）
    const configManager = ConfigManager.getInstance();
    const isConfigValid = configManager.validateConfig();
    
    if (!isConfigValid) {
      return res.status(500).json({
        error: 'INVALID_CONFIGURATION'
      });
    }

    const config = configManager.initializeConfig();
    const storageManager = new GitHubStorageManager(config);
    const dataManager = new ArtworkDataManager(storageManager);

    // バッチサイズの設定（1回につき最大3ファイル）
    const BATCH_SIZE = 3;
    const files = uploadRequest.files;
    const totalFiles = files.length;
    const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
    
    console.log(`📊 Batch API: Processing ${totalFiles} files in ${totalBatches} batches (${BATCH_SIZE} files per batch)`);

    const results = [];
    const errors = [];

    // バッチごとに処理
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, totalFiles);
      const currentBatch = files.slice(startIndex, endIndex);
      
      console.log(`🔄 Batch API: Processing batch ${i + 1}/${totalBatches} (files ${startIndex + 1}-${endIndex})`);

      try {
        const savedArtworks = await dataManager.saveArtworks(
          currentBatch,
          uploadRequest.yearMonth,
          uploadRequest.monthBoundary
        );
        
        results.push(...savedArtworks);
        console.log(`✅ Batch API: Batch ${i + 1} completed successfully (${savedArtworks.length} files)`);
        
        // バッチ間の短い待機時間（GitHub API制限対策）
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        }
        
      } catch (batchError) {
        console.error(`❌ Batch API: Batch ${i + 1} failed:`, batchError);
        errors.push({
          batch: i + 1,
          files: currentBatch.map(f => f.name),
          error: batchError instanceof Error ? batchError.message : 'Unknown error'
        });
        
        // 1つのバッチが失敗しても続行
        continue;
      }
    }

    // 結果の集計
    const successCount = results.length;
    const errorCount = errors.length * BATCH_SIZE; // 概算
    
    console.log(`📈 Batch API: Processing completed - Success: ${successCount}, Errors: ${errorCount}`);

    // レスポンス
    if (errors.length === 0) {
      // 全て成功
      return res.status(200).json({
        success: true,
        message: `All ${successCount} files uploaded successfully`,
        artworks: results,
        summary: {
          total: totalFiles,
          successful: successCount,
          failed: 0,
          batches: totalBatches
        }
      });
    } else if (results.length > 0) {
      // 部分的成功
      return res.status(207).json({ // 207 Multi-Status
        success: false,
        message: `Partial success: ${successCount} files uploaded, ${errors.length} batches failed`,
        artworks: results,
        errors: errors,
        summary: {
          total: totalFiles,
          successful: successCount,
          failed: errorCount,
          batches: totalBatches
        }
      });
    } else {
      // 全て失敗
      return res.status(500).json({
        success: false,
        message: 'All batches failed',
        errors: errors,
        summary: {
          total: totalFiles,
          successful: 0,
          failed: totalFiles,
          batches: totalBatches
        }
      });
    }

  } catch (error) {
    console.error('💥 Batch API: Unexpected error:', error);
    
    return res.status(500).json({
      error: 'BATCH_PROCESSING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
