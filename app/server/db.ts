import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use /app/data in Docker, fallback to cwd locally
const DATA_DIR = process.env.NODE_ENV === 'production'
  ? '/app/data'
  : process.cwd();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'cyberpulse.db');
let db: Database.Database | null = null;

const CURRENT_SCHEMA_VERSION = 6;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      source TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'GENERAL',
      published_at TEXT,
      publish_date TEXT,
      read_time TEXT,
      url TEXT NOT NULL UNIQUE,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      rss_url TEXT NOT NULL,
      category TEXT DEFAULT 'GENERAL',
      active INTEGER DEFAULT 1,
      article_count INTEGER DEFAULT 0,
      last_fetch DATETIME,
      custom INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
    CREATE INDEX IF NOT EXISTS idx_articles_fetched ON articles(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
    CREATE INDEX IF NOT EXISTS idx_articles_severity ON articles(severity);

    CREATE TABLE IF NOT EXISTS fetch_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      articles_found INTEGER DEFAULT 0,
      articles_new INTEGER DEFAULT 0,
      error TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schema_metadata (
      key TEXT PRIMARY KEY,
      value INTEGER
    );

    CREATE TABLE IF NOT EXISTS linkedin_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      client_secret TEXT NOT NULL,
      redirect_uri TEXT DEFAULT 'http://localhost:3001/api/linkedin/callback',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linkedin_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id TEXT,
      person_urn TEXT,
      access_token TEXT NOT NULL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linkedin_oauth_states (
      state TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  /* One-time migrations */
  const versionRow = db.prepare(`SELECT value FROM schema_metadata WHERE key = 'version'`).get() as { value: number } | undefined;
  const currentVersion = versionRow?.value || 0;

  if (currentVersion < 4) {
    /* v4: expanded RSS source list and normalized timestamps. Clear old
       articles so the next scrape populates fresh data from all sources. */
    db.exec(`DELETE FROM articles`);
    db.prepare(`INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('version', ?)`).run(CURRENT_SCHEMA_VERSION);
    console.log('[DB] Migrated to schema v4: cleared articles for fresh re-scrape');
  }

  if (currentVersion < 5) {
    /* v5: add custom flag to sources table */
    const columnInfo = db.prepare(`PRAGMA table_info(sources)`).all() as Array<{ name: string }>;
    const hasCustom = columnInfo.some((col) => col.name === 'custom');
    if (!hasCustom) {
      db.exec(`ALTER TABLE sources ADD COLUMN custom INTEGER DEFAULT 0`);
    }
    db.prepare(`UPDATE sources SET custom = 0 WHERE custom IS NULL`).run();
    db.prepare(`INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('version', ?)`).run(5);
    console.log('[DB] Migrated to schema v5: added custom column to sources');
  }

  if (currentVersion < 6) {
    /* v6: add LinkedIn config and token tables */
    db.exec(`
      CREATE TABLE IF NOT EXISTS linkedin_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        redirect_uri TEXT DEFAULT 'http://localhost:3001/api/linkedin/callback',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS linkedin_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id TEXT,
        person_urn TEXT,
        access_token TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS linkedin_oauth_states (
        state TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.prepare(`INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('version', ?)`).run(CURRENT_SCHEMA_VERSION);
    console.log('[DB] Migrated to schema v6: added LinkedIn tables');
  }

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
