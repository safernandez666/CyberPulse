import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Clock, RefreshCw, RotateCcw, CloudDownload, ExternalLink, Thermometer, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsArticle } from '@/data/mockNews';
import { timeAgo } from '@/lib/dateUtils';

interface NewsFeedTabProps {
  articles: NewsArticle[];
  loading: boolean;
  refreshing: boolean;
  syncing: boolean;
  lastUpdated: Date | null;
  lastSyncResult: { totalNew: number; errors: string[]; finishedAt: string | null } | null;
  onRefresh: () => void;
  onForceReload: () => void;
  onSyncFeeds: () => void;
  activeSources: string[];
  onSelectArticle: (id: string) => void;
  selectedArticleId: string | null;
}

type SortOption = 'relevance' | 'date' | 'severity' | 'source' | 'trending';

const severityRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const severityColor: Record<string, string> = {
  critical: 'bg-critical',
  high: 'bg-high',
  medium: 'bg-medium',
  low: 'bg-low',
};

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'relevance', label: 'RELEVANCE' },
  { key: 'trending', label: 'TRENDING' },
  { key: 'date', label: 'DATE' },
  { key: 'severity', label: 'SEVERITY' },
  { key: 'source', label: 'SOURCE' },
];

export default function NewsFeedTab({
  articles,
  loading,
  refreshing,
  syncing,
  lastUpdated,
  lastSyncResult,
  onRefresh,
  onForceReload,
  onSyncFeeds,
  activeSources,
  onSelectArticle,
  selectedArticleId,
}: NewsFeedTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category))).sort(),
    [articles]
  );

  const heatScores = useMemo(() => {
    const now = Date.now();
    const categoryCounts = new Map<string, number>();
    articles.forEach((a) => {
      categoryCounts.set(a.category, (categoryCounts.get(a.category) || 0) + 1);
    });

    const scores = new Map<string, number>();
    articles.forEach((a) => {
      const sev = (severityRank[a.severity] || 1) / 4;
      const ms = new Date(a.publishedAt).getTime();
      const hours = Number.isNaN(ms) ? 48 : Math.max(0, (now - ms) / 36e5);
      const recency = Math.max(0, 1 - hours / 72);
      const buzz = Math.min(1, (categoryCounts.get(a.category) || 1) / 10);
      scores.set(a.id, sev * 0.4 + recency * 0.4 + buzz * 0.2);
    });
    return scores;
  }, [articles]);

  const hotIds = useMemo(() => {
    const scores = Array.from(heatScores.values()).sort((a, b) => a - b);
    const cutoff = scores.length
      ? Math.max(0.5, scores[Math.floor(scores.length * 0.75)])
      : 0;
    const ids = new Set<string>();
    heatScores.forEach((score, id) => {
      if (score >= cutoff) ids.add(id);
    });
    return ids;
  }, [heatScores]);

  const filteredAndSorted = useMemo(() => {
    let filtered = articles.filter((a) => activeSources.includes(a.source));

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((a) => selectedCategories.includes(a.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case 'severity':
        sorted.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
        break;
      case 'source':
        sorted.sort((a, b) => a.source.localeCompare(b.source));
        break;
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt).getTime();
          const dateB = new Date(b.publishedAt).getTime();
          // publishedAt may be a relative string (legacy) if the date is unparseable;
          // in that case fall back to lexicographic comparison.
          if (isNaN(dateA) || isNaN(dateB)) {
            return a.publishedAt.localeCompare(b.publishedAt);
          }
          return dateB - dateA;
        });
        break;
      case 'trending':
        sorted.sort((a, b) => (heatScores.get(b.id) || 0) - (heatScores.get(a.id) || 0));
        break;
      case 'relevance':
      default:
        sorted.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
        break;
    }

    return sorted;
  }, [articles, activeSources, selectedCategories, searchQuery, sortBy, heatScores]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedArticles = filteredAndSorted.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeSources, selectedCategories, searchQuery, sortBy, pageSize]);

  // Show toast when a sync finishes
  useEffect(() => {
    if (!lastSyncResult || !lastSyncResult.finishedAt) return;

    const { totalNew, errors } = lastSyncResult;
    if (errors.length > 0) {
      toast.error(`Sync finished with ${errors.length} error(s)`);
    } else if (totalNew > 0) {
      toast.success(`${totalNew} new article${totalNew === 1 ? '' : 's'} found`);
    } else {
      toast.info('No new articles found');
    }
  }, [lastSyncResult]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={32} className="text-accent" />
        </motion.div>
        <p className="text-text-secondary text-sm font-inter font-medium">
          Loading latest cybersecurity news...
        </p>
        <p className="text-text-tertiary text-xs font-jetbrains">
          Fetching from 8 RSS sources
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        {/* Left: Sort + Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key)}
                className={`
                  px-3 py-1.5 text-[13px] font-medium font-inter rounded-md
                  transition-all duration-200 cursor-pointer
                  ${sortBy === option.key
                    ? 'text-accent bg-accent-dim'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium font-inter rounded-md text-accent bg-accent-dim hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh feeds'}
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RefreshCw size={14} />
            </motion.span>
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>

          {/* Force Reload Button */}
          <button
            onClick={onForceReload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium font-inter rounded-md text-text-tertiary hover:text-accent hover:bg-accent-dim transition-all cursor-pointer"
            title="Clear cache and reload all feeds from scratch"
          >
            <RotateCcw size={14} />
            Reload
          </button>

          {/* Sync Button — fetch new articles from RSS sources */}
          <button
            onClick={onSyncFeeds}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium font-inter rounded-md text-accent bg-accent-dim hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            title="Scrape RSS sources and fetch new articles now"
          >
            <motion.span
              animate={syncing ? { rotate: 360 } : { rotate: 0 }}
              transition={syncing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <CloudDownload size={14} />
            </motion.span>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Right: Last updated + Search */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] font-jetbrains text-text-tertiary">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="relative w-full sm:w-60">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 bg-bg-input
                border border-border-default rounded-input
                text-sm text-text-primary font-inter
                placeholder:text-text-tertiary
                focus:outline-none focus:border-accent
                focus:shadow-[0_0_0_2px_rgba(204,255,0,0.15)]
                transition-all duration-200
              `}
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategories([])}
            className={`
              px-2.5 py-1 text-[11px] font-medium font-inter rounded-md
              transition-all duration-200 cursor-pointer
              ${selectedCategories.length === 0
                ? 'text-accent bg-accent-dim'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
              }
            `}
          >
            All
          </button>
          {categories.map((category) => {
            const active = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategories((prev) =>
                    active ? prev.filter((c) => c !== category) : [...prev, category]
                  )
                }
                className={`
                  px-2.5 py-1 text-[11px] font-medium font-inter rounded-md
                  transition-all duration-200 cursor-pointer
                  ${active
                    ? 'text-accent bg-accent-dim'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
                  }
                `}
              >
                {category}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="text-[11px] font-medium font-inter text-text-tertiary hover:text-accent transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Article count */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-jetbrains uppercase tracking-[0.08em] text-text-tertiary">
          {filteredAndSorted.length === 0
            ? '0 articles'
            : `${startIndex + 1}-${Math.min(startIndex + pageSize, filteredAndSorted.length)} of ${filteredAndSorted.length} articles`}
        </span>
        {(syncing || refreshing) && (
          <span className="text-[11px] font-jetbrains text-accent animate-pulse">
            {syncing ? 'Syncing RSS feeds...' : 'Refreshing...'}
          </span>
        )}
      </div>

      {/* News Cards Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {paginatedArticles.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            isSelected={selectedArticleId === article.id}
            isHot={hotIds.has(article.id)}
            onClick={() => onSelectArticle(article.id)}
          />
        ))}
      </motion.div>

      {filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary text-sm font-inter">
            No articles match your search
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredAndSorted.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[11px] font-medium font-jetbrains text-text-secondary min-w-[90px] text-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-jetbrains text-text-tertiary">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-bg-input border border-border-default text-text-primary text-[11px] font-jetbrains rounded-md px-2 py-1 focus:outline-none focus:border-accent"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── News Card ─── */

interface NewsCardProps {
  article: NewsArticle;
  isSelected: boolean;
  isHot: boolean;
  onClick: () => void;
}

function NewsCard({ article, isSelected, isHot, onClick }: NewsCardProps) {
  const dotColor = severityColor[article.severity] || 'bg-medium';

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: 0.35,
        ease: [0, 0, 0.2, 1] as [number, number, number, number],
      }}
      layout
      onClick={onClick}
      className={`
        relative p-4 rounded-card bg-bg-card border cursor-pointer
        transition-all duration-200 ease-out
        ${isSelected
          ? 'border-accent border-l-[3px] shadow-accent-glow'
          : 'border-border-default hover:border-[#2A2A2A] hover:bg-bg-elevated'
        }
      `}
    >
      {/* Row 1: Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
        <span className="flex-1 text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary truncate">
          {article.source}
        </span>
        <span className="text-[11px] font-medium font-jetbrains text-text-tertiary shrink-0">
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Row 2: Title */}
      <h3 className="text-base font-semibold text-text-primary font-inter leading-snug tracking-tight line-clamp-2 mb-1">
        {article.title}
      </h3>

      {/* Row 3: Publish date */}
      <p className="text-[11px] font-medium font-jetbrains text-text-tertiary mb-2">
        {article.publishDate}
      </p>

      {/* Row 4: Summary */}
      <p className="text-sm text-text-secondary font-inter leading-relaxed line-clamp-2 mb-3">
        {article.summary}
      </p>

      {/* Row 5: Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHot && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-500 text-[11px] font-medium font-jetbrains uppercase tracking-wide rounded-pill">
              <Thermometer size={12} />
              Hot
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 bg-accent-dim text-accent text-[11px] font-medium font-jetbrains uppercase tracking-wide rounded-pill">
            {article.category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original article"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-medium font-jetbrains text-accent hover:text-accent/80 transition-colors"
          >
            <ExternalLink size={12} />
            Source
          </a>
          <span className="flex items-center gap-1.5 text-[11px] font-medium font-jetbrains text-text-tertiary">
            <Clock size={12} />
            {article.readTime}
          </span>
        </div>
      </div>
    </motion.article>

  );
}
