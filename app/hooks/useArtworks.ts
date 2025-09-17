import { useState, useEffect, useCallback } from 'react';
import { Artwork } from '../lib/types';

// APIレスポンスの型定義
interface ArtworkApiResponse {
  success: boolean;
  data?: {
    artworks: Artwork[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
    meta: {
      month: string;
      availableMonths?: string[];
    };
  };
  error?: string;
}

interface MonthApiResponse {
  success: boolean;
  data?: {
    availableMonths: Array<{
      yearMonth: string;
      count: number;
      year: number;
      month: number;
    }>;
    totalMonths: number;
    years: number[];
  };
  error?: string;
}

interface UseArtworksOptions {
  month?: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useArtworks(options: UseArtworksOptions = {}) {
  const { month, limit, autoFetch = true } = options;
  
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: limit || 0,
    hasMore: false
  });
  
  const fetchArtworks = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (limit) params.append('limit', limit.toString());
      if (page > 1) params.append('page', page.toString());
      
      const response = await fetch(`/api/artworks?${params.toString()}`);
      const data: ArtworkApiResponse = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch artworks');
      }
      
      if (page === 1) {
        setArtworks(data.data.artworks);
      } else {
        setArtworks(prev => [...prev, ...data.data!.artworks]);
      }
      
      setPagination(data.data.pagination);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [month, limit]);
  
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchArtworks(pagination.page + 1);
    }
  }, [fetchArtworks, pagination.hasMore, pagination.page, loading]);
  
  const refresh = useCallback(() => {
    fetchArtworks(1);
  }, [fetchArtworks]);
  
  useEffect(() => {
    if (autoFetch) {
      fetchArtworks(1);
    }
  }, [fetchArtworks, autoFetch]);
  
  return {
    artworks,
    loading,
    error,
    pagination,
    fetchArtworks,
    loadMore,
    refresh
  };
}

export function useAvailableMonths() {
  const [months, setMonths] = useState<Array<{
    yearMonth: string;
    count: number;
    year: number;
    month: number;
  }>>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMonths = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/months');
      const data: MonthApiResponse = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch months');
      }
      
      setMonths(data.data.availableMonths);
      setYears(data.data.years);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);
  
  return {
    months,
    years,
    loading,
    error,
    refresh: fetchMonths
  };
}
