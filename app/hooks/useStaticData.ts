import { useState, useEffect, useCallback } from 'react';
import { Artwork } from '../lib/types';

// 本番環境用の静的データ読み込みフック
export function useStaticData() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [months, setMonths] = useState<Array<{
    yearMonth: string;
    count: number;
    year: number;
    month: number;
  }>>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 並列でデータを取得
      const [artworksResponse, monthsResponse] = await Promise.all([
        fetch('/data/artworks.json').then(res => {
          if (!res.ok) throw new Error('Failed to load artworks');
          return res.json();
        }),
        fetch('/data/months.json').then(res => {
          if (!res.ok) throw new Error('Failed to load months');
          return res.json();
        })
      ]);

      setArtworks(artworksResponse);
      setMonths(monthsResponse.availableMonths || []);
      setYears(monthsResponse.years || []);

    } catch (err) {
      console.error('Failed to load static data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // エラー時は空のデータを設定
      setArtworks([]);
      setMonths([]);
      setYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 月フィルター機能
  const getArtworksByMonth = useCallback((targetMonth?: string) => {
    if (!targetMonth) return artworks;
    return artworks.filter(artwork => artwork.yearMonth === targetMonth);
  }, [artworks]);

  return {
    artworks,
    months,
    years,
    loading,
    error,
    refresh: loadData,
    getArtworksByMonth
  };
}
