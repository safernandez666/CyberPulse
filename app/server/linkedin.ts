import { getDb } from './db';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_UGC_POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts';

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface StoredConfigRow {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface StoredTokenRow {
  person_id: string;
  person_urn: string;
  access_token: string;
  expires_at: string;
}

function envConfig(): Partial<LinkedInConfig> {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI,
  };
}

export function hasLinkedInConfig(): boolean {
  const env = envConfig();
  if (env.clientId && env.clientSecret) return true;

  const db = getDb();
  const row = db.prepare(`SELECT 1 FROM linkedin_config LIMIT 1`).get();
  return !!row;
}

export function getLinkedInConfig(): LinkedInConfig | null {
  const env = envConfig();
  if (env.clientId && env.clientSecret) {
    return {
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      redirectUri: env.redirectUri || 'http://localhost:3001/api/linkedin/callback',
    };
  }

  const db = getDb();
  const row = db.prepare(`SELECT client_id, client_secret, redirect_uri FROM linkedin_config LIMIT 1`).get() as StoredConfigRow | undefined;
  if (!row) return null;

  return {
    clientId: row.client_id,
    clientSecret: row.client_secret,
    redirectUri: row.redirect_uri || 'http://localhost:3001/api/linkedin/callback',
  };
}

export function saveLinkedInConfig(config: LinkedInConfig): void {
  const db = getDb();
  db.prepare(`DELETE FROM linkedin_config`).run();
  db.prepare(`
    INSERT INTO linkedin_config (client_id, client_secret, redirect_uri, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(config.clientId, config.clientSecret, config.redirectUri);
}

export function deleteLinkedInConfig(): void {
  const db = getDb();
  db.prepare(`DELETE FROM linkedin_config`).run();
  db.prepare(`DELETE FROM linkedin_tokens`).run();
}

export function getStoredToken(): StoredTokenRow | null {
  const db = getDb();
  const row = db.prepare(`SELECT person_id, person_urn, access_token, expires_at FROM linkedin_tokens LIMIT 1`).get() as StoredTokenRow | undefined;
  if (!row) return null;

  // Treat tokens nearing expiry (within 5 minutes) as invalid
  if (row.expires_at && new Date(row.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    return null;
  }

  return row;
}

export function saveToken(accessToken: string, expiresIn: number, personId: string, personUrn: string): void {
  const db = getDb();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  db.prepare(`DELETE FROM linkedin_tokens`).run();
  db.prepare(`
    INSERT INTO linkedin_tokens (access_token, expires_at, person_id, person_urn, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(accessToken, expiresAt, personId, personUrn);
}

export function deleteToken(): void {
  const db = getDb();
  db.prepare(`DELETE FROM linkedin_tokens`).run();
}

export function generateState(): string {
  const state = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const db = getDb();
  // clean old states
  db.prepare(`DELETE FROM linkedin_oauth_states WHERE created_at < datetime('now', '-10 minutes')`).run();
  db.prepare(`INSERT INTO linkedin_oauth_states (state) VALUES (?)`).run(state);
  return state;
}

export function validateState(state: string): boolean {
  const db = getDb();
  const row = db.prepare(`SELECT 1 FROM linkedin_oauth_states WHERE state = ? AND created_at > datetime('now', '-10 minutes')`).get(state);
  if (row) {
    db.prepare(`DELETE FROM linkedin_oauth_states WHERE state = ?`).run(state);
    return true;
  }
  return false;
}

export function getAuthorizationUrl(): string {
  const config = getLinkedInConfig();
  if (!config) throw new Error('LinkedIn app is not configured');

  const state = generateState();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: 'openid profile w_member_social',
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const config = getLinkedInConfig();
  if (!config) throw new Error('LinkedIn app is not configured');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

export interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

export async function getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn userinfo failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<LinkedInUserInfo>;
}

export async function publishPost(text: string, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC', accessToken?: string, personUrn?: string): Promise<string> {
  const token = accessToken && personUrn
    ? { access_token: accessToken, person_urn: personUrn }
    : getStoredToken();

  if (!token) throw new Error('LinkedIn account is not connected');

  const body = {
    author: token.person_urn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const res = await fetch(LINKEDIN_UGC_POSTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LinkedIn post failed (${res.status}): ${errText}`);
  }

  const location = res.headers.get('x-restli-id') || res.headers.get('location') || '';
  return location;
}
