import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TabId } from './Navbar';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NewsFeedTab from './NewsFeedTab';
import MyStackTab from './MyStackTab';

/* Only the news feed is needed to paint the first screen. The generator is
   the biggest component in the app and the history tab is rarely the landing
   view, so both load on demand. */
const GeneratePostTab = lazy(() => import('./GeneratePostTab'));
const HistoryTab = lazy(() => import('./HistoryTab'));
import type { SourceInfo } from '@/hooks/useRSSFeeds';
import { Menu } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { useRSSFeeds } from '@/hooks/useRSSFeeds';
import { countArticlesBySource, type TimeRange } from '@/lib/timeRange';
import { createSource, deleteSource, fetchTechStackNews, fetchTechStack, type TechStackNewsArticle } from '@/services/apiService';

function TabLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-[11px] font-jetbrains uppercase tracking-[0.08em] text-text-tertiary">
        Loading…
      </span>
    </div>
  );
}

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

export default function Layout() {
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const { articles, sources, loading, refreshing, syncing, lastUpdated, lastSyncResult, refresh, forceReload, reloadSources, syncFeeds } = useRSSFeeds();
  const [localSources, setLocalSources] = useState<SourceInfo[]>(sources);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /* Lives here rather than in NewsFeedTab so the sidebar counts describe the
     same window the feed is showing. */
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Tech Stack state
  const [stackNews, setStackNews] = useState<TechStackNewsArticle[]>([]);
  const [stackStatistics, setStackStatistics] = useState({
    totalArticles: 0,
    matchedArticles: 0,
    byTechnology: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
  });
  const [techStackCount, setTechStackCount] = useState(0);
  const [loadingStack, setLoadingStack] = useState(false);
  const [refreshingStack, setRefreshingStack] = useState(false);
  const [stackLastUpdated, setStackLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (sources.length === 0) return;

    setLocalSources((prev) => {
      if (prev.length === 0) return sources;

      const prevMap = new Map(prev.map((s) => [s.name, s.active]));
      return sources.map((s) => ({
        ...s,
        active: prevMap.has(s.name) ? prevMap.get(s.name)! : s.active,
      }));
    });
  }, [sources]);

  const handleToggleSource = useCallback((id: string) => {
    setLocalSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }, []);

  const handleToggleAllSources = useCallback((active: boolean) => {
    setLocalSources((prev) =>
      prev.map((s) => ({ ...s, active }))
    );
  }, []);

  const handleAddSource = useCallback(async (name: string, rssUrl: string, category: string) => {
    await createSource({ name, rssUrl, category });
    await reloadSources();
  }, [reloadSources]);

  const handleDeleteSource = useCallback(async (id: string) => {
    await deleteSource(id);
    await reloadSources();
  }, [reloadSources]);

  const effectiveSources = localSources.length > 0 ? localSources : sources;

  /* Replace the database-wide lifetime count with what is actually visible in
     the current window, and keep the lifetime figure so a source that has
     never produced anything can be told apart from one that is merely quiet. */
  const sourcesForSidebar = useMemo(() => {
    const windowCounts = countArticlesBySource(articles, timeRange);
    return effectiveSources.map((s) => ({
      ...s,
      count: windowCounts.get(s.name) ?? 0,
      lifetimeCount: s.count,
      neverDelivered: s.count === 0,
    }));
  }, [effectiveSources, articles, timeRange]);

  const handleSelectArticle = useCallback((id: string) => {
    setSelectedArticleId(id);
    setActiveTab('generate');
  }, []);

  const loadStackNews = useCallback(async () => {
    setLoadingStack(true);
    try {
      const [newsData, stackData] = await Promise.all([
        fetchTechStackNews(),
        fetchTechStack(),
      ]);
      setStackNews(newsData.news);
      setStackStatistics(newsData.statistics);
      setTechStackCount(stackData.length);
      setStackLastUpdated(new Date());
    } catch (err) {
      console.error('[Layout] Failed to load tech stack news:', err);
    } finally {
      setLoadingStack(false);
    }
  }, []);

  const refreshStackNews = useCallback(async () => {
    setRefreshingStack(true);
    try {
      const [newsData, stackData] = await Promise.all([
        fetchTechStackNews(),
        fetchTechStack(),
      ]);
      setStackNews(newsData.news);
      setStackStatistics(newsData.statistics);
      setTechStackCount(stackData.length);
      setStackLastUpdated(new Date());
    } catch (err) {
      console.error('[Layout] Failed to refresh tech stack news:', err);
    } finally {
      setRefreshingStack(false);
    }
  }, []);

  // Load tech stack news on mount and when switching to my-stack tab
  useEffect(() => {
    if (activeTab === 'my-stack') {
      loadStackNews();
    }
  }, [activeTab, loadStackNews]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'news':
        return (
          <NewsFeedTab
            key="news"
            articles={articles}
            loading={loading}
            refreshing={refreshing}
            syncing={syncing}
            lastUpdated={lastUpdated}
            lastSyncResult={lastSyncResult}
            onRefresh={refresh}
            onForceReload={forceReload}
            onSyncFeeds={syncFeeds}
            activeSources={effectiveSources
              .filter((s) => s.active)
              .map((s) => s.name)}
            onSelectArticle={handleSelectArticle}
            selectedArticleId={selectedArticleId}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        );
      case 'my-stack':
        return (
          <MyStackTab
            key="my-stack"
            articles={stackNews}
            loading={loadingStack}
            refreshing={refreshingStack}
            lastUpdated={stackLastUpdated}
            onRefresh={refreshStackNews}
            onSelectArticle={handleSelectArticle}
            selectedArticleId={selectedArticleId}
            statistics={stackStatistics}
            techStackCount={techStackCount}
          />
        );
      case 'generate':
        return (
          <Suspense key="generate" fallback={<TabLoading />}>
            <GeneratePostTab
              articles={articles}
              selectedArticleId={selectedArticleId}
              onBackToNewsFeed={() => setActiveTab('news')}
            />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense key="history" fallback={<TabLoading />}>
            <HistoryTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-bg-primary relative">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - responsive: hidden on mobile, drawer on tablet, fixed on desktop */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-[260px] h-full shrink-0
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar
          sources={sourcesForSidebar}
          onToggleSource={handleToggleSource}
          onToggleAll={handleToggleAllSources}
          onClose={() => setSidebarOpen(false)}
          onAddSource={handleAddSource}
          onDeleteSource={handleDeleteSource}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Navigation with hamburger */}
        <div className="flex items-center h-14 px-4 lg:px-6 bg-bg-primary border-b border-border-default shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
          <SettingsPanel className="ml-auto" onSourcesChanged={reloadSources} />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.25,
                ease: [0, 0, 0.2, 1] as [number, number, number, number],
              }}
              className="h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
