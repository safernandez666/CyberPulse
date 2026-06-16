import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TabId } from './Navbar';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NewsFeedTab from './NewsFeedTab';
import GeneratePostTab from './GeneratePostTab';
import HistoryTab from './HistoryTab';
import type { SourceInfo } from '@/hooks/useRSSFeeds';
import { Menu } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { useRSSFeeds } from '@/hooks/useRSSFeeds';

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

export default function Layout() {
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const { articles, sources, loading, refreshing, lastUpdated, refresh, forceReload, reloadSources } = useRSSFeeds();
  const [localSources, setLocalSources] = useState<SourceInfo[]>(sources);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSelectArticle = useCallback((id: string) => {
    setSelectedArticleId(id);
    setActiveTab('generate');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'news':
        return (
          <NewsFeedTab
            key="news"
            articles={articles}
            loading={loading}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onRefresh={refresh}
            onForceReload={forceReload}
            activeSources={(localSources.length > 0 ? localSources : sources)
              .filter((s) => s.active)
              .map((s) => s.name)}
            onSelectArticle={handleSelectArticle}
            selectedArticleId={selectedArticleId}
          />
        );
      case 'generate':
        return (
          <GeneratePostTab
            key="generate"
            articles={articles}
            selectedArticleId={selectedArticleId}
            onBackToNewsFeed={() => setActiveTab('news')}
          />
        );
      case 'history':
        return <HistoryTab key="history" />;
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
          sources={localSources.length > 0 ? localSources : sources}
          onToggleSource={handleToggleSource}
          onToggleAll={handleToggleAllSources}
          onClose={() => setSidebarOpen(false)}
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
