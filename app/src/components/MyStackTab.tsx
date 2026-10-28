import { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, RefreshCw, ExternalLink, Thermometer, ChevronLeft, ChevronRight, Server, TrendingUp, AlertTriangle } from 'lucide-react';
import type { TechStackNewsArticle } from '@/services/apiService';
import { timeAgo } from '@/lib/dateUtils';

interface MyStackTabProps {
  articles: TechStackNewsArticle[];
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSelectArticle: (id: string) => void;
  selectedArticleId: string | null;
  statistics: {
    totalArticles: number;
    matchedArticles: number;
    byTechnology: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  techStackCount: number;
}

type SortOption = 'score' | 'date' | 'severity';

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
  { key: 'score', label: 'RELEVANCE' },
  { key: 'date', label: 'DATE' },
  { key: 'severity', label: 'SEVERITY' },
];

export default function MyStackTab({
  articles,
  loading,
  refreshing,
  lastUpdated,
  onRefresh,
  onSelectArticle,
  selectedArticleId,
  statistics,
  techStackCount,
}: MyStackTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 180);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category))).sort(),
    [articles]
  );

  const technologies = useMemo(
    () => Array.from(new Set(articles.flatMap((a) => a.matchedTechnologies))).sort(),
    [articles]
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = [...articles];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((a) => selectedCategories.includes(a.category));
    }

    if (selectedTech.length > 0) {
      filtered = filtered.filter((a) =>
        a.matchedTechnologies.some((tech) => selectedTech.includes(tech))
      );
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.matchedTechnologies.some((tech) => tech.toLowerCase().includes(q))
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case 'severity':
        sorted.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'score':
      default:
        sorted.sort((a, b) => b.matchScore - a.matchScore);
        break;
    }

    return sorted;
  }, [articles, selectedCategories, selectedTech, debouncedSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedArticles = filteredAndSorted.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedTech, debouncedSearch, sortBy, pageSize]);

  if (techStackCount === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
        <Server size={48} className="text-text-tertiary" />
        <h3 className="text-lg font-semibold font-inter text-text-primary">
          Configure Your Tech Stack
        </h3>
        <p className="text-sm text-text-secondary font-inter max-w-md">
          Add your technologies (PHP, Apache, WordPress, etc.) in Settings to receive
          personalized security news relevant to your infrastructure.
        </p>
        <p className="text-xs text-text-tertiary font-jetbrains">
          Settings → My Technology Stack
        </p>
      </div>
    );
  }

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
          Analyzing articles for your tech stack...
        </p>
        <p className="text-text-tertiary text-xs font-jetbrains">
          Matching against {techStackCount} {techStackCount === 1 ? 'technology' : 'technologies'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="px-4 py-3 rounded-card bg-bg-card border border-border-default">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-accent" />
            <span className="text-xs font-jetbrains uppercase tracking-wide text-text-tertiary">
              Matched Articles
            </span>
          </div>
          <p className="text-2xl font-bold font-inter text-text-primary">
            {statistics.matchedArticles}
          </p>
          <p className="text-xs text-text-tertiary font-jetbrains mt-1">
            from {statistics.totalArticles} total
          </p>
        </div>

        <div className="px-4 py-3 rounded-card bg-bg-card border border-border-default">
          <div className="flex items-center gap-2 mb-1">
            <Server size={16} className="text-accent" />
            <span className="text-xs font-jetbrains uppercase tracking-wide text-text-tertiary">
              Technologies
            </span>
          </div>
          <p className="text-2xl font-bold font-inter text-text-primary">
            {Object.keys(statistics.byTechnology).length}
          </p>
          <p className="text-xs text-text-tertiary font-jetbrains mt-1">
            in your stack
          </p>
        </div>

        <div className="px-4 py-3 rounded-card bg-bg-card border border-border-default">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-accent" />
            <span className="text-xs font-jetbrains uppercase tracking-wide text-text-tertiary">
              Top Category
            </span>
          </div>
          <p className="text-lg font-bold font-inter text-text-primary truncate">
            {Object.entries(statistics.bySeverity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </p>
          <p className="text-xs text-text-tertiary font-jetbrains mt-1">
            {Object.entries(statistics.bySeverity).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} articles
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium font-inter rounded-md text-accent bg-accent-dim hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RefreshCw size={14} />
            </motion.span>
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>

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

      {/* Technology filters */}
      {technologies.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mr-1">
            Technologies
          </span>
          <button
            onClick={() => setSelectedTech([])}
            className={`
              px-2.5 py-1 text-[11px] font-medium font-inter rounded-md
              transition-all duration-200 cursor-pointer
              ${selectedTech.length === 0
                ? 'text-accent bg-accent-dim'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
              }
            `}
          >
            All
          </button>
          {technologies.slice(0, 10).map((tech) => {
            const active = selectedTech.includes(tech);
            const count = statistics.byTechnology[tech] || 0;
            return (
              <button
                key={tech}
                onClick={() =>
                  setSelectedTech((prev) =>
                    active ? prev.filter((t) => t !== tech) : [...prev, tech]
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
                {tech} <span className="text-text-tertiary ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mr-1">
            Categories
          </span>
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
        </div>
      )}

      {/* Article count */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-jetbrains uppercase tracking-[0.08em] text-text-tertiary">
          {filteredAndSorted.length === 0
            ? '0 articles'
            : `${startIndex + 1}-${Math.min(startIndex + pageSize, filteredAndSorted.length)} of ${filteredAndSorted.length} articles`}
        </span>
        {refreshing && (
          <span className="text-[11px] font-jetbrains text-accent animate-pulse">
            Refreshing...
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
        <AnimatePresence mode="popLayout" initial={false}>
          {paginatedArticles.map((article) => (
            <StackNewsCard
              key={article.id}
              article={article}
              isSelected={selectedArticleId === article.id}
              onClick={() => onSelectArticle(article.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary text-sm font-inter">
            No articles match your filters
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

/* ─── Stack News Card ─── */

interface StackNewsCardProps {
  article: TechStackNewsArticle;
  isSelected: boolean;
  onClick: () => void;
}

const StackNewsCard = memo(function StackNewsCard({ article, isSelected, onClick }: StackNewsCardProps) {
  const dotColor = severityColor[article.severity] || 'bg-medium';

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.14, ease: 'easeOut' } }}
      transition={{
        duration: 0.24,
        ease: [0, 0, 0.2, 1] as [number, number, number, number],
        layout: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
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
      {/* Match Score Badge */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-dim text-accent text-[10px] font-bold font-jetbrains uppercase tracking-wide rounded-pill">
          <Thermometer size={10} />
          {Math.round(article.matchScore)}
        </span>
      </div>

      {/* Row 1: Header */}
      <div className="flex items-center gap-2 mb-2 pr-16">
        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
        <span className="flex-1 text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary truncate">
          {article.source}
        </span>
        <span className="text-[11px] font-medium font-jetbrains text-text-tertiary shrink-0">
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Row 2: Title */}
      <h3 className="text-base font-semibold font-inter leading-snug tracking-tight line-clamp-2 mb-1">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Read the original article"
          className="text-text-primary hover:text-accent hover:underline decoration-1 underline-offset-2 transition-colors"
        >
          {article.title}
        </a>
      </h3>

      {/* Row 3: Matched Technologies */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {article.matchedTechnologies.slice(0, 3).map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium font-jetbrains uppercase tracking-wide rounded-pill"
          >
            {tech}
          </span>
        ))}
        {article.matchedTechnologies.length > 3 && (
          <span className="text-[10px] font-jetbrains text-text-tertiary">
            +{article.matchedTechnologies.length - 3} more
          </span>
        )}
      </div>

      {/* Row 4: Summary */}
      <p className="text-sm text-text-secondary font-inter leading-relaxed line-clamp-2 mb-3">
        {article.summary}
      </p>

      {/* Row 5: Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
});
