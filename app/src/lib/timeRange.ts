import type { NewsArticle } from '@/data/mockNews';

export type TimeRange = '24h' | '7d' | '30d' | 'all';

export const timeRangeOptions: { key: TimeRange; label: string; hours: number | null }[] = [
  { key: '24h', label: '24H', hours: 24 },
  { key: '7d', label: '7 DAYS', hours: 24 * 7 },
  { key: '30d', label: '30 DAYS', hours: 24 * 30 },
  { key: 'all', label: 'ALL TIME', hours: null },
];

/* Only the API supplies a real instant; bundled mock articles have none and
   are treated as always in range rather than silently filtered away. */
export function articleTime(a: NewsArticle): number | null {
  if (!a.publishedAtIso) return null;
  const t = new Date(a.publishedAtIso).getTime();
  return isNaN(t) ? null : t;
}

export function rangeCutoff(range: TimeRange): number | null {
  const hours = timeRangeOptions.find((o) => o.key === range)?.hours ?? null;
  return hours === null ? null : Date.now() - hours * 3600_000;
}

export function isWithinRange(a: NewsArticle, cutoffMs: number | null): boolean {
  if (cutoffMs === null) return true;
  const t = articleTime(a);
  return t === null || t >= cutoffMs;
}

/* How many articles each source contributes inside the current window. The
   sidebar used to show a lifetime count from the database, which disagreed
   with the feed whenever a source's articles fell outside the view. */
export function countArticlesBySource(
  articles: NewsArticle[],
  range: TimeRange
): Map<string, number> {
  const cutoff = rangeCutoff(range);
  const counts = new Map<string, number>();
  for (const a of articles) {
    if (!isWithinRange(a, cutoff)) continue;
    counts.set(a.source, (counts.get(a.source) || 0) + 1);
  }
  return counts;
}
