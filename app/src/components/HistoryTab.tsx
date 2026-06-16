import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ClipboardCopy,
  Trash2,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface SavedPost {
  id: string;
  title: string;
  content: string;
  sourceArticleTitle: string;
  sourceArticleUrl: string;
  tone: string;
  format: string;
  length: string;
  createdAt: string; // ISO date string
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const STORAGE_KEY = 'cyberpulse_history';

function getRelativeTime(isoDate: string): string {
  const now = new Date().getTime();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'JUST NOW';
  if (diffMins < 60) return `${diffMins} MIN${diffMins > 1 ? 'S' : ''} AGO`;
  if (diffHours < 24) return `${diffHours} HR${diffHours > 1 ? 'S' : ''} AGO`;
  if (diffDays === 1) return '1 DAY AGO';
  return `${diffDays} DAYS AGO`;
}

function generateMockPosts(): SavedPost[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: '🚨 NEW RANSOMWARE ALERT: BlackMamba',
      content: `A new ransomware strain dubbed "BlackMamba" is targeting critical infrastructure across Europe, and the implications are serious.

Here's what we know:
• BlackMamba uses a hybrid encryption scheme that combines AES-256 for file encryption and RSA-2048 for key protection
• The attack vector appears to be spear-phishing emails targeting IT administrators
• At least 12 European energy and water utilities have been impacted in the past 72 hours
• The group behind it is demanding ransoms between €500K and €2M

What should you do right now?
1. Audit your backup strategy — ensure offline/air-gapped backups exist
2. Review email filtering rules and phishing simulation results
3. Verify your incident response plan is up to date and tested

This is a developing situation. I'll share updates as more information becomes available.

#Cybersecurity #Ransomware #BlackMamba #CriticalInfrastructure #InfoSec #CISO`,
      sourceArticleTitle:
        "New Ransomware Strain 'BlackMamba' Targets Critical Infrastructure Across Europe",
      sourceArticleUrl: '#',
      tone: 'Professional',
      format: 'News Analysis',
      length: 'Medium',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Why Your VPN Might Be Your Biggest Weakness Right Now',
      content: `We've been told for years that VPNs are the gold standard for secure remote access. But what if I told you that your VPN concentrator might be the weakest link in your security architecture right now?

Here's the uncomfortable truth: VPNs create a false sense of security. They extend your perimeter — but they don't verify what's on the other end. Once an attacker breaches a VPN endpoint, they often have lateral access to your entire network.

The recent FortiOS vulnerability (CVE-2024-XXXX) is a perfect case study. Attackers are actively exploiting unpatched FortiGate devices to establish persistent VPN tunnels — effectively turning your security appliance into their backdoor.

What's the alternative? Zero Trust Network Access (ZTNA). Instead of trusting the tunnel, ZTNA verifies every user, every device, and every session — continuously.

I'm not saying ditch your VPN tomorrow. But you should be asking hard questions about what happens *after* the tunnel is established.

#ZeroTrust #VPN #Cybersecurity #NetworkSecurity #InfoSec`,
      sourceArticleTitle:
        'Critical FortiOS Vulnerability Under Active Exploitation',
      sourceArticleUrl: '#',
      tone: 'Thought Leadership',
      format: 'Contrarian Take',
      length: 'Long',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'FortiOS Vuln: 3 Things to Do Today',
      content: `⚠️ If you're running FortiOS, stop what you're doing and check this:

1. PATCH NOW — Fortinet released an emergency update. If you're on 7.2.x or 7.4.x, upgrade immediately.

2. CHECK LOGS — Look for suspicious SSL-VPN login activity from unknown IPs between Dec 1-15.

3. ROTATE CREDENTIALS — Any account that accessed the VPN during the exposure window should have its password rotated AND enable MFA if not already on.

This vulnerability is being actively exploited in the wild. Time is critical.

#Fortinet #FortiOS #Vulnerability #Cybersecurity #PatchManagement`,
      sourceArticleTitle:
        'Critical FortiOS Vulnerability Under Active Exploitation',
      sourceArticleUrl: '#',
      tone: 'Urgent',
      format: 'Quick Summary',
      length: 'Short',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'The NIS2 Deadline Is Coming — Here\'s My Take',
      content: `I've spent the last three months helping our organization prepare for the EU NIS2 Directive deadline, and honestly? It's been one of the most transformative security initiatives we've undertaken.

When we started, I viewed NIS2 as just another compliance checkbox. But going through the gap analysis changed my perspective. The requirements around supply chain security, incident reporting (24-hour notification!), and board-level accountability are forcing real structural changes.

The hardest part? Getting buy-in from leadership. I found that framing NIS2 not as a compliance cost but as a business resilience investment made all the difference. When I showed the board that similar organizations faced €10M+ fines and operational shutdowns, the budget approvals suddenly got easier.

My advice: start now if you haven't already. The October deadline is closer than it looks, and the supply chain assessment alone took us 6 weeks.

#NIS2 #Compliance #Cybersecurity #EU #CISO #Governance`,
      sourceArticleTitle: 'EU NIS2 Directive: What CISOs Need to Know',
      sourceArticleUrl: '#',
      tone: 'Casual',
      format: 'Storytelling',
      length: 'Medium',
      createdAt: new Date(
        now.getTime() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    {
      id: '5',
      title:
        '4.2 Million Records: What the Healthcare Breach Teaches Us',
      content: `A major U.S. healthcare provider just disclosed a data breach affecting 4.2 million patient records. The attack vector? An unpatched vulnerability in their patient portal's third-party file upload component.

This breach is a masterclass in what NOT to do. Let me break down the key lessons:

🔍 LESSON 1: Third-party code is YOUR responsibility
The vulnerability was in a widely-used open-source upload library. The healthcare provider assumed their vendor managed updates. They didn't. When you embed third-party code, you own its security.

🔍 LESSON 2: Data retention policies matter
4.2M records spanned 8 years of data. Why was patient data from 2016 still accessible from a public-facing portal? Proper data lifecycle management would have dramatically reduced blast radius.

🔍 LESSON 3: Detection speed is everything
The attackers had access for 11 days before detection. With proper monitoring and anomaly detection, this should have been caught within hours — not days.

The estimated recovery cost? $15-20 million. The reputational damage? Incalculable.

#DataBreach #Healthcare #Cybersecurity #ThirdPartyRisk #DataProtection #InfoSec`,
      sourceArticleTitle:
        'Major Healthcare Provider Discloses Data Breach Affecting 4.2 Million Patient Records',
      sourceArticleUrl: '#',
      tone: 'Educational',
      format: 'News Analysis',
      length: 'Long',
      createdAt: new Date(
        now.getTime() - 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
  ];
}

function loadPosts(): SavedPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedPost[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  const mock = generateMockPosts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
  return mock;
}

function savePosts(posts: SavedPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// ------------------------------------------------------------------
// Empty State SVG Component
// ------------------------------------------------------------------
function EmptyStateIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document */}
      <rect
        x="25"
        y="15"
        width="55"
        height="70"
        rx="4"
        stroke="#555555"
        strokeWidth="1.5"
      />
      <line x1="38" y1="35" x2="67" y2="35" stroke="#555555" strokeWidth="1.5" />
      <line x1="38" y1="45" x2="67" y2="45" stroke="#555555" strokeWidth="1.5" />
      <line x1="38" y1="55" x2="55" y2="55" stroke="#555555" strokeWidth="1.5" />
      {/* Sparkle */}
      <path
        d="M85 20C85 20 88 26 94 29C88 32 85 38 85 38C85 38 82 32 76 29C82 26 85 20 85 20Z"
        stroke="#555555"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="52" r="3" stroke="#555555" strokeWidth="1.5" />
      <circle cx="78" cy="65" r="2" stroke="#555555" strokeWidth="1.5" />
    </svg>
  );
}

// ------------------------------------------------------------------
// Toast Component
// ------------------------------------------------------------------
function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-2 px-4 py-3 bg-bg-elevated border border-border-default rounded-lg shadow-lg"
    >
      {toast.type === 'success' ? (
        <Check size={16} className="text-accent shrink-0" />
      ) : (
        <AlertCircle size={16} className="text-critical shrink-0" />
      )}
      <span className="text-sm font-inter text-text-primary">{toast.message}</span>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// History Card Component
// ------------------------------------------------------------------
function HistoryCard({
  post,
  index,
  onCopy,
  onDelete,
  searchQuery,
}: {
  post: SavedPost;
  index: number;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const matchesSearch =
    !searchQuery ||
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.sourceArticleTitle.toLowerCase().includes(searchQuery.toLowerCase());

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    onCopy(post.content);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: matchesSearch ? 1 : 0.3,
        y: 0,
      }}
      exit={{
        opacity: 0,
        x: '-100%',
        transition: { duration: 0.3, ease: 'easeInOut' },
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
        delay: index * 0.05,
        layout: { duration: 0.3 },
      }}
      className={`
        bg-bg-card border border-border-default rounded-[12px] p-4
        transition-colors duration-200 ease-out
        hover:bg-bg-elevated hover:border-[#2A2A2A]
        ${matchesSearch ? '' : 'pointer-events-none'}
      `}
    >
      {/* Header Row */}
      <div className="flex items-center gap-3">
        {/* Title */}
        <h3
          className="flex-1 text-base font-semibold text-text-primary font-inter truncate leading-tight"
          title={post.title}
        >
          {post.title}
        </h3>

        {/* Date */}
        <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-text-tertiary shrink-0">
          {getRelativeTime(post.createdAt)}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-[2px] text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-accent-dim text-accent rounded-pill">
            {post.tone}
          </span>
          <span className="px-2 py-[2px] text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-accent-dim text-accent rounded-pill">
            {post.format}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="relative p-1.5 text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer"
          >
            <ClipboardCopy size={16} />
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-bg-elevated text-accent rounded-pill border border-border-default whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
          <button
            onClick={() => onDelete(post.id)}
            title="Delete post"
            className="p-1.5 text-text-tertiary hover:text-critical transition-colors duration-200 cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={toggleExpanded}
            title={expanded ? 'Collapse' : 'Expand'}
            className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Divider */}
            <div className="my-4 border-t border-border-default" />

            {/* Full Post Content */}
            <div className="font-merriweather text-[15px] leading-[1.7] text-text-primary whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-2 mt-4">
              <span className="px-2 py-[2px] text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-accent-dim text-accent rounded-pill">
                {post.tone}
              </span>
              <span className="px-2 py-[2px] text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-accent-dim text-accent rounded-pill">
                {post.format}
              </span>
              <span className="px-2 py-[2px] text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] bg-accent-dim text-accent rounded-pill">
                {post.length}
              </span>
            </div>

            {/* Source Article Link */}
            <a
              href={post.sourceArticleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-inter text-text-secondary hover:text-accent transition-colors duration-200"
            >
              <ExternalLink size={12} />
              <span className="truncate">{post.sourceArticleTitle}</span>
            </a>

            {/* Expanded Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-text-inverse text-sm font-semibold font-inter rounded-button hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <ClipboardCopy size={14} />
                Copy to Clipboard
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="flex items-center gap-2 px-5 py-2.5 text-critical text-sm font-medium font-inter rounded-button hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={14} />
                Delete Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main HistoryTab Component
// ------------------------------------------------------------------
export default function HistoryTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load posts on mount
  useEffect(() => {
    const data = loadPosts();
    setPosts(data);
    setLoaded(true);
  }, []);

  // Add toast
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, visible: true }]);
  }, []);

  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle copy
  const handleCopy = useCallback(
    (_content: string) => {
      addToast('Copied to clipboard', 'success');
    },
    [addToast]
  );

  // Handle delete request (opens dialog)
  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (!deleteTargetId) return;
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== deleteTargetId);
      savePosts(next);
      return next;
    });
    setDeleteTargetId(null);
    addToast('Post deleted', 'success');
  }, [deleteTargetId, addToast]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-transparent border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state: no posts at all
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyStateIllustration />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-lg font-semibold text-text-primary font-inter"
        >
          No saved posts yet
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-2 text-sm font-normal text-text-secondary font-inter"
        >
          Generate your first post from the News Feed
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          onClick={() => console.log('Navigate to News Feed')}
          className="mt-6 px-5 py-2.5 bg-accent text-text-inverse text-sm font-semibold font-inter rounded-button hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          Go to News Feed
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary font-inter leading-tight tracking-[-0.02em]">
          History
        </h1>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved posts..."
            className="
              w-[240px] pl-9 pr-8 py-2.5
              bg-bg-input border border-border-default rounded-input
              text-sm font-inter text-text-primary
              placeholder:text-text-tertiary
              focus:outline-none focus:border-border-active focus:shadow-[0_0_0_2px_rgba(204,255,0,0.15)]
              transition-all duration-200
            "
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <HistoryCard
              key={post.id}
              post={post}
              index={index}
              onCopy={handleCopy}
              onDelete={handleDeleteRequest}
              searchQuery={searchQuery}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent
          showCloseButton={false}
          className="bg-bg-card border border-border-default rounded-modal p-6 max-w-[400px] gap-5"
        >
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold text-text-primary font-inter">
              Delete Post?
            </DialogTitle>
            <DialogDescription className="text-sm font-normal text-text-secondary font-inter mt-2">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-3 mt-2">
            <button
              onClick={cancelDelete}
              className="px-5 py-2.5 bg-transparent border border-border-default text-text-primary text-sm font-medium font-inter rounded-button hover:border-text-secondary hover:bg-bg-elevated transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2.5 text-critical text-sm font-medium font-inter rounded-button hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200 cursor-pointer"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
