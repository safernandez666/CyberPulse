import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Power, AlertTriangle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { SourceInfo } from '@/hooks/useRSSFeeds';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* `count` is how many articles the source contributes to the window currently
   shown in the feed. A source can legitimately be quiet — Project Zero and ZDI
   post rarely — so 0 here is not a fault. `neverDelivered` marks the real
   problem: a feed that has never produced a single article. */
export interface SidebarSource extends SourceInfo {
  lifetimeCount?: number;
  neverDelivered?: boolean;
}

interface SidebarProps {
  sources: SidebarSource[];
  onToggleSource: (id: string) => void;
  onToggleAll?: (active: boolean) => void;
  onClose?: () => void;
  onAddSource?: (name: string, rssUrl: string, category: string) => Promise<void>;
  onDeleteSource?: (id: string) => Promise<void>;
}

export default function Sidebar({ sources, onToggleSource, onToggleAll, onClose, onAddSource, onDeleteSource }: SidebarProps) {
  /* Sources with nothing in the current window are hidden so the list only
     shows what the feed can actually surface. They stay one click away rather
     than gone: this is also the only place to switch a source on or off, and
     in a 24h window roughly two thirds of them have nothing to show. */
  const [showEmpty, setShowEmpty] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const withData = sources.filter((s) => s.count > 0);
  const empty = sources.filter((s) => s.count === 0);
  const visible = showEmpty ? [...withData, ...empty] : withData;

  const activeCount = sources.filter((s) => s.active).length;
  const totalArticles = sources
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.count, 0);

  const handleAddSource = async () => {
    if (!onAddSource) return;
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      setError('Name and URL are required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onAddSource(newSourceName.trim(), newSourceUrl.trim(), newSourceCategory);
      setNewSourceName('');
      setNewSourceUrl('');
      setNewSourceCategory('GENERAL');
      setIsAddDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add source';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSource) return;
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      await onDeleteSource(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete source';
      alert(message);
    }
  };

  return (
    <aside className="flex flex-col w-[260px] h-full bg-bg-card border-r border-border-default shrink-0">
      {/* Logo Area */}
      <div className="px-6 py-6 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <img
                src="/pulse-logo.svg"
                alt="CyberPulse logo"
                width="28"
                height="28"
                className="rounded-lg"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary font-inter leading-tight">
              Cyber<span className="text-accent">Pulse</span>
            </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-[10px] font-medium font-jetbrains uppercase tracking-[0.1em] text-text-tertiary">
          CYBERSECURITY NEWS DASHBOARD
        </p>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex items-center justify-between px-6 pb-2">
          <p className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary">
            SOURCES
          </p>
          <div className="flex items-center gap-2">
            {onAddSource && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-1 text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary hover:text-accent transition-colors cursor-pointer"
                    title="Add custom RSS source"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add RSS Source</DialogTitle>
                    <DialogDescription>
                      Add a custom RSS feed to your sources
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Source Name
                      </label>
                      <Input
                        id="name"
                        placeholder="e.g., My Security Blog"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="url" className="text-sm font-medium">
                        RSS Feed URL
                      </label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com/feed.xml"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="category" className="text-sm font-medium">
                        Category
                      </label>
                      <select
                        id="category"
                        value={newSourceCategory}
                        onChange={(e) => setNewSourceCategory(e.target.value)}
                        disabled={isSubmitting}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="GENERAL">General</option>
                        <option value="VULNERABILITY">Vulnerability</option>
                        <option value="MALWARE">Malware</option>
                        <option value="THREAT INTEL">Threat Intel</option>
                        <option value="DATA BREACH">Data Breach</option>
                        <option value="PHISHING">Phishing</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="RESEARCH">Research</option>
                        <option value="PRIVACY">Privacy</option>
                        <option value="POLICY">Policy</option>
                        <option value="INDUSTRY">Industry</option>
                        <option value="ALERT">Alert</option>
                        <option value="AWARENESS">Awareness</option>
                      </select>
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleAddSource}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Source'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {onToggleAll && sources.length > 0 && (
              <button
                onClick={() => onToggleAll(activeCount === 0)}
                className="flex items-center gap-1 text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary hover:text-accent transition-colors cursor-pointer"
                title={activeCount === 0 ? 'Enable all sources' : 'Disable all sources'}
              >
                <Power size={10} />
                {activeCount === 0 ? 'Enable all' : 'Disable all'}
              </button>
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
        {visible.map((source, index) => (
          <motion.div
            key={source.id}
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{
              duration: 0.26,
              ease: 'easeOut',
              /* Stagger the first screenful only; past that the delay would
                 outlast the animation itself. */
              delay: Math.min(index, 12) * 0.03,
              layout: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
            className={`
              flex items-center gap-3 px-6 py-2.5 cursor-pointer
              border-b border-border-subtle
              transition-colors duration-200 ease-out
              hover:bg-bg-elevated
              ${source.active ? 'opacity-100' : 'opacity-40'}
            `}
            onClick={() => onToggleSource(source.id)}
          >
            {/* Custom Toggle Switch */}
            <div
              className={`
                relative w-8 h-[18px] rounded-full shrink-0
                transition-colors duration-250
                ${source.active ? 'bg-accent' : 'bg-border-default'}
              `}
            >
              <span
                className={`
                  absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full
                  transition-transform duration-250
                  ${source.active ? 'translate-x-[13px]' : 'translate-x-[2px]'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </div>

            {/* Source Name */}
            <span
              className={`
                flex-1 text-[13px] font-medium font-inter truncate
                ${source.neverDelivered ? 'text-text-tertiary line-through decoration-1' : 'text-text-primary'}
              `}
            >
              {source.name}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {source.neverDelivered ? (
                <span
                  className="flex items-center gap-1 text-[10px] font-jetbrains uppercase tracking-[0.06em] text-high shrink-0"
                  title="This feed has never returned an article — the URL is probably dead"
                >
                  <AlertTriangle size={11} aria-hidden="true" />
                  No data
                </span>
              ) : (
                <span
                  className={`
                    text-xs font-normal font-jetbrains shrink-0
                    ${source.count === 0 ? 'text-[#4A4A4A]' : 'text-text-tertiary'}
                  `}
                  title={
                    source.count === 0
                      ? `Nothing in the selected window (${source.lifetimeCount ?? 0} stored in total)`
                      : undefined
                  }
                >
                  {source.count}
                </span>
              )}
              {source.custom && onDeleteSource && (
                <button
                  onClick={(e) => handleDeleteSource(source.id, e)}
                  className="p-1 rounded hover:bg-bg-elevated text-text-tertiary hover:text-destructive transition-colors"
                  title="Delete custom source"
                  aria-label="Delete source"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>

        {empty.length > 0 && (
          <button
            onClick={() => setShowEmpty((v) => !v)}
            aria-expanded={showEmpty}
            className="w-full flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary hover:text-accent transition-colors cursor-pointer"
          >
            <ChevronDown
              size={11}
              className={`transition-transform duration-200 ${showEmpty ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {showEmpty ? 'Hide' : 'Show'} {empty.length} with no data
          </button>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="px-6 py-4 border-t border-border-default bg-bg-card">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-normal font-jetbrains text-text-tertiary">
            Active: {activeCount} sources
          </span>
          <span className="text-[11px] font-normal font-jetbrains text-text-tertiary">
            Total: {totalArticles} articles
          </span>
        </div>
      </div>
    </aside>
  );
}
