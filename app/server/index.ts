import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { getDb } from './db';
import { seedSources } from './seeds';
import { scrapeAll, cleanOldArticles, timeAgo, publishDate } from './scraper';
import { generatePost, generateDailyDigest } from './postGenerator';
import type { GeneratePostRequest } from './postGenerator';
import {
  hasLinkedInConfig,
  getLinkedInConfig,
  saveLinkedInConfig,
  deleteLinkedInConfig,
  getStoredToken,
  deleteToken,
  getAuthorizationUrl,
  validateState,
  exchangeCodeForToken,
  getUserInfo,
  saveToken,
  publishPost,
} from './linkedin';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.CYBERPULSE_API_KEY || null;

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

/* Optional API Key auth */
function checkApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) return next(); // no key configured = open
  const provided = req.headers['x-api-key'] || req.query.apiKey;
  if (provided !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key. Use header X-API-Key or query param apiKey.' });
  }
  next();
}

/* ------------------------------------------------------------------ */
/*  Serve frontend                                                     */
/* ------------------------------------------------------------------ */

const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* ------------------------------------------------------------------ */
/*  Health / API info                                                  */
/* ------------------------------------------------------------------ */

app.get('/api', (req, res) => {
  res.json({
    name: 'CyberPulse API',
    version: '2.0.0',
    description: 'Cybersecurity news aggregator + LinkedIn post generator',
    endpoints: {
      news: '/api/news',
      sources: {
        list: 'GET /api/sources',
        create: 'POST /api/sources',
        update: 'PATCH /api/sources/:id',
        delete: 'DELETE /api/sources/:id',
      },
      stats: '/api/stats',
      generate: '/api/generate',
      generateAi: '/api/generate-ai',
      digest: '/api/digest',
      scrape: '/api/scrape',
      health: '/api/health',
      mcp: '/api/mcp',
      linkedin: {
        config: 'GET/POST/DELETE /api/linkedin/config',
        authUrl: 'GET /api/linkedin/auth-url',
        callback: 'GET /api/linkedin/callback',
        status: 'GET /api/linkedin/status',
        disconnect: 'POST /api/linkedin/disconnect',
        post: 'POST /api/linkedin/post',
      },
    },
  });
});

app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const articleCount = db.prepare(`SELECT COUNT(*) as c FROM articles`).get() as { c: number };
    res.json({ status: 'ok', articles: articleCount.c });
  } catch {
    res.status(500).json({ status: 'error' });
  }
});

/* ------------------------------------------------------------------ */
/*  News                                                               */
/* ------------------------------------------------------------------ */

