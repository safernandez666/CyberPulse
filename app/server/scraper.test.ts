import { describe, it, expect } from 'vitest';
import { parsePublishedAt } from './scraper';

describe('parsePublishedAt', () => {
  it('passes ISO timestamps through unchanged', () => {
    expect(parsePublishedAt('2026-10-23T16:36:26Z')).toBe('2026-10-23T16:36:26.000Z');
  });

  it('handles the RFC822 dates most feeds emit', () => {
    expect(parsePublishedAt('Tue, 21 Oct 2025 09:00:00 GMT')).toBe('2025-10-21T09:00:00.000Z');
  });

  it('resolves CEST, which used to throw and discard the whole CERT-EU feed', () => {
    // 16:36 CEST is 14:36 UTC.
    expect(parsePublishedAt('Fri, 23 Oct 2026 16:36:26 CEST')).toBe('2026-10-23T14:36:26.000Z');
  });

  it('resolves other abbreviations JS cannot parse natively', () => {
    expect(parsePublishedAt('Mon, 12 Oct 2026 14:57:02 CET')).toBe('2026-10-12T13:57:02.000Z');
    expect(parsePublishedAt('Mon, 12 Oct 2026 14:00:00 JST')).toBe('2026-10-12T05:00:00.000Z');
  });

  it('falls back to now rather than throwing on junk', () => {
    const before = Date.now();
    for (const input of ['not a date', '', undefined]) {
      const out = parsePublishedAt(input as string | undefined);
      const t = new Date(out).getTime();
      expect(Number.isNaN(t)).toBe(false);
      expect(t).toBeGreaterThanOrEqual(before - 1000);
    }
  });

  it('always returns a value SQLite can store and Date can re-read', () => {
    for (const input of [
      'Fri, 23 Oct 2026 16:36:26 CEST',
      '2026-10-23T16:36:26+02:00',
      'garbage',
    ]) {
      expect(() => new Date(parsePublishedAt(input)).toISOString()).not.toThrow();
    }
  });
});
