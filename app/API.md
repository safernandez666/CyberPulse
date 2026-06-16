# CyberPulse API v2.0

API REST para agregación de noticias de ciberseguridad y generación de posts para LinkedIn.

## Base URL

```
http://localhost:3001
```

## Autenticación (opcional)

```bash
# Via header
X-API-Key: tu-api-key

# Via query param
?apiKey=tu-api-key
```

Activala con la variable de entorno `CYBERPULSE_API_KEY`.

---

## Endpoints

### `GET /api/news`
Lista las últimas noticias.

**Query params:**
- `sources` — Fuentes separadas por coma (ej: `The Hacker News,BleepingComputer`)
- `limit` — Máximo de resultados (default: 50, max: 100)
- `search` — Búsqueda por título o contenido

**Ejemplo:**
```bash
curl http://localhost:3001/api/news?limit=10&search=ransomware
```

**Respuesta:**
```json
{
  "articles": [
    {
      "id": "12345",
      "title": "Critical Windows Netlogon RCE Flaw...",
      "summary": "Belgium's Centre for Cybersecurity warns...",
      "source": "BleepingComputer",
      "severity": "critical",
      "category": "VULNERABILITY",
      "publishedAt": "15 MIN AGO",
      "publishDate": "Jun 9, 2025",
      "readTime": "6 MIN READ",
      "url": "https://www.bleepingcomputer.com/news/security/..."
    }
  ],
  "count": 10
}
```

---

### `GET /api/news/:id`
Obtiene una noticia específica.

---

### `GET /api/sources`
Lista todas las fuentes RSS configuradas.

---

### `POST /api/generate`
Genera un post de LinkedIn a partir de una noticia.

**Body:**
```json
{
  "articleId": "12345",
  "title": "Critical Windows Netlogon RCE Flaw...",
  "summary": "Belgium's Centre for Cybersecurity warns...",
  "source": "BleepingComputer",
  "severity": "critical",
  "url": "https://www.bleepingcomputer.com/news/security/...",
  "tone": "Professional",
  "format": "News Analysis",
  "length": "medium",
  "language": "en"
}
```

**Opciones:**

| Campo | Valores | Default |
|-------|---------|---------|
| `tone` | Professional, Casual, Urgent, Educational, Thought Leadership | Professional |
| `format` | News Analysis, Quick Summary, Thread, Contrarian, Storytelling, Daily Digest | News Analysis |
| `length` | short, medium, long | medium |
| `language` | en, es | en |

**Respuesta:**
```json
{
  "post": "🔴 **NEWS ANALYSIS**\n\n**A significant development in vulnerability**...",
  "html": "🔴 <strong>NEWS ANALYSIS</strong>...",
  "metadata": {
    "title": "Critical Windows Netlogon RCE Flaw...",
    "source": "BleepingComputer",
    "url": "https://...",
    "tone": "Professional",
    "format": "News Analysis",
    "length": "medium",
    "language": "en",
    "wordCount": 245,
    "hashtags": ["#cybersecurity", "#infosec", "#vulnerability", "#dailynews"]
  }
}
```

---

### `POST /api/digest`
Genera un Daily Digest con múltiples noticias.

**Body:**
```json
{
  "articles": [
    { "title": "Noticia 1", "summary": "Resumen 1", "severity": "critical", "url": "https://..." },
    { "title": "Noticia 2", "summary": "Resumen 2", "severity": "high", "url": "https://..." }
  ],
  "tone": "Professional",
  "length": "medium",
  "language": "en"
}
```

---

### `POST /api/mcp`
**MCP (Model Context Protocol)** — Punto único para agentes de IA.

**Body:**
```json
{
  "action": "list_news",
  "params": { "limit": 10 }
}
```

**Acciones disponibles:**

| Action | Params | Descripción |
|--------|--------|-------------|
| `list_news` | `{ limit: 10 }` | Lista noticias |
| `get_article` | `{ id: "12345" }` | Obtiene una noticia |
| `generate_post` | `{ articleId, title, summary, ... }` | Genera post |
| `generate_digest` | `{ articles[], tone, length, language }` | Genera digest |
| `scrape` | — | Fuerza scraping |
| `list_sources` | — | Lista fuentes |

---

### `POST /api/scrape`
Fuerza un scraping manual de todas las fuentes RSS.

**Respuesta:**
```json
{
  "success": true,
  "total": 47,
  "errors": []
}
```

---

### `GET /api/stats`
Estadísticas del sistema.

**Respuesta:**
```json
{
  "totalArticles": 147,
  "totalSources": 35,
  "lastFetch": "2025-06-09T14:30:00.000Z",
  "recentFetches": [...]
}
```

---

## Ejemplo completo: Hermes / OpenClaw

```python
import requests

BASE = "http://localhost:3001"

# 1. Obtener noticias
news = requests.get(f"{BASE}/api/news?limit=5").json()
article = news["articles"][0]

# 2. Generar post
post = requests.post(f"{BASE}/api/generate", json={
    "articleId": article["id"],
    "title": article["title"],
    "summary": article["summary"],
    "source": article["source"],
    "severity": article["severity"],
    "url": article["url"],
    "tone": "Professional",
    "format": "News Analysis",
    "length": "medium",
    "language": "en",
}).json()

print(post["post"])
# Copiar y pegar en LinkedIn con negritas!
```

## MCP Server Config (para Claude/Cursor)

```json
{
  "mcpServers": {
    "cyberpulse": {
      "command": "node",
      "args": ["/path/to/cyberpulse/server/index.ts"],
      "env": {
        "CYBERPULSE_API_KEY": "your-key-here"
      }
    }
  }
}
```

O usar el endpoint HTTP:
```json
{
  "mcpServers": {
    "cyberpulse": {
      "url": "http://localhost:3001/api/mcp"
    }
  }
}
```