app.get('/api/news', (req, res) => {
  try {
    const db = getDb();
    const sources = req.query.sources as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const search = req.query.search as string | undefined;

    let query = `SELECT * FROM articles`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (sources) {
      const sourceList = sources.split(',');
      conditions.push(`source IN (${sourceList.map(() => '?').join(',')})`);
      params.push(...sourceList);
    }

    if (search) {
      conditions.push(`(title LIKE ? OR summary LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY published_at DESC LIMIT ${limit}`;

    const rows = (db.prepare(query).all(...params) as any[]).map((row: any) => ({
      id: row.id?.toString() || `article-${row.url}`,
      title: row.title,
      summary: row.summary,
      source: row.source,
      severity: row.severity,
      category: row.category,
      publishedAt: timeAgo(row.published_at),
      publishDate: publishDate(row.published_at),
      readTime: row.read_time,
      url: row.url,
    }));

    res.json({ articles: rows, count: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single article
app.get('/api/news/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM articles WHERE id = ?`).get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: 'Article not found' });

    res.json({
      id: row.id?.toString(),
      title: row.title,
      summary: row.summary,
      source: row.source,
      severity: row.severity,
      category: row.category,
      publishedAt: timeAgo(row.published_at),
      publishDate: publishDate(row.published_at),
      readTime: row.read_time,
      url: row.url,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Sources                                                            */
/* ------------------------------------------------------------------ */

app.get('/api/sources', (req, res) => {
  try {
    const db = getDb();
    const rows = (db.prepare(`SELECT * FROM sources ORDER BY name`).all() as any[]).map((row: any) => ({
      id: row.id?.toString(),
      name: row.name,
      category: row.category,
      active: Boolean(row.active),
      custom: Boolean(row.custom),
      count: row.article_count,
      lastFetch: row.last_fetch,
    }));

    res.json({ sources: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sources', checkApiKey, (req, res) => {
  try {
    const { name, rssUrl, category } = req.body;
    if (
      typeof name !== 'string' || name.trim() === '' ||
      typeof rssUrl !== 'string' || rssUrl.trim() === '' ||
      typeof category !== 'string' || category.trim() === ''
    ) {
      return res.status(400).json({ error: 'name, rssUrl, and category are required' });
    }

    const db = getDb();
    try {
      const result = db.prepare(`INSERT INTO sources (name, rss_url, category, active, custom) VALUES (?, ?, ?, 1, 1)`).run(name.trim(), rssUrl.trim(), category.trim());
      const row = db.prepare(`SELECT id, name, rss_url as rssUrl, category, active, custom FROM sources WHERE id = ?`).get(result.lastInsertRowid) as any;
      res.status(201).json({
        source: {
          id: row.id?.toString(),
          name: row.name,
          rssUrl: row.rssUrl,
          category: row.category,
          active: Boolean(row.active),
          custom: Boolean(row.custom),
        },
      });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Source already exists' });
      }
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', checkApiKey, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM sources WHERE id = ? AND custom = 1`).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Source not found or not removable' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/sources/:id', checkApiKey, (req, res) => {
  try {
    const { active } = req.body;
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }
    const db = getDb();
    db.prepare(`UPDATE sources SET active = ? WHERE id = ?`).run(active ? 1 : 0, req.params.id);
    const row = db.prepare(`SELECT id, name, rss_url as rssUrl, category, active, custom FROM sources WHERE id = ?`).get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({
      source: {
        id: row.id?.toString(),
        name: row.name,
        rssUrl: row.rssUrl,
        category: row.category,
        active: Boolean(row.active),
        custom: Boolean(row.custom),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Post Generation                                                    */
/* ------------------------------------------------------------------ */

app.post('/api/generate', checkApiKey, (req, res) => {
  try {
    const body = req.body as GeneratePostRequest;
    if (!body.articleId || !body.title || !body.summary) {
      return res.status(400).json({ error: 'Missing required fields: articleId, title, summary' });
    }

    const result = generatePost(body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Daily Digest generation
app.post('/api/digest', checkApiKey, (req, res) => {
  try {
    const { articles, tone, length, language } = req.body;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid articles array' });
    }

    const result = generateDailyDigest(articles, tone || 'Professional', length || 'medium', language || 'en');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  AI-powered post generation                                         */
/* ------------------------------------------------------------------ */

interface GenerateAiRequest {
  title: string;
  summary: string;
  source: string;
  category: string;
  severity: string;
  url: string;
  tone?: string;
  format?: string;
  length?: string;
  language?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

app.post('/api/generate-ai', async (req, res) => {
  try {
    const body = req.body as GenerateAiRequest;
    const { title, summary, source, category, severity, url, tone, format, length, language, apiKey, model, baseUrl } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(503).json({ error: 'OpenAI API key not configured' });
    }

    const resolvedBaseUrl = ((baseUrl && String(baseUrl)) || 'https://api.openai.com/v1').replace(/\/$/, '');
    const resolvedModel = model || 'gpt-4o-mini';

    const langLabel =
      language === 'es' ? 'Spanish' : language === 'en' ? 'English' : language || 'English';

    const messages = [
      {
        role: 'system' as const,
        content:
          'You are an expert cybersecurity content strategist. Write compelling, professional LinkedIn posts for a cybersecurity audience.',
      },
      {
        role: 'user' as const,
        content: `Write a LinkedIn post based on the following cybersecurity article.

Article title: ${title}
Article summary: ${summary}
Source: ${source}
Category: ${category}
Severity: ${severity}
URL: ${url}

Requirements:
- Tone: ${tone || 'Professional'}
- Format/angle: ${format || 'News Analysis'}
- Length: ${length || 'medium'}
- Language: ${langLabel}
- Include relevant LinkedIn hashtags.
- End the post with a source link pointing to ${url}.

Return only the post text, with no extra commentary.`,
      },
    ];

    const response = await fetch(`${resolvedBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => `OpenAI error ${response.status}`);
      return res.status(response.status >= 500 ? 503 : 500).json({ error: errText.slice(0, 500) });
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      return res.status(503).json({ error: 'Unexpected AI response format' });
    }

    res.json({ post: content.trim() });
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'AI generation failed' });
  }
});

/* ------------------------------------------------------------------ */
/*  LinkedIn integration                                               */
/* ------------------------------------------------------------------ */

app.get('/api/linkedin/config', (req, res) => {
  try {
    const configured = hasLinkedInConfig();
    res.json({ configured });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/linkedin/config', checkApiKey, (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'clientId and clientSecret are required' });
    }

    saveLinkedInConfig({
      clientId: String(clientId).trim(),
      clientSecret: String(clientSecret).trim(),
      redirectUri: String(redirectUri || 'http://localhost:3001/api/linkedin/callback').trim(),
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/linkedin/config', checkApiKey, (req, res) => {
  try {
    deleteLinkedInConfig();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/linkedin/auth-url', (req, res) => {
  try {
    const url = getAuthorizationUrl();
    res.json({ url });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/linkedin/callback', async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;
    const errorDescription = req.query.error_description as string | undefined;

    if (error) {
      return res.status(400).send(renderOAuthResult({ success: false, error: errorDescription || error }));
    }

    if (!code || !state) {
      return res.status(400).send(renderOAuthResult({ success: false, error: 'Missing code or state' }));
    }

    if (!validateState(state)) {
      return res.status(400).send(renderOAuthResult({ success: false, error: 'Invalid or expired state' }));
    }

    const tokenData = await exchangeCodeForToken(code);
    const userInfo = await getUserInfo(tokenData.access_token);
    const personId = userInfo.sub;
    const personUrn = `urn:li:person:${personId}`;

    saveToken(tokenData.access_token, tokenData.expires_in, personId, personUrn);

    res.status(200).send(renderOAuthResult({ success: true, name: userInfo.name }));
  } catch (err: any) {
    res.status(500).send(renderOAuthResult({ success: false, error: err.message }));
  }
});

app.get('/api/linkedin/status', (req, res) => {
  try {
    const configured = hasLinkedInConfig();
    const token = getStoredToken();
    res.json({
      configured,
      connected: !!token,
      personUrn: token?.person_urn || null,
      personId: token?.person_id || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/linkedin/disconnect', (req, res) => {
  try {
    deleteToken();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/linkedin/post', async (req, res) => {
  try {
    const { text, visibility } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const vis = visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC';
    const postUrn = await publishPost(text, vis);

    res.json({ success: true, postUrn });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function renderOAuthResult({ success, error, name }: { success: boolean; error?: string; name?: string }) {
  const title = success ? 'LinkedIn Connected' : 'LinkedIn Connection Failed';
  const message = success
    ? `Connected as ${name || 'LinkedIn user'}. You can close this window.`
    : `Error: ${error || 'Unknown error'}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .box { text-align: center; max-width: 420px; padding: 2rem; border: 1px solid #333; border-radius: 12px; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: ${success ? '#CCFF00' : '#ef4444'}; }
  p { color: #a3a3a3; }
</style>
</head>
<body>
  <div class="box">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'linkedin-oauth', success: ${success} }, '*');
    }
    setTimeout(() => window.close(), 2500);
  </script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  MCP (Model Context Protocol) — Single endpoint for AI agents       */
/* ------------------------------------------------------------------ */

app.post('/api/mcp', checkApiKey, async (req, res) => {
  try {
    const { action, params } = req.body;

    switch (action) {
      case 'list_news': {
        const db = getDb();
        const limit = params?.limit || 10;
        const rows = (db.prepare(`SELECT * FROM articles ORDER BY fetched_at DESC LIMIT ?`).all(limit) as any[])
          .map((row: any) => ({
            id: row.id?.toString(),
            title: row.title,
            source: row.source,
            severity: row.severity,
            publishedAt: timeAgo(row.published_at),
            url: row.url,
          }));
        return res.json({ result: rows });
      }

      case 'get_article': {
        const db = getDb();
        const row = db.prepare(`SELECT * FROM articles WHERE id = ?`).get(params?.id) as any;
        if (!row) return res.json({ result: null });
        return res.json({
          result: {
            id: row.id?.toString(),
            title: row.title,
            summary: row.summary,
            source: row.source,
            severity: row.severity,
            publishedAt: timeAgo(row.published_at),
            url: row.url,
          },
        });
      }

      case 'generate_post': {
        const result = generatePost(params as GeneratePostRequest);
        return res.json({ result });
      }

      case 'generate_digest': {
        const { articles: arts, tone, length, language } = params;
        const result = generateDailyDigest(arts, tone, length, language);
        return res.json({ result });
      }

      case 'scrape': {
        const result = await scrapeAll();
        return res.json({ result });
      }

      case 'list_sources': {
        const db = getDb();
        const rows = (db.prepare(`SELECT * FROM sources ORDER BY name`).all() as any[])
          .map((row: any) => ({
            id: row.id?.toString(),
            name: row.name,
            category: row.category,
            active: Boolean(row.active),
          }));
        return res.json({ result: rows });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}`, available_actions: [
          'list_news', 'get_article', 'generate_post', 'generate_digest', 'scrape', 'list_sources',
        ]});
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Scraping                                                           */
/* ------------------------------------------------------------------ */

let isScraping = false;
let scrapeStartedAt: string | null = null;
let lastScrapeResult: { totalNew: number; errors: string[]; finishedAt: string | null } = {
  totalNew: 0,
  errors: [],
  finishedAt: null,
};

async function runScrape() {
  if (isScraping) {
    console.log('[SCRAPER] Scrape already in progress, skipping');
    return;
  }
  isScraping = true;
  scrapeStartedAt = new Date().toISOString();
  try {
    const result = await scrapeAll();
    console.log('[SCRAPER] Background scrape done:', result);
    lastScrapeResult = {
      totalNew: result.total,
      errors: result.errors,
      finishedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[SCRAPER] Background scrape failed:', err);
    lastScrapeResult = {
      totalNew: 0,
      errors: [err?.message || 'Unknown error'],
      finishedAt: new Date().toISOString(),
    };
  } finally {
    isScraping = false;
  }
}

app.get('/api/scrape/status', (req, res) => {
  try {
    const db = getDb();
    const lastFetch = db.prepare(`SELECT MAX(fetched_at) as last FROM fetch_log`).get() as { last: string };
    res.json({
      scraping: isScraping,
      startedAt: scrapeStartedAt,
      lastFetch: lastFetch.last || null,
      lastResult: lastScrapeResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scrape', checkApiKey, async (req, res) => {
  try {
    // Start scraping in the background and respond immediately
    runScrape().catch((err) => console.error('[SCRAPER] Failed to start scrape:', err));
    res.json({ success: true, message: 'Scraping started' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const db = getDb();
    const totalArticles = db.prepare(`SELECT COUNT(*) as c FROM articles`).get() as { c: number };
    const totalSources = db.prepare(`SELECT COUNT(*) as c FROM sources WHERE active = 1`).get() as { c: number };
    const lastFetch = db.prepare(`SELECT MAX(fetched_at) as last FROM fetch_log`).get() as { last: string };
    const recentFetches = db.prepare(`SELECT source, articles_new, error, fetched_at FROM fetch_log ORDER BY fetched_at DESC LIMIT 10`).all();

    res.json({
      totalArticles: totalArticles.c || 0,
      totalSources: totalSources.c || 0,
      lastFetch: lastFetch.last || null,
      recentFetches,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  SPA fallback                                                       */
/* ------------------------------------------------------------------ */

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* ------------------------------------------------------------------ */
/*  Startup                                                            */
/* ------------------------------------------------------------------ */

async function start() {
  getDb();
  seedSources();

  // Run the initial scrape in the background so the server starts immediately
  // and Docker healthchecks can pass while feeds are still being fetched.
  console.log('[SERVER] Running initial RSS scrape in background...');
  runScrape()
    .then(() => cleanOldArticles())
    .catch((err) => console.error('[SCRAPER] Initial scrape failed:', err));

  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Scheduled scrape at', new Date().toISOString());
    await runScrape();
    cleanOldArticles();
  });

  cron.schedule('0 2 * * *', cleanOldArticles);

  app.listen(PORT, () => {
    console.log(`[SERVER] CyberPulse backend on port ${PORT}`);
    console.log(`[SERVER] API: http://localhost:${PORT}/api/news`);
    console.log(`[SERVER] API Key: ${API_KEY ? 'enabled' : 'disabled (set CYBERPULSE_API_KEY env var to enable)'}`);
    console.log(`[SERVER] MCP Endpoint: http://localhost:${PORT}/api/mcp`);
  });
}

start().catch((err) => {
  console.error('[SERVER] Startup failed:', err);
  process.exit(1);
});
