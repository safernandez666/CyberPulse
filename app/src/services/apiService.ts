import type { NewsArticle } from '@/data/mockNews';
import { getSettings } from '@/lib/settings';

export interface SourceInfo {
  id: string;
  name: string;
  category: string;
  active: boolean;
  custom: boolean;
  count: number;
}

export interface ApiNewsResponse {
  articles: NewsArticle[];
  count: number;
}

export interface ApiSourceResponse {
  sources: {
    id: string;
    name: string;
    category: string;
    active: boolean;
    custom: boolean;
    count: number;
    lastFetch?: string;
  }[];
}

export function getCyberpulseApiKey(): string {
  return getSettings().cyberpulseApiKey || '';
}

function cyberpulseHeaders(): Record<string, string> {
  const key = getCyberpulseApiKey();
  return key ? { 'X-API-Key': key } : {};
}

export async function fetchApiNews(): Promise<NewsArticle[]> {
  const res = await fetch('/api/news?limit=1000');
  if (!res.ok) throw new Error(`News API error: ${res.status}`);
  const data: ApiNewsResponse = await res.json();
  return data.articles || [];
}

export async function fetchApiSources(): Promise<SourceInfo[]> {
  const res = await fetch('/api/sources');
  if (!res.ok) throw new Error(`Sources API error: ${res.status}`);
  const data: ApiSourceResponse = await res.json();
  return (data.sources || []).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    active: s.active,
    custom: s.custom,
    count: s.count,
  }));
}

export interface CreateSourceParams {
  name: string;
  rssUrl: string;
  category: string;
}

export interface SourceRecord {
  id: string;
  name: string;
  rssUrl: string;
  category: string;
  active: boolean;
  custom: boolean;
}

export async function createSource(source: CreateSourceParams): Promise<SourceRecord> {
  const res = await fetch('/api/sources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cyberpulseHeaders(),
    },
    body: JSON.stringify(source),
  });
  const data = (await res.json().catch(() => ({}))) as { source?: SourceRecord; error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Create source failed (${res.status})`);
  }
  if (!data.source) {
    throw new Error('Invalid create source response');
  }
  return data.source;
}

export async function deleteSource(id: string): Promise<void> {
  const res = await fetch(`/api/sources/${id}`, {
    method: 'DELETE',
    headers: cyberpulseHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Delete source failed (${res.status})`);
  }
}

export async function toggleSourceActive(id: string, active: boolean): Promise<SourceRecord> {
  const res = await fetch(`/api/sources/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...cyberpulseHeaders(),
    },
    body: JSON.stringify({ active }),
  });
  const data = (await res.json().catch(() => ({}))) as { source?: SourceRecord; error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Update source failed (${res.status})`);
  }
  if (!data.source) {
    throw new Error('Invalid update source response');
  }
  return data.source;
}

export interface GenerateAiPostParams {
  title: string;
  summary: string;
  source: string;
  category: string;
  severity: string;
  url: string;
  tone: string;
  format: string;
  length: string;
  language: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface GenerateAiPostResponse {
  post: string;
}

export async function generateAiPost(params: GenerateAiPostParams): Promise<string> {
  const res = await fetch('/api/generate-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cyberpulseHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || `AI request failed (${res.status})`);
  }

  const data = (await res.json()) as GenerateAiPostResponse;
  if (typeof data.post !== 'string') {
    throw new Error('Invalid AI response format');
  }
  return data.post;
}

/* ------------------------------------------------------------------ */
/*  LinkedIn integration                                              */
/* ------------------------------------------------------------------ */

export interface LinkedInConfigPayload {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export async function getLinkedInConfig(): Promise<{ configured: boolean }> {
  const res = await fetch('/api/linkedin/config');
  if (!res.ok) throw new Error(`LinkedIn config error: ${res.status}`);
  return res.json();
}

export async function saveLinkedInConfig(config: LinkedInConfigPayload): Promise<void> {
  const res = await fetch('/api/linkedin/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cyberpulseHeaders(),
    },
    body: JSON.stringify(config),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Save LinkedIn config failed (${res.status})`);
  }
}

export async function deleteLinkedInConfig(): Promise<void> {
  const res = await fetch('/api/linkedin/config', {
    method: 'DELETE',
    headers: cyberpulseHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Delete LinkedIn config failed (${res.status})`);
  }
}

export async function getLinkedInAuthUrl(): Promise<{ url: string }> {
  const res = await fetch('/api/linkedin/auth-url');
  if (!res.ok) throw new Error(`LinkedIn auth URL error: ${res.status}`);
  return res.json();
}

export interface LinkedInStatus {
  configured: boolean;
  connected: boolean;
  personUrn: string | null;
  personId: string | null;
}

export async function getLinkedInStatus(): Promise<LinkedInStatus> {
  const res = await fetch('/api/linkedin/status');
  if (!res.ok) throw new Error(`LinkedIn status error: ${res.status}`);
  return res.json();
}

export async function disconnectLinkedIn(): Promise<void> {
  const res = await fetch('/api/linkedin/disconnect', { method: 'POST' });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Disconnect LinkedIn failed (${res.status})`);
  }
}

export async function publishToLinkedIn(text: string, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'): Promise<{ success: boolean; postUrn: string }> {
  const res = await fetch('/api/linkedin/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...cyberpulseHeaders(),
    },
    body: JSON.stringify({ text, visibility }),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; postUrn?: string; error?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Publish to LinkedIn failed (${res.status})`);
  }
  return { success: true, postUrn: data.postUrn || '' };
}
