import { NextRequest, NextResponse } from 'next/server';
import { ArtworkDataManager } from '../../lib/ArtworkDataManager';
import { GitHubStorageManager } from '../../lib/GitHubStorageManager';
import { ConfigManager } from '../../lib/ConfigManager';

// 本番環境では静的エクスポートのためAPIルートを無効化
export const dynamic = 'force-static';

/**
 * GET /api/artworks - アートワークデータを取得
 * 開発環境でのみ動作し、本番環境では静的ファイルを使用
 */
export async function GET(request: NextRequest) {
  // 本番環境では404を返す
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'API not available in production' },
      { status: 404 }
    );
  }
  try {
    // ストレージマネージャーを初期化（ConfigManagerから自動設定取得）
    const storageManager = new GitHubStorageManager();
    const dataManager = new ArtworkDataManager(storageManager);
    
    // クエリパラメータを解析
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // データを取得
    let artworks;
    
    if (month) {
      // 特定月のデータを取得
      const monthData = await dataManager.getArtworksByMonth(month);
      artworks = monthData.artworks;
    } else {
      // 全データを取得
      artworks = await dataManager.getAllArtworks();
    }
    
    // ページネーション適用
    let paginatedArtworks = artworks;
    let totalCount = artworks.length;
    let hasMore = false;
    
    if (limit && limit > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedArtworks = artworks.slice(startIndex, endIndex);
      hasMore = endIndex < totalCount;
    }
    
    // GitHub Pages用のURL変換
    const config = storageManager.getConfig();
    const processedArtworks = paginatedArtworks.map(artwork => ({
      ...artwork,
      url: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}${artwork.url}`
    }));
    
    // レスポンスを構築
    const response = {
      success: true,
      data: {
        artworks: processedArtworks,
        pagination: {
          total: totalCount,
          page,
          limit: limit || totalCount,
          hasMore
        },
        meta: {
          month: month || 'all',
          availableMonths: month ? undefined : await dataManager.getAvailableMonths()
        }
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5分キャッシュ
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch artworks:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch artworks',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
