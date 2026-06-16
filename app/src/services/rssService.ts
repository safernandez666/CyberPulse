import type { NewsArticle } from '@/data/mockNews';
import { timeAgo, publishDate } from '@/lib/dateUtils';

/* ------------------------------------------------------------------ */
/*  All 35 RSS sources                                                 */
/* ------------------------------------------------------------------ */

const RSS_SOURCE_URLS: Record<string, string> = {
  'The Hacker News': 'https://feeds.feedburner.com/TheHackersNews',
  'BleepingComputer': 'https://www.bleepingcomputer.com/feed/',
  'SecurityWeek': 'https://www.securityweek.com/feed/',
  'The Record': 'https://therecord.media/feed/',
  'Krebs on Security': 'https://krebsonsecurity.com/feed/',
  'Ars Technica Security': 'https://arstechnica.com/security/feed/',
  'PortSwigger Blog': 'https://portswigger.net/blog/rss',
  'Dark Reading': 'https://www.darkreading.com/rss.xml',
  'Threatpost': 'https://threatpost.com/feed/',
  'CISA Advisories': 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
  'CyberScoop': 'https://cyberscoop.com/feed/',
  'SANS ISC': 'https://isc.sans.edu/rssfeed.xml',
  'Google Project Zero': 'https://googleprojectzero.blogspot.com/feeds/posts/default',
  'CrowdStrike Blog': 'https://www.crowdstrike.com/blog/feed/',
  'Mandiant': 'https://www.mandiant.com/resources/blog/rss.xml',
  'Microsoft Security': 'https://www.microsoft.com/en-us/security/blog/feed/',
  'Sophos News': 'https://news.sophos.com/en-us/feed/',
  'Tenable Blog': 'https://www.tenable.com/blog/feed',
  'Rapid7 Blog': 'https://www.rapid7.com/blog/posts/rss.xml',
  'Qualys Blog': 'https://blog.qualys.com/feed',
  'CERT-EU': 'https://cert.europa.eu/publications/newsletter',
  'NSA Cybersecurity': 'https://www.nsa.gov/Press-Room/Press-Releases-Statements/feed/',
  'ENISA': 'https://www.enisa.europa.eu/rss/publications',
  'FBI Cyber': 'https://www.fbi.gov/news/feed',
  'Cybersecurity Dive': 'https://www.cybersecuritydive.com/feeds/news/',
  'Fortinet Blog': 'https://www.fortinet.com/blog/feed',
  'Palo Alto Networks': 'https://www.paloaltonetworks.com/blog/feed',
  'Check Point Blog': 'https://blog.checkpoint.com/feed/',
  'Kaspersky Blog': 'https://www.kaspersky.com/blog/feed/',
  'Bitdefender': 'https://www.bitdefender.com/blog/hotforsecurity/feed/',
  'INCIBE': 'https://www.incibe.es/feed/alertas-tempranas',
  'CCN-CERT': 'https://www.ccn-cert.cni.es/feed/avisos',
  'OSI': 'https://www.osi.es/feed/actualidad',
  'RedesZone': 'https://www.redeszone.net/feed/',
  'WeLiveSecurity': 'https://www.welivesecurity.com/feed/',
};

/* ------------------------------------------------------------------ */
/*  Severity / helpers                                                 */
/* ------------------------------------------------------------------ */

function inferSeverity(title: string): NewsArticle['severity'] {
  const t = title.toLowerCase();
  if (/critical|0-day|zero-day|ransomware|breach|exploit|actively exploited|emergency/i.test(t)) return 'critical';
  if (/high|vulnerability|flaw|attack|malware|phishing|cve/i.test(t)) return 'high';
  if (/medium|warning|alert|advisory|patch/i.test(t)) return 'medium';
  return 'low';
}

export { timeAgo, publishDate };

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ */
/*  feed2json.org — converts RSS to JSON (CORS-enabled)                */
/* ------------------------------------------------------------------ */

interface Feed2JSONItem {
  title?: string;
  date_published?: string;
  url?: string;
  content_html?: string;
  summary?: string;
}

interface Feed2JSONResponse {
  title?: string;
  items?: Feed2JSONItem[];
}

async function fetchViaFeed2JSON(rssUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    const proxyUrl = `https://feed2json.org/convert?url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data: Feed2JSONResponse = await res.json();
    if (!data.items || data.items.length === 0) return [];

    return data.items.slice(0, 10).map((item, i) => {
      const title = item.title || 'Untitled';
      const summary = stripHtml(item.content_html || item.summary || '');
      const pubDate = item.date_published || new Date().toISOString();

      return {
        id: `${sourceName.replace(/\s+/g, '-').toLowerCase()}-${i}-${Date.now()}`,
        title,
        summary: summary.slice(0, 400),
        source: sourceName,
        severity: inferSeverity(title),
        category: 'GENERAL',
        publishedAt: pubDate,
        publishDate: publishDate(pubDate),
        readTime: `${Math.max(2, Math.ceil(summary.length / 800))} MIN READ`,
        url: item.url || '#',
      };
    });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Main: fetch all feeds                                              */
/* ------------------------------------------------------------------ */

export async function fetchFeedsFromProxy(sourceNames: string[]): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  let successCount = 0;

  // Process in batches of 5 (feed2json is fast)
  const batchSize = 5;
  for (let i = 0; i < sourceNames.length; i += batchSize) {
    const batch = sourceNames.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (sourceName) => {
        const rssUrl = RSS_SOURCE_URLS[sourceName];
        if (!rssUrl) return [];
        return fetchViaFeed2JSON(rssUrl, sourceName);
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles.push(...result.value);
        successCount++;
      }
    }

    // Small delay between batches
    if (i + batchSize < sourceNames.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`[RSS] ${allArticles.length} articles from ${successCount} sources`);
  return allArticles;
}

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'cyberpulse_news_v4';
const STORAGE_TIME = 'cyberpulse_news_time_v4';
const CACHE_MINUTES = 30;

export function loadCachedNews(): NewsArticle[] | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const cachedTime = localStorage.getItem(STORAGE_TIME);
    if (!cached || !cachedTime) return null;

    const age = (Date.now() - parseInt(cachedTime)) / 60000;
    if (age > CACHE_MINUTES) return null;

    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export function saveCachedNews(articles: NewsArticle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    localStorage.setItem(STORAGE_TIME, Date.now().toString());
  } catch { /* noop */ }
}

export function clearCache(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_TIME);
}
