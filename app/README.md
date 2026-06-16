# CyberPulse - LinkedIn Content Agent for Cybersecurity

> Agregador de noticias de ciberseguridad con generador de posts para LinkedIn. Consume feeds RSS de 35 fuentes, genera posts con negritas y emojis, y expone una API REST/MCP para integracion con agentes de IA como Hermes y OpenClaw.

---

## Tabla de Contenidos

- [Features](#features)
- [Stack Tecnologico](#stack-tecnologico)
- [Docker - Puesta en marcha](#docker---puesta-en-marcha)
- [Uso sin Docker](#uso-sin-docker)
- [API Key](#api-key)
- [Endpoints API](#endpoints-api)
- [Endpoint MCP](#endpoint-mcp)
- [Logs](#logs)
- [Agregar una nueva fuente RSS](#agregar-una-nueva-fuente-rss)
- [Integracion con Hermes / OpenClaw](#integracion-con-hermes--openclaw)
- [Variables de entorno](#variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## Features

- **35 fuentes RSS** de ciberseguridad (ingles + espanol)
- **Noticias en tiempo real** - scraping automatico cada 15 minutos
- **Generador de posts** para LinkedIn con 5 tonos, 6 formatos, EN/ES
- **Posts con negritas reales** - se copian como HTML para LinkedIn
- **Preview de LinkedIn** - como se vera el post antes de publicar
- **Daily Digest** - resumen multi-articulo con links reales
- **API REST completa** - para integracion con cualquier herramienta
- **Endpoint MCP** - Model Context Protocol para agentes de IA
- **Dockerizado** - deploy en 1 comando
- **SQLite persistente** - base de datos local

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Scraper | rss-parser + cron |
| Generador de posts | Templates TypeScript personalizados |
| Deploy | Docker + Docker Compose |

---

## Docker - Puesta en marcha

### Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

### 1. Clonar y levantar

```bash
git clone <repo-url> cyberpulse
cd cyberpulse
docker compose up -d
```

CyberPulse estara disponible en http://localhost:3001

### 2. Comandos utiles

```bash
# Ver estado
docker compose ps

# Ver logs (todos)
docker compose logs -f

# Ver logs solo del scraper
# Los logs de scraping se ven con:
docker compose logs -f | grep SCRAPER

# Ver logs con timestamp
docker compose logs -f --timestamps

# Ver ultimos 100 logs
docker compose logs --tail=100

# Restart
docker compose restart

# Detener
docker compose down

# Detener y borrar datos (cuidado!)
docker compose down -v

# Reconstruir despues de cambios
docker compose up -d --build
```

### 3. Volumen persistente

La base de datos SQLite se guarda en `./data/cyberpulse.db` (volumen Docker). Los datos sobreviven reinicios.

---

## Uso sin Docker

### Requisitos

- Node.js 20+
- npm 10+

### Pasos

```bash
# Instalar dependencias
npm install

# Correr frontend + backend juntos
npm run dev

# O solo backend
npm run server

# Build para produccion
npm run build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## API Key

La autenticacion es **opcional**. Si no configuras API key, el endpoint es abierto.

### Configurar API Key

#### Con Docker:

```bash
# En docker-compose.yml
docker compose down
CYBERPULSE_API_KEY=tu-clave-secreta docker compose up -d
```

O editando `.env`:
```env
CYBERPULSE_API_KEY=tu-clave-secreta
```

#### Sin Docker:

```bash
export CYBERPULSE_API_KEY="tu-clave-secreta"
npm run server
```

### Usar API Key

```bash
# Via header
curl -H "X-API-Key: tu-clave-secreta" http://localhost:3001/api/news

# Via query param
curl http://localhost:3001/api/news?apiKey=tu-clave-secreta
```

---

## Endpoints API

### `GET /` - Info

```bash
curl http://localhost:3001/
```

### `GET /api/health` - Health check

```bash
curl http://localhost:3001/api/health
# {"status":"ok","articles":147}
```

### `GET /api/news` - Listar noticias

**Query params:**
- `sources` - Fuentes separadas por coma
- `limit` - Max resultados (default: 50, max: 100)
- `search` - Busqueda por titulo/contenido

```bash
# Ultimas 10 noticias
curl http://localhost:3001/api/news?limit=10

# Filtrar por fuente
curl "http://localhost:3001/api/news?sources=The%20Hacker%20News,BleepingComputer"

# Buscar
curl "http://localhost:3001/api/news?search=ransomware&limit=5"
```

**Respuesta:**
```json
{
  "articles": [
    {
      "id": "12345",
      "title": "Critical Windows Netlogon RCE Flaw Now Exploited in Attacks",
      "summary": "Belgium's Centre for Cybersecurity warns that CVE-2026-41089...",
      "source": "BleepingComputer",
      "severity": "critical",
      "category": "VULNERABILITY",
      "publishedAt": "15 MIN AGO",
      "publishDate": "Jun 9, 2025",
      "readTime": "6 MIN READ",
      "url": "https://www.bleepingcomputer.com/news/security/..."
    }
  ],
  "count": 1
}
```

### `GET /api/news/:id` - Una noticia

```bash
curl http://localhost:3001/api/news/12345
```

### `GET /api/sources` - Fuentes RSS

```bash
curl http://localhost:3001/api/sources
```

**Respuesta:**
```json
{
  "sources": [
    {
      "id": "1",
      "name": "The Hacker News",
      "category": "THREAT INTEL",
      "active": true,
      "count": 142,
      "lastFetch": "2025-06-09T14:30:00.000Z"
    }
  ]
}
```

### `POST /api/generate` - Generar post para LinkedIn

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

| Campo | Opciones | Default |
|-------|----------|---------|
| `tone` | Professional, Casual, Urgent, Educational, Thought Leadership | Professional |
| `format` | News Analysis, Quick Summary, Thread, Contrarian, Storytelling, Daily Digest | News Analysis |
| `length` | short, medium, long | medium |
| `language` | en, es | en |

**Respuesta:**
```json
{
  "post": "🔴 **NEWS ANALYSIS**\n\n**A significant development in vulnerability**...",
  "html": "🔴 <strong>NEWS ANALYSIS</strong><br/><br/><strong>A significant development...",
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

### `POST /api/digest` - Daily Digest

```bash
curl -X POST http://localhost:3001/api/digest \
  -H "Content-Type: application/json" \
  -d '{
    "articles": [
      {"title": "Noticia 1", "summary": "Resumen 1", "severity": "critical", "url": "https://..."},
      {"title": "Noticia 2", "summary": "Resumen 2", "severity": "high", "url": "https://..."}
    ],
    "tone": "Professional",
    "length": "medium",
    "language": "en"
  }'
```

### `GET /api/stats` - Estadisticas

```bash
curl http://localhost:3001/api/stats
```

### `POST /api/scrape` - Forzar scraping

```bash
curl -X POST http://localhost:3001/api/scrape
```

---

## Endpoint MCP

El endpoint MCP (`POST /api/mcp`) es un punto unico para agentes de IA. Acepta una accion y parametros.

```bash
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_news",
    "params": {"limit": 5}
  }'
```

### Acciones disponibles

| Accion | Parametros | Descripcion |
|--------|------------|-------------|
| `list_news` | `{ limit: 10 }` | Listar noticias |
| `get_article` | `{ id: "12345" }` | Obtener noticia |
| `generate_post` | `{ articleId, title, summary, source, severity, url, tone, format, length, language }` | Generar post |
| `generate_digest` | `{ articles[], tone, length, language }` | Generar digest |
| `scrape` | - | Forzar scraping |
| `list_sources` | - | Listar fuentes |

---

## Logs

### Ver logs de noticias (scraping)

Los logs muestran cuando se scrapean las fuentes RSS y cuantas noticias nuevas se encuentran.

```bash
# Todos los logs
docker compose logs -f

# Solo logs de scraping
docker compose logs -f | grep SCRAPER

# Ejemplo de salida:
# [SCRAPER] The Hacker News: 10 new / 10 found
# [SCRAPER] BleepingComputer: 8 new / 10 found
# [SCRAPER] Krebs on Security: 0 new / 10 found (source may be down)
# [SCRAPER] Done. 35 new articles. 2 errors.

# Ver logs con timestamps
docker compose logs -f --timestamps

# Ver ultimas 50 lineas
docker compose logs --tail=50

# Buscar en logs
docker compose logs | grep "error"
docker compose logs | grep "NEWS ANALYSIS"
```

### Ver logs de generacion de posts

Los posts generados se loguean:

```bash
docker compose logs -f | grep "generate_post"
```

### Logs del cron job

El scraping automatico se ejecuta cada 15 minutos:

```bash
docker compose logs -f | grep CRON
# [CRON] Scheduled scrape at 2025-06-09T14:30:00.000Z
```

---

## Agregar una nueva fuente RSS

Para agregar una nueva fuente RSS, edita `server/seeds.ts`:

```typescript
// Abre server/seeds.ts
// Agrega una nueva entrada en RSS_SOURCES:

export const RSS_SOURCES: RSSSource[] = [
  // ... fuentes existentes ...

  // Nueva fuente
  {
    name: 'Mi Nueva Fuente',
    rssUrl: 'https://mi-nueva-fuente.com/feed.xml',
    category: 'VULNERABILITY'  // Categoria: VULNERABILITY, MALWARE, THREAT INTEL, etc.
  },
];
```

### Categorias disponibles

| Categoria | Descripcion |
|-----------|-------------|
| `VULNERABILITY` | Vulnerabilidades y patches |
| `MALWARE` | Malware y ransomware |
| `THREAT INTEL` | Inteligencia de amenazas |
| `DATA BREACH` | Filtraciones de datos |
| `PHISHING` | Campanas de phishing |
| `COMPLIANCE` | Cumplimiento normativo |
| `RESEARCH` | Investigacion de seguridad |
| `PRIVACY` | Privacidad |
| `POLICY` | Politicas gubernamentales |
| `INDUSTRY` | Noticias de la industria |
| `ALERT` | Alertas de seguridad |
| `AWARENESS` | Concientizacion |

### Reconstruir despues de agregar

```bash
# Detener y reconstruir
docker compose down
docker compose up -d --build

# Verificar que la nueva fuente aparece
curl http://localhost:3001/api/sources
```

La nueva fuente se scrapea automaticamente en el proximo ciclo (cada 15 minutos) o puedes forzarlo:

```bash
curl -X POST http://localhost:3001/api/scrape
```

---

## Integracion con Hermes / OpenClaw

### Configuracion MCP

Agrega a tu configuracion MCP:

```json
{
  "mcpServers": {
    "cyberpulse": {
      "url": "http://localhost:3001/api/mcp",
      "headers": {
        "X-API-Key": "tu-clave-secreta"
      }
    }
  }
}
```

### Ejemplo: Obtener noticias y generar post

```python
import requests

BASE = "http://localhost:3001"

# 1. Listar noticias
r = requests.post(f"{BASE}/api/mcp", json={
    "action": "list_news",
    "params": {"limit": 5}
})
news = r.json()["result"]
article = news[0]

# 2. Generar post
r = requests.post(f"{BASE}/api/mcp", json={
    "action": "generate_post",
    "params": {
        "articleId": article["id"],
        "title": article["title"],
        "summary": article["summary"],
        "source": article["source"],
        "severity": article["severity"],
        "url": article["url"],
        "tone": "Professional",
        "format": "News Analysis",
        "language": "en"
    }
})
post = r.json()["result"]

# 3. El post tiene negritas para pegar en LinkedIn
print(post["post"])
```

---

## Variables de Entorno

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `CYBERPULSE_API_KEY` | `null` | Clave API (opcional) |
| `SCRAPE_CRON` | `*/15 * * * *` | Intervalo de scraping |
| `NODE_ENV` | `production` | Entorno Node.js |

---

## Troubleshooting

### No llegan noticias

```bash
# Verificar que el scraper funciona
docker compose logs -f | grep SCRAPER

# Forzar scraping manual
curl -X POST http://localhost:3001/api/scrape

# Verificar fuentes
curl http://localhost:3001/api/sources

# Verificar health
curl http://localhost:3001/api/health
```

### Error de permisos (SQLite)

```bash
# Asegurar que el volumen tiene permisos correctos
chmod -R 777 ./data
docker compose restart
```

### Puerto 3001 ocupado

```bash
# Cambiar el puerto en docker-compose.yml
# ports:
#   - "8080:3001"
# Ahora accede en http://localhost:8080
```

### Reconstruir desde cero

```bash
docker compose down -v  # borra volumen
docker compose up -d --build
```

---

## Licencia

MIT
