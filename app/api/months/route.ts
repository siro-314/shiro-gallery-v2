import { NextResponse } from 'next/server';
import { ArtworkDataManager } from '../../lib/ArtworkDataManager';
import { GitHubStorageManager } from '../../lib/GitHubStorageManager';
import { ConfigManager } from '../../lib/ConfigManager';

// Next.js Runtime環境ではAPI機能を有効化
export const dynamic = 'force-dynamic';

/**
 * GET /api/months - 利用可能な年月一覧を取得
 * 開発環境でのみ動作し、本番環境では静的ファイルを使用
 */
export async function GET() {
  try {
    // ストレージマネージャーを初期化（ConfigManagerから自動設定取得）
    const storageManager = new GitHubStorageManager();
    const dataManager = new ArtworkDataManager(storageManager);
    
    // 利用可能な月一覧を取得
    const availableMonths = await dataManager.getAvailableMonths();
    
    // 年月の統計情報も取得
    const monthStats = await Promise.all(
      availableMonths.map(async (month) => {
        const monthData = await dataManager.getArtworksByMonth(month);
        return {
          yearMonth: month,
          count: monthData.totalCount,
          year: parseInt(month.split('-')[0], 10),
          month: parseInt(month.split('-')[1], 10)
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        availableMonths: monthStats,
        totalMonths: availableMonths.length,
        years: [...new Set(monthStats.map(stat => stat.year))].sort((a, b) => b - a)
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200' // 10分キャッシュ
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch months:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch available months',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
