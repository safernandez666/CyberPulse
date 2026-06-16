import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { SourceInfo } from '@/hooks/useRSSFeeds';

interface SidebarProps {
  sources: SourceInfo[];
  onToggleSource: (id: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ sources, onToggleSource, onClose }: SidebarProps) {
  const activeCount = sources.filter((s) => s.active).length;
  const totalArticles = sources
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.count, 0);

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
        <p className="px-6 pb-2 text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary">
          SOURCES
        </p>
        {sources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
              delay: index * 0.04,
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
            <span className="flex-1 text-[13px] font-medium text-text-primary font-inter truncate">
              {source.name}
            </span>

            {/* Article Count */}
            <span className="text-xs font-normal font-jetbrains text-text-tertiary">
              {source.count}
            </span>
          </motion.div>
        ))}
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
