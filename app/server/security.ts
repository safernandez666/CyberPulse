/* Security helpers kept out of index.ts so they can be exercised without
   booting the server, a database and the cron schedule. */

/* `error` reaches the OAuth result page straight from LinkedIn's
   `error_description` redirect parameter and `name` from the userinfo
   response, so neither can be interpolated into HTML as-is. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* PORT is what the server binds to, not necessarily what the browser dialled:
   a Docker port mapping or a reverse proxy changes it. Comparing the Origin
   against the request's own Host is what actually identifies a same-origin
   request, and `<script type="module">` is fetched with CORS, so getting this
   wrong 403s the app's own JavaScript. */
export function isSameOrigin(origin: string, host: string | undefined): boolean {
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* `baseUrl` arrives from the browser, so it is attacker-controlled whenever
   /api/generate-ai is reachable. Without a host allowlist the server can be
   made to fetch arbitrary internal URLs and hand the response body back. */
export const DEFAULT_AI_HOSTS = [
  'api.openai.com',
  'api.groq.com',
  'api.anthropic.com',
  'api.mistral.ai',
  'api.together.xyz',
  'api.deepseek.com',
  'openrouter.ai',
  'generativelanguage.googleapis.com',
];

export function buildAiHostAllowlist(extraHosts: string | undefined): Set<string> {
  const extra = (extraHosts || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_AI_HOSTS, ...extra]);
}

export type ResolvedBaseUrl = { url: string } | { error: string };

export function resolveAiBaseUrl(raw: unknown, allowlist: Set<string>): ResolvedBaseUrl {
  const candidate = (raw && String(raw).trim()) || 'https://api.openai.com/v1';

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: 'baseUrl must be a valid absolute URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { error: 'baseUrl must use https' };
  }

  if (!allowlist.has(parsed.hostname.toLowerCase())) {
    return {
      error: `Provider host "${parsed.hostname}" is not allowed. Add it to CYBERPULSE_AI_HOSTS to permit it.`,
    };
  }

  return { url: `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}` };
}
