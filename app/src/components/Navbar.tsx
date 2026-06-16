import { Newspaper, FileText, History } from 'lucide-react';
import type { ReactNode } from 'react';

export type TabId = 'news' | 'generate' | 'history';

interface TabConfig {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'news', label: 'News Feed', icon: <Newspaper size={16} /> },
  { id: 'generate', label: 'Generate Post', icon: <FileText size={16} /> },
  { id: 'history', label: 'History', icon: <History size={16} /> },
];

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="flex items-center h-14 px-6 bg-bg-primary border-b border-border-default shrink-0">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium font-inter
                transition-colors duration-200 ease-out cursor-pointer
                ${isActive
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
