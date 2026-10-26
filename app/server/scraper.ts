import Parser from 'rss-parser';
import { getDb } from './db';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'CyberPulse-RSS-Scraper/1.0',
  },
});

function inferSeverity(title: string): 'critical' | 'high' | 'medium' | 'low' {
  const t = title.toLowerCase();
  if (/critical|0-day|zero-day|ransomware|breach|exploit|actively exploited|emergency/i.test(t)) return 'critical';
  if (/high|vulnerability|flaw|attack|malware|phishing|cve/i.test(t)) return 'high';
  if (/medium|warning|alert|advisory|patch/i.test(t)) return 'medium';
  return 'low';
}

export function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'UNKNOWN';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'JUST NOW';
  if (diffMin < 60) return `${diffMin} MIN AGO`;
  if (diffHrs < 24) return `${diffHrs} HR${diffHrs > 1 ? 'S' : ''} AGO`;
  if (diffDays < 7) return `${diffDays} DAY${diffDays > 1 ? 'S' : ''} AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function publishDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'UNKNOWN';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* Feeds in the wild carry timezone abbreviations JS cannot parse (CERT-EU
   sends "Fri, 23 Oct 2026 16:36:26 CEST"). `new Date(...).toISOString()` throws
   on those, which used to abort every remaining item from that source. */
const TZ_ABBREVIATIONS: Record<string, string> = {
  CET: '+0100', CEST: '+0200', EET: '+0200', EEST: '+0300',
  WET: '+0000', WEST: '+0100', BST: '+0100', MSK: '+0300',
  IST: '+0530', JST: '+0900', KST: '+0900', AEST: '+1000', AEDT: '+1100',
};

export function parsePublishedAt(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();

  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return direct.toISOString();

  /* Retry with the trailing abbreviation swapped for a numeric offset. */
  const match = raw.trim().match(/\s([A-Z]{2,4})$/);
  const offset = match ? TZ_ABBREVIATIONS[match[1]] : undefined;
  if (offset) {
    const retry = new Date(raw.trim().replace(/\s[A-Z]{2,4}$/, ` ${offset}`));
    if (!isNaN(retry.getTime())) return retry.toISOString();
  }

  return new Date().toISOString();
}

function readTime(description: string): string {
  const text = description.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 200))} MIN READ`;
}

export async function scrapeSource(source: { name: string; rssUrl: string; category: string }): Promise<{ found: number; new: number; error?: string }> {
  try {
    const feed = await parser.parseURL(source.rssUrl);
    const items = feed.items?.slice(0, 10) || [];
    const db = getDb();
    let newCount = 0;

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO articles
      (title, summary, source, severity, category, published_at, publish_date, read_time, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      try {
        if (!item.title || !item.link) continue;
        const summary = item.contentSnippet || item.content || '';
        const pubDate = parsePublishedAt(item.isoDate || item.pubDate);

        const result = insertStmt.run(
          item.title,
          summary.slice(0, 400),
          source.name,
          inferSeverity(item.title),
          source.category,
          pubDate,
          publishDate(pubDate),
          readTime(summary),
          item.link,
        );

        if (result.changes > 0) newCount++;
      } catch (itemErr: any) {
        /* One malformed entry should cost us that entry, not the whole feed. */
        console.warn(`[SCRAPER] ${source.name}: skipped an item — ${itemErr?.message || itemErr}`);
      }
    }

    // Update source stats
    const count = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE source = ?`).get(source.name) as { c: number };
    db.prepare(`UPDATE sources SET article_count = ?, last_fetch = CURRENT_TIMESTAMP WHERE name = ?`).run(count.c, source.name);

    // Log
    db.prepare(`INSERT INTO fetch_log (source, articles_found, articles_new) VALUES (?, ?, ?)`).run(source.name, items.length, newCount);

    return { found: items.length, new: newCount };
  } catch (err: any) {
    const error = err?.message || 'Unknown error';
    const db = getDb();
    db.prepare(`INSERT INTO fetch_log (source, articles_found, articles_new, error) VALUES (?, ?, ?, ?)`).run(source.name, 0, 0, error);
    return { found: 0, new: 0, error };
  }
}

/* Feeds are independent and the work is almost entirely network wait, so they
   are fetched through a small worker pool instead of one at a time. The old
   serial loop (plus a 500 ms sleep after every source) took ~3.6 min for 100+
   feeds, which meant a scrape was still running when the next one was due. */
const SCRAPE_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.CYBERPULSE_SCRAPE_CONCURRENCY || '', 10) || 8
);

export async function scrapeAll(): Promise<{ total: number; errors: string[] }> {
  const startedAt = Date.now();
  const db = getDb();
  const rows = db.prepare(`SELECT name, rss_url as rssUrl, category FROM sources WHERE active = 1 ORDER BY name`).all() as Array<{ name: string; rssUrl: string; category: string }>;

  console.log(`[SCRAPER] Starting full RSS scrape of ${rows.length} sources (concurrency ${SCRAPE_CONCURRENCY})...`);

  const errors: string[] = [];
  let totalNew = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < rows.length) {
      const source = rows[cursor++];
      const result = await scrapeSource(source);
      if (result.error) {
        errors.push(`${source.name}: ${result.error}`);
      } else {
        console.log(`[SCRAPER] ${source.name}: ${result.new} new / ${result.found} found`);
        totalNew += result.new;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(SCRAPE_CONCURRENCY, rows.length) }, () => worker())
  );

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[SCRAPER] Done in ${elapsed}s. ${totalNew} new articles. ${errors.length} errors.`);
  return { total: totalNew, errors };
}

export function cleanOldArticles(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM articles
    WHERE id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY source ORDER BY published_at DESC) as rn
        FROM articles
      ) WHERE rn <= 100
    )
  `);
  console.log('[SCRAPER] Cleaned old articles');
}
