import { useState, useEffect, useCallback, useRef } from 'react';
import type { NewsArticle } from '@/data/mockNews';
import { mockNews } from '@/data/mockNews';
import { fetchFeedsFromProxy, loadCachedNews, saveCachedNews, clearCache } from '@/services/rssService';
import { fetchApiNews, fetchApiSources, type SourceInfo } from '@/services/apiService';

export type { SourceInfo } from '@/services/apiService';

function getMockArticles(): NewsArticle[] {
  return mockNews.map((a, i) => ({
    ...a,
    id: `mock-${i}-${Date.now()}`,
  }));
}

interface UseRSSFeedsReturn {
  articles: NewsArticle[];
  sources: SourceInfo[];
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  forceReload: () => Promise<void>;
  reloadSources: () => Promise<void>;
}

const FALLBACK_SOURCES: SourceInfo[] = [
  { id: '1', name: 'The Hacker News', category: 'THREAT INTEL', active: true, custom: false, count: 0 },
  { id: '2', name: 'BleepingComputer', category: 'VULNERABILITY', active: true, custom: false, count: 0 },
  { id: '3', name: 'SecurityWeek', category: 'MALWARE', active: true, custom: false, count: 0 },
  { id: '4', name: 'The Record', category: 'DATA BREACH', active: true, custom: false, count: 0 },
  { id: '5', name: 'Krebs on Security', category: 'PHISHING', active: true, custom: false, count: 0 },
];

export function useRSSFeeds(): UseRSSFeedsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>(FALLBACK_SOURCES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(false);

  const doFetch = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Show mock data IMMEDIATELY so user never sees empty screen
    const fallbackArticles = getMockArticles();
    if (!isRefresh && articles.length === 0) {
      setArticles(fallbackArticles);
      setLoading(false);
    }

    // Try cache
    if (!isRefresh) {
      const cached = loadCachedNews();
      if (cached && cached.length > 0) {
        setArticles(cached);
        setLastUpdated(new Date());
      }
    }

    // Primary: fetch from our backend API
    try {
      const [apiArticles, apiSources] = await Promise.all([
        fetchApiNews(),
        fetchApiSources(),
      ]);

      if (apiArticles.length > 0) {
        setArticles(apiArticles);
        saveCachedNews(apiArticles);
        setLastUpdated(new Date());
      }

      if (apiSources.length > 0) {
        setSources(apiSources);
      }

      if (apiArticles.length > 0) {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
        return;
      }
    } catch (err) {
      console.error('[RSS] Backend API fetch failed:', err);
    }

    // Fallback: fetch from public RSS proxy
    const activeSourceNames = sources.filter((s) => s.active).map((s) => s.name);
    try {
      const proxyArticles = await fetchFeedsFromProxy(activeSourceNames);
      if (proxyArticles.length > 0) {
        const counts: Record<string, number> = {};
        for (const a of proxyArticles) {
          counts[a.source] = (counts[a.source] || 0) + 1;
        }
        setSources((prev) =>
          prev.map((s) => ({
            ...s,
            count: counts[s.name] || s.count,
          }))
        );
        setArticles(proxyArticles);
        saveCachedNews(proxyArticles);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[RSS] Proxy fetch failed:', err);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [articles.length, sources]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    doFetch(false);

    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      doFetch(true);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [doFetch]);

  const refresh = useCallback(async () => {
    await doFetch(true);
  }, [doFetch]);

  const forceReload = useCallback(async () => {
    clearCache();
    await doFetch(true);
  }, [doFetch]);

  const reloadSources = useCallback(async () => {
    try {
      const apiSources = await fetchApiSources();
      if (apiSources.length > 0) {
        setSources(apiSources);
      }
    } catch (err) {
      console.error('[RSS] Reload sources failed:', err);
    }
  }, []);

  return { articles, sources, loading, refreshing, lastUpdated, refresh, forceReload, reloadSources };
}
