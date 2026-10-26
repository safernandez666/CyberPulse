import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  isSameOrigin,
  buildAiHostAllowlist,
  resolveAiBaseUrl,
} from './security';

describe('escapeHtml', () => {
  it('neutralises the tags that made the OAuth callback reflect script', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  it('escapes quotes so an attribute cannot be broken out of', () => {
    expect(escapeHtml(`" onmouseover="alert(1)`)).toBe(
      '&quot; onmouseover=&quot;alert(1)'
    );
    expect(escapeHtml("' onfocus='x")).toBe('&#39; onfocus=&#39;x');
  });

  it('escapes the ampersand first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
  });

  it('leaves ordinary provider messages readable', () => {
    expect(escapeHtml('The user cancelled the request')).toBe(
      'The user cancelled the request'
    );
  });
});

describe('isSameOrigin', () => {
  it('accepts a port that differs from the one the server bound to', () => {
    // Docker maps 3099 -> 3001; the browser's Origin carries 3099.
    expect(isSameOrigin('http://localhost:3099', 'localhost:3099')).toBe(true);
  });

  it('accepts a reverse-proxied https host', () => {
    expect(isSameOrigin('https://pulse.example.com', 'pulse.example.com')).toBe(true);
  });

  it('rejects a different host on the same port', () => {
    expect(isSameOrigin('http://evil.example:3001', 'localhost:3001')).toBe(false);
  });

  it('rejects a different port on the same host', () => {
    expect(isSameOrigin('http://localhost:4000', 'localhost:3001')).toBe(false);
  });

  it('rejects when the Host header is absent or the Origin is unparsable', () => {
    expect(isSameOrigin('http://localhost:3001', undefined)).toBe(false);
    expect(isSameOrigin('not a url', 'localhost:3001')).toBe(false);
  });
});

describe('resolveAiBaseUrl', () => {
  const allow = buildAiHostAllowlist(undefined);

  it('defaults to OpenAI when nothing is supplied', () => {
    expect(resolveAiBaseUrl(undefined, allow)).toEqual({ url: 'https://api.openai.com/v1' });
    expect(resolveAiBaseUrl('', allow)).toEqual({ url: 'https://api.openai.com/v1' });
  });

  it('blocks loopback, which previously returned the internal response body', () => {
    expect(resolveAiBaseUrl('http://127.0.0.1:3001/api', allow)).toHaveProperty('error');
    expect(resolveAiBaseUrl('http://localhost:3001/api', allow)).toHaveProperty('error');
  });

  it('blocks cloud metadata and other internal addresses', () => {
    for (const url of [
      'http://169.254.169.254/latest',
      'https://169.254.169.254/latest',
      'http://10.0.0.5/v1',
      'https://192.168.1.1/v1',
    ]) {
      expect(resolveAiBaseUrl(url, allow), url).toHaveProperty('error');
    }
  });

  it('rejects non-https schemes outright', () => {
    expect(resolveAiBaseUrl('http://api.openai.com/v1', allow)).toEqual({
      error: 'baseUrl must use https',
    });
    expect(resolveAiBaseUrl('file:///etc/passwd', allow)).toHaveProperty('error');
  });

  it('rejects an unknown https host', () => {
    const res = resolveAiBaseUrl('https://attacker.example/v1', allow);
    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).toContain('attacker.example');
  });

  it('is not fooled by an allowed host appearing elsewhere in the URL', () => {
    expect(resolveAiBaseUrl('https://attacker.example/api.openai.com/v1', allow)).toHaveProperty('error');
    expect(resolveAiBaseUrl('https://api.openai.com.attacker.example/v1', allow)).toHaveProperty('error');
    expect(resolveAiBaseUrl('https://attacker.example#api.openai.com', allow)).toHaveProperty('error');
  });

  it('accepts the known providers and normalises the trailing slash', () => {
    expect(resolveAiBaseUrl('https://api.openai.com/v1/', allow)).toEqual({
      url: 'https://api.openai.com/v1',
    });
    expect(resolveAiBaseUrl('https://api.groq.com/openai/v1', allow)).toEqual({
      url: 'https://api.groq.com/openai/v1',
    });
  });

  it('matches the host case-insensitively', () => {
    expect(resolveAiBaseUrl('https://API.OpenAI.COM/v1', allow)).toEqual({
      url: 'https://api.openai.com/v1',
    });
  });

  it('honours an operator-supplied extra host without opening everything', () => {
    const extended = buildAiHostAllowlist('llm.internal.example, Other.Example');
    expect(resolveAiBaseUrl('https://llm.internal.example/v1', extended)).toEqual({
      url: 'https://llm.internal.example/v1',
    });
    expect(resolveAiBaseUrl('https://other.example/v1', extended)).toHaveProperty('url');
    expect(resolveAiBaseUrl('https://attacker.example/v1', extended)).toHaveProperty('error');
  });
});
