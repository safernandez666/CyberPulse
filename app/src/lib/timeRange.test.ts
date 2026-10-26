import { describe, it, expect } from 'vitest';
import type { NewsArticle } from '@/data/mockNews';
import {
  articleTime,
  isWithinRange,
  rangeCutoff,
  countArticlesBySource,
} from './timeRange';

function article(partial: Partial<NewsArticle>): NewsArticle {
  return {
    id: 'a',
    title: 't',
    summary: 's',
    source: 'Some Source',
    severity: 'low',
    category: 'GENERAL',
    publishedAt: '1 HR AGO',
    publishDate: 'Oct 26, 2026',
    readTime: '2 MIN READ',
    url: 'https://example.test/a',
    ...partial,
  };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

describe('articleTime', () => {
  it('reads the ISO instant the API now sends', () => {
    const t = articleTime(article({ publishedAtIso: '2026-10-23T16:36:26Z' }));
    expect(t).toBe(Date.parse('2026-10-23T16:36:26Z'));
  });

  it('returns null for mock articles that carry no instant', () => {
    expect(articleTime(article({ publishedAtIso: undefined }))).toBeNull();
  });

  it('returns null rather than NaN for an unparsable instant', () => {
    expect(articleTime(article({ publishedAtIso: '2 HRS AGO' }))).toBeNull();
  });
});

describe('rangeCutoff', () => {
  it('has no cutoff for "all"', () => {
    expect(rangeCutoff('all')).toBeNull();
  });

  it('places 24h roughly one day back', () => {
    const cutoff = rangeCutoff('24h')!;
    expect(Math.round((Date.now() - cutoff) / 3600_000)).toBe(24);
  });

  it('places 7d and 30d at the right distance', () => {
    expect(Math.round((Date.now() - rangeCutoff('7d')!) / 86_400_000)).toBe(7);
    expect(Math.round((Date.now() - rangeCutoff('30d')!) / 86_400_000)).toBe(30);
  });
});

describe('isWithinRange', () => {
  it('keeps everything when there is no cutoff', () => {
    expect(isWithinRange(article({ publishedAtIso: '2001-01-01T00:00:00Z' }), null)).toBe(true);
  });

  it('keeps an article inside the window and drops one outside it', () => {
    const cutoff = rangeCutoff('24h');
    expect(isWithinRange(article({ publishedAtIso: hoursAgo(2) }), cutoff)).toBe(true);
    expect(isWithinRange(article({ publishedAtIso: hoursAgo(48) }), cutoff)).toBe(false);
  });

  it('keeps undated mock articles so the demo view never empties', () => {
    expect(isWithinRange(article({ publishedAtIso: undefined }), rangeCutoff('24h'))).toBe(true);
  });
});

describe('countArticlesBySource', () => {
  const articles = [
    article({ id: '1', source: 'Recent Source', publishedAtIso: hoursAgo(1) }),
    article({ id: '2', source: 'Recent Source', publishedAtIso: hoursAgo(5) }),
    article({ id: '3', source: 'Quiet Source', publishedAtIso: hoursAgo(24 * 40) }),
  ];

  it('counts only what falls inside the window', () => {
    const counts = countArticlesBySource(articles, '24h');
    expect(counts.get('Recent Source')).toBe(2);
    // The source that caused the Mandiant confusion: it has articles, just
    // none recent, so it must read 0 here rather than its lifetime total.
    expect(counts.get('Quiet Source')).toBeUndefined();
  });

  it('counts everything under "all"', () => {
    const counts = countArticlesBySource(articles, 'all');
    expect(counts.get('Recent Source')).toBe(2);
    expect(counts.get('Quiet Source')).toBe(1);
  });

  it('widens as the window widens', () => {
    expect(countArticlesBySource(articles, '7d').get('Quiet Source')).toBeUndefined();
    expect(countArticlesBySource(articles, '30d').get('Quiet Source')).toBeUndefined();
    expect(countArticlesBySource(articles, 'all').get('Quiet Source')).toBe(1);
  });

  it('returns an empty map for no articles', () => {
    expect(countArticlesBySource([], '24h').size).toBe(0);
  });
});
