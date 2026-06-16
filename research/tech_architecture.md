# Arquitectura Tecnica para Agregador de Noticias de Ciberseguridad con Generacion de Contenido para LinkedIn

> **Fecha de investigacion:** Junio 2026
> **Proposito:** Definir el stack tecnologico, arquitectura de datos y flujo de trabajo para una aplicacion web que agrega noticias de ciberseguridad y genera contenido para LinkedIn usando IA.

---

## Tabla de Contenidos

1. [Stack Tecnologico Recomendado](#1-stack-tecnologico-recomendado)
2. [Fuentes RSS de Ciberseguridad](#2-fuentes-rss-de-ciberseguridad)
3. [Librerias para Parsing de RSS](#3-librerias-para-parsing-de-rss)
4. [APIs de IA para Generacion de Contenido](#4-apis-de-ia-para-generacion-de-contenido)
5. [Arquitectura de Datos](#5-arquitectura-de-datos)
6. [Flujo de Trabajo: Pipeline Completo](#6-flujo-de-trabajo-pipeline-completo)
7. [Consideraciones de Scraping Etico](#7-consideraciones-de-scraping-etico)
8. [Alternativas: Serverless vs Full-Stack](#8-alternativas-serverless-vs-full-stack)
9. [Estimacion de Costos](#9-estimacion-de-costos)
10. [Codigo de Ejemplo](#10-codigo-de-ejemplo)

---

## 1. Stack Tecnologico Recomendado

### Resumen Ejecutivo del Stack

| Capa | Tecnologia Recomendada | Alternativa |
|------|------------------------|-------------|
| **Frontend** | Next.js 15 (App Router) + TailwindCSS + shadcn/ui | React + Vite |
| **Backend** | Next.js API Routes + Server Actions | Express.js + React |
| **Base de datos** | Prisma ORM + SQLite (local) / PostgreSQL (prod) | Drizzle ORM |
| **Cache** | Upstash Redis (serverless) | Redis auto-gestionado |
| **Parsing RSS** | `rss-parser` + `node-fetch` | `feedparser` |
| **IA / LLM** | Vercel AI SDK + OpenAI/Anthropic/Gemini | Llamadas directas a APIs |
| **Scheduling** | Vercel Cron Jobs | node-cron en servidor |
| **Despliegue** | Vercel (Hobby -> Pro) | Railway, Render |
| **Monitoreo** | Vercel Analytics + Upstash Dashboard | Sentry |

### Justificacion del Stack

**Next.js 15 con App Router** es el framework recomendado para este proyecto por multiples razones [^1^]:

- **Full-stack en un solo framework**: Server Components para renderizado inicial rapido, Client Components para interactividad, API Routes para el backend
- **Server Actions**: Permiten llamadas directas del cliente al servidor sin necesidad de definir endpoints API duplicados [^1^]
- **ISR (Incremental Static Regeneration)**: Para cachear el dashboard de noticias y regenerarlo periodicamente
- **Ecosistema maduro**: Integracion nativa con Vercel, AI SDK, Prisma, Upstash

**Vercel AI SDK** proporciona una API unificada para integrar multiples proveedores de LLM (OpenAI, Anthropic, Google, etc.) sin cambiar codigo [^50^][^51^][^52^]:

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Mismo codigo, diferentes proveedores
const { text } = await generateText({
  model: openai('gpt-4.1'),
  prompt: 'Genera un post para LinkedIn sobre ciberseguridad...',
});
```

**Upstash Redis** es ideal para entornos serverless porque [^27^][^28^][^30^]:
- No requiere conexion TCP persistente (usa HTTP REST)
- Billing por request (pay-as-you-go)
- Integracion nativa con Vercel
- Soporta rate limiting, caching y colas de mensajes

---

## 2. Fuentes RSS de Ciberseguridad

### Lista de Feeds RSS Verificados

Las siguientes fuentes RSS de ciberseguridad han sido verificadas y estan activas. Datos recopilados de securityfeeds.org y feedspot [^31^][^38^]:

| Fuente | URL del Feed | Tipo | Descripcion |
|--------|-------------|------|-------------|
| **BleepingComputer** | `https://www.bleepingcomputer.com/feed/` | RSS | Noticias generales de ciberseguridad, malware, vulnerabilidades [^26^] |
| **The Hacker News** | `https://feeds.feedburner.com/TheHackersNews` | RSS | Noticias de ciberseguridad globales |
| **Krebs on Security** | `https://krebsonsecurity.com/feed/` | RSS | Periodismo investigativo sobre ciberdelincuencia [^35^][^36^][^38^] |
| **Ars Technica Security** | `https://arstechnica.com/security/feed/` | RSS | Analisis tecnologico y seguridad [^31^] |
| **CISA Blog** | `https://www.cisa.gov/blog.xml` | RSS | Blog oficial de CISA (US) |
| **CISA Advisories** | `https://www.cisa.gov/cybersecurity-advisories/all.xml` | RSS | Alertas de seguridad oficiales [^31^] |
| **SecurityWeek** | `https://www.securityweek.com/feed/` | RSS | Noticias y analisis de ciberseguridad |
| **The CyberWire** | `https://thecyberwire.com/feeds/rss.xml` | RSS | Resumen diario de noticias de seguridad |
| **TechCrunch Security** | `https://techcrunch.com/category/security/feed/` | RSS | Noticias de startups y seguridad |
| **PortSwigger Research** | `https://portswigger.net/research/rss` | RSS | Investigacion de seguridad web |
| **PortSwigger Blog** | `https://portswigger.net/blog/rss` | RSS | Blog sobre seguridad web |
| **NIST Cybersecurity** | `https://www.nist.gov/blogs/cybersecurity-insights/rss.xml` | RSS | Insights de NIST |
| **Dark Reading** | `https://www.darkreading.com/rss.xml` | RSS | Noticias para profesionales de seguridad |
| **Threatpost** | `https://threatpost.com/feed/` | RSS | Noticias de amenazas y vulnerabilidades |
| **Malwarebytes Blog** | `https://www.malwarebytes.com/blog/feed.xml` | RSS | Analisis de malware y amenazas [^29^] |
| **GBHackers** | `https://gbhackers.com/feed/` | RSS | Noticias de hacking y ciberseguridad [^38^] |
| **CSO Online** | `https://csoonline.com/feed` | RSS | Para CISOs y lideres de seguridad |

### APIs Adicionales de Ciberseguridad

Algunas fuentes ofrecen APIs REST ademas de RSS:

- **CISA KEV (Known Exploited Vulnerabilities)**: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **NVD (National Vulnerability Database)**: API REST para CVEs
- **VirusTotal**: API para analisis de amenazas (requiere API key)
- **AlienVault OTX**: API de threat intelligence abierta

---

## 3. Librerias para Parsing de RSS

### Opcion Recomendada: `rss-parser`

La libreria `rss-parser` es la mas popular y mantenida para Node.js/TypeScript:

**Pros:**
- Soporte nativo para RSS 0.90, 0.91, 0.92, 1.0, 2.0 y Atom 1.0
- Tipos TypeScript disponibles (`@types/rss-parser`)
- Manejo automatico de namespaces (media, content, dc, etc.)
- Parsing de fechas automatico
- Soporte para custom fields
- Sin dependencias pesadas

**Instalacion:**
```bash
npm install rss-parser
npm install -D @types/rss-parser
```

**Uso basico:**
```typescript
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'CyberNewsAggregator/1.0 (contact@example.com)',
  },
  customFields: {
    item: ['media:content', 'content:encoded'],
  },
});

const feed = await parser.parseURL('https://www.bleepingcomputer.com/feed/');
console.log(feed.title); // BleepingComputer
feed.items.forEach(item => {
  console.log(item.title, item.link, item.pubDate);
});
```

### Alternativa: `feedparser`

`feedparser` es otra opcion robusta basada en streams de Node.js.

**Pros:**
- Basado en streams, mas eficiente para feeds grandes
- Muy robusto y probado en produccion

**Contras:**
- API basada en streams es mas verbosa
- Menos amigable para TypeScript
- Curva de aprendizaje mayor

### Opcion manual con `fast-xml-parser`

Para mayor control, se puede usar `fast-xml-parser` + `node-fetch`:

```typescript
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

const response = await fetch('https://www.bleepingcomputer.com/feed/');
const xml = await response.text();
const feed = parser.parse(xml);
```

**Contras:**
- Requiere mas codigo boilerplate
- Manejo manual de formatos RSS/Atom
- Parsing de fechas manual

### Recomendacion Final

Usar **`rss-parser`** por su simplicidad, buen soporte TypeScript, y mantenimiento activo. Es la opcion mas rapida de implementar para un MVP.

---

## 4. APIs de IA para Generacion de Contenido

### Comparativa de Proveedores (Precios por 1M tokens, USD)

#### OpenAI [^9^][^10^]

| Modelo | Input | Output | Context Window | Mejor para |
|--------|-------|--------|----------------|------------|
| GPT-4.1 Nano | $0.10 | $0.40 | 1M | Clasificacion, routing, extraccion |
| GPT-4o-mini | $0.15 | $0.60 | 128K | Tareas simples |
| GPT-5 Mini | $0.25 | $2.00 | 128K | Proposito general economico |
| GPT-4.1 Mini | $0.40 | $1.60 | 1M | Tareas de produccion mid-tier |
| GPT-5 | $1.25 | $10.00 | 128K | Workflows agenticos |
| GPT-4.1 | $2.00 | $8.00 | 1M | Trabajo de produccion |
| GPT-4o | $2.50 | $10.00 | 128K | Produccion legacy |

**Caracteristicas:**
- Batch API: 50% de descuento en todos los costos
- Prompt caching: hasta 90% de descuento en tokens repetidos
- Free tier: 3 RPM para reasoning, 500 RPM para GPT-4o-mini

#### Anthropic Claude [^5^][^6^][^7^][^8^]

| Modelo | Input | Output | Context Window | Mejor para |
|--------|-------|--------|----------------|------------|
| Haiku 4.5 | $1.00 | $5.00 | 200K | Tareas de alto volumen |
| Sonnet 4.6 | $3.00 | $15.00 | 1M | Balance costo/calidad |
| Opus 4.6 | $5.00 | $25.00 | 1M | Razonamiento complejo |

**Caracteristicas:**
- Prompt caching: 90% de descuento en cache reads
- Batch API: 50% de descuento
- Context window de 1M tokens (Sonnet 4.6 y Opus 4.6)
- **No hay free tier de API** (solo creditos iniciales)

#### Google Gemini [^48^][^49^][^53^][^54^]

| Modelo | Input | Output | Context Window | Mejor para |
|--------|-------|--------|----------------|------------|
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | - | Tareas ligeras y baratas |
| Gemini 2.5 Flash | $0.30 | $2.50 | - | Proposito general rapido |
| Gemini 2.5 Pro | $1.25 / $2.50 | $10.00 / $15.00 | 1M | Razonamiento avanzado |
| Gemini 3.1 Pro | $2.00 | $12.00 | 1M | Modelo mas reciente |
| Gemini 3 Flash | $0.50 | $3.00 | - | Modelo Flash reciente |

**Caracteristicas:**
- Free tier disponible con limites (ej: 2 req/min para Pro, 10 req/min para Flash)
- Batch processing: 50% de descuento
- Context caching disponible
- Grounding con Google Search (costo adicional)

### Recomendacion para Este Proyecto

Para la generacion de posts de LinkedIn a partir de noticias de ciberseguridad, se recomienda:

| Caso de Uso | Modelo Recomendado | Por que |
|-------------|-------------------|---------|
| **Clasificacion/resumen rapido** de noticias | GPT-4.1 Nano ($0.10/M) o Gemini 2.5 Flash-Lite ($0.10/M) | Costo minimo para tareas simples |
| **Generacion de posts** para LinkedIn | GPT-4.1 Mini ($0.40/M) o Gemini 2.5 Flash ($0.30/M) | Excelente balance calidad/precio |
| **Generacion premium** con tono profesional | Claude Sonnet 4.6 ($3.00/M) | Mejor calidad de escritura |
| **Fallback/alternativa** | Gemini 2.5 Pro ($1.25/M) | Buen razonamiento, precio competitivo |

### Estrategia de Implementacion con Vercel AI SDK

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function generateLinkedInPost(newsItem: NewsItem): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4.1-mini'),
    system: `Eres un experto en ciberseguridad que crea contenido profesional para LinkedIn.
    Genera posts en espanol que sean:
    - Informativos pero accesibles
    - Con hashtags relevantes (#ciberseguridad #cybersecurity)
    - Longitud optima para LinkedIn (150-300 palabras)
    - Con un call-to-action sutil al final`,
    prompt: `Basado en esta noticia, genera un post para LinkedIn:
    
    Titulo: ${newsItem.title}
    Resumen: ${newsItem.summary || newsItem.contentSnippet}
    Fuente: ${newsItem.source}`,
    temperature: 0.7,
    maxTokens: 500,
  });
  
  return text;
}
```

---

## 5. Arquitectura de Datos

### Modelo de Datos (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Para local/dev
  url      = env("DATABASE_URL")
}

// Para produccion PostgreSQL:
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

model Feed {
  id          String    @id @default(cuid())
  name        String
  url         String    @unique
  category    String?   // e.g., "vulnerabilities", "threats", "general"
  isActive    Boolean   @default(true)
  lastFetched DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  articles    Article[]
}

model Article {
  id            String   @id @default(cuid())
  feedId        String
  title         String
  link          String
  summary       String?
  content       String?
  author        String?
  publishedAt   DateTime
  imageUrl      String?
  
  // Campos de procesamiento
  isProcessed   Boolean  @default(false)
  relevanceScore Float?   // 0-100, para ranking
  category      String?  // auto-clasificado
  keywords      String?  // JSON array de keywords
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  feed          Feed     @relation(fields: [feedId], references: [id])
  posts         LinkedInPost[]
  
  @@index([publishedAt])
  @@index([isProcessed])
  @@index([relevanceScore])
}

model LinkedInPost {
  id          String   @id @default(cuid())
  articleId   String
  content     String   // Contenido generado por IA
  hashtags    String?  // Hashtags sugeridos
  tone        String   // "professional", "casual", "educational"
  isEdited    Boolean  @default(false)
  editedContent String?
  isCopied    Boolean  @default(false)
  copiedAt    DateTime?
  
  // Metadata del modelo IA usado
  modelUsed   String?
  tokensUsed  Int?
  costUsd     Float?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  article     Article  @relation(fields: [articleId], references: [id])
}
```

### Estrategia de Almacenamiento

#### Opcion A: SQLite (Desarrollo y MVP pequeno) [^49^]

**Pros:**
- Sin servidor de base de datos necesario
- Solo es un archivo (`dev.db`)
- Perfecto para MVP y prototipos
- Prisma lo soporta nativamente

**Contras:**
- No escala bien con concurrencia alta
- No es ideal para produccion con multiples usuarios
- Limitaciones en queries complejas

```bash
npx prisma init --datasource-provider sqlite
# DATABASE_URL="file:./dev.db"
```

#### Opcion B: Prisma Postgres (Produccion) [^41^][^45^]

**Pros:**
- PostgreSQL serverless gestionado por Prisma
- Integracion directa con Vercel
- Escalabilidad automatica
- Backups y mantenimiento incluidos

**Contras:**
- Costo adicional (a partir de ~$20/mes)

```bash
npx prisma init --db --output ../app/generated/prisma
npx create-db  # Crea PostgreSQL en la nube
```

#### Opcion C: Supabase (Alternativa gratuita generosa) [^43^]

**Pros:**
- PostgreSQL con free tier generoso
- API REST auto-generada
- Autenticacion integrada
- $25/mes para tier Pro

**Contras:**
- Rate limits en free tier
- Cold starts ocasionales

### Estrategia de Caching con Upstash Redis [^27^][^28^][^30^]

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache-aside pattern para feeds
export async function getCachedFeed<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutos por defecto
): Promise<T> {
  const cached = await redis.get<T>(`feed:${key}`);
  if (cached) return cached;

  const fresh = await fetcher();
  await redis.setex(`feed:${key}`, ttl, fresh);
  return fresh;
}

// Stale-while-revalidate para noticias
export async function getNewsWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl: number; staleFor: number }
): Promise<T> {
  // Implementacion SWR pattern
  // (ver codigo completo en seccion 10)
}
```

**TTLs recomendados:**

| Tipo de dato | TTL Recomendado |
|-------------|-----------------|
| Lista de feeds parseados | 10-15 minutos |
| Articulos individuales | 1 hora |
| Posts de LinkedIn generados | 24 horas |
| Rate limit counters | 1 minuto |
| Metricas y analytics | 5 minutos |

---

## 6. Flujo de Trabajo: Pipeline Completo

### Diagrama del Pipeline

```
+------------------+     +-------------------+     +--------------------+
|   FUENTES RSS    |     |  PARSING & FETCH  |     |   ALMACENAMIENTO   |
|                  |     |                   |     |                    |
| BleepingComputer |---->|                   |---->|                    |
| The Hacker News  |     |  rss-parser       |     |  Prisma ORM        |
| KrebsOnSecurity  |---->|  node-fetch       |---->|  (SQLite/Postgres) |
| CISA Advisories  |     |  rate limiting    |     |                    |
| SecurityWeek     |---->|  error handling   |---->|                    |
| ... (16+ feeds)  |     |                   |     |                    |
+------------------+     +-------------------+     +--------------------+
                                                              |
                                                              v
+------------------+     +-------------------+     +--------------------+
|   DASHBOARD UI   |     |  GENERACION IA    |     |   CLASIFICACION    |
|                  |     |                   |     |                    |
| Next.js +        |<----|  Vercel AI SDK    |<----|  Relevance scoring |
| Tailwind +       |     |  OpenAI/Gemini/   |     |  Categorization    |
| shadcn/ui        |     |  Anthropic        |     |  Keyword extraction|
|                  |     |                   |     |                    |
| - Lista noticias |     | - Prompt eng.     |     | - GPT-4.1 Nano     |
| - Editor posts   |     | - Post generation |     | - Gemini Flash-Lite|
| - Copy to clipb. |     | - Hashtag sugg.   |     | - Heuristic rules  |
| - Analytics      |     |                   |     |                    |
+------------------+     +-------------------+     +--------------------+
         ^
         |
+------------------+
|  CRON JOB        |
|  (Vercel)        |
|                  |
| Cada 30 minutos: |
| 1. Fetch feeds   |
| 2. Parse RSS     |
| 3. Store articles|
| 4. Classify      |
| 5. Cache results |
+------------------+
```

### Flujo Detallado

#### Paso 1: Agregacion (Cron Job cada 30 minutos)

1. Vercel Cron Job dispara la funcion de agregacion
2. Se recorre la lista de feeds activos (tabla `Feed`)
3. Para cada feed:
   - Se verifica `lastFetched` para no hacer requests redundantes
   - Se parsea el RSS con `rss-parser`
   - Se aplican delays respetuosos (1-2 segundos entre feeds)
   - Se almacenan articulos nuevos en la base de datos

#### Paso 2: Clasificacion y Ranking

1. Para cada articulo nuevo:
   - Se extraen keywords del titulo y contenido
   - Se calcula un `relevanceScore` basado en:
     - Relevancia de la fuente (CISA = alta, blog generico = media)
     - Keywords importantes (CVE, ransomware, zero-day, etc.)
     - Recencia de la noticia
   - Se clasifica por categoria (vulnerabilidades, amenazas, compliance, etc.)

#### Paso 3: Generacion de Contenido (On-demand)

1. El usuario selecciona una noticia del dashboard
2. Se envia el contenido al modelo de IA via Vercel AI SDK
3. El modelo genera un post optimizado para LinkedIn
4. Se almacena en `LinkedInPost` con metadata del modelo usado

#### Paso 4: Presentacion y Edicion

1. Dashboard muestra noticias ordenadas por `relevanceScore`
2. Cada noticia tiene boton "Generar Post"
3. Posts generados aparecen con editor inline
4. Boton "Copiar al portapapeles" para pegar en LinkedIn

---

## 7. Consideraciones de Scraping Etico

### Reglas Fundamentales [^32^]

1. **Honrar `robots.txt`**: Verificar siempre el archivo `robots.txt` de cada sitio antes de hacer scraping
2. **Rate limiting**: No hacer mas de 1 request por segundo a la misma fuente
3. **User-Agent descriptivo**: Identificar el bot con proposito y contacto
4. **Respetar TTLs**: No fetcher mas frecuentemente que cada 15-30 minutos

### Implementacion Practica

```typescript
// lib/scraper-config.ts
export const SCRAPER_CONFIG = {
  // User-Agent descriptivo y honesto
  USER_AGENT: 'CyberNewsAggregator/1.0 (+https://tuapp.com/about; contact@tuapp.com)',
  
  // Rate limits por dominio (ms entre requests)
  RATE_LIMITS: {
    'bleepingcomputer.com': 2000,   // 2 segundos
    'thehackernews.com': 2000,
    'krebsonsecurity.com': 3000,     // 3 segundos (blog personal)
    'cisa.gov': 5000,                // 5 segundos (gobierno)
    'securityweek.com': 2000,
    'arstechnica.com': 2000,
    default: 2000,
  },
  
  // Intervalo minimo entre fetches del mismo feed (ms)
  MIN_FETCH_INTERVAL: 15 * 60 * 1000, // 15 minutos
  
  // Timeout para requests RSS
  REQUEST_TIMEOUT: 10000, // 10 segundos
  
  // Maximo de articulos a procesar por feed
  MAX_ARTICLES_PER_FEED: 20,
};

// lib/rate-limiter.ts
import { SCRAPER_CONFIG } from './scraper-config';
import { redis } from './redis';

export async function canFetchFeed(feedUrl: string): Promise<boolean> {
  const domain = new URL(feedUrl).hostname;
  const key = `ratelimit:feed:${domain}`;
  const lastFetch = await redis.get<number>(key);
  
  if (!lastFetch) return true;
  
  const rateLimit = SCRAPER_CONFIG.RATE_LIMITS[domain as keyof typeof SCRAPER_CONFIG.RATE_LIMITS] 
    || SCRAPER_CONFIG.RATE_LIMITS.default;
  
  const elapsed = Date.now() - lastFetch;
  return elapsed >= rateLimit;
}

export async function recordFeedFetch(feedUrl: string): Promise<void> {
  const domain = new URL(feedUrl).hostname;
  const key = `ratelimit:feed:${domain}`;
  await redis.set(key, Date.now());
}
```

### Mejores Practicas Adicionales

- **Cache-first**: Servir siempre datos cacheados antes de hacer fetch
- **Backoff exponencial**: Si un feed falla, esperar 2x, 4x, 8x... antes de reintentar
- **Monitoreo**: Loggear todos los requests y errores
- **Fallback**: Si un feed falla repetidamente, marcarlo como inactivo temporalmente
- **Respetar 429/503**: Si el servidor devuelve estos codigos, detener inmediatamente

---

## 8. Alternativas: Serverless vs Full-Stack

### Opcion A: Full Serverless (Recomendada)

**Stack:** Next.js + Vercel + Upstash Redis + Prisma Postgres

**Ventajas:**
- Sin administracion de servidores [^2^][^3^]
- Escalado automatico
- Pay-per-use (ideal para trafico variable)
- Despliegue con `git push`
- Cold starts aceptables para esta aplicacion

**Desventajas:**
- Vendor lock-in con Vercel
- Limites de ejecucion de funciones (hasta 300s en Pro)
- Costos impredecibles si hay trafico inesperado

**Ideal para:** MVP, proyecto personal, bajo trafico predecible.

### Opcion B: Full-Stack con Servidor Propio

**Stack:** Next.js + Railway/Render/Fly.io + PostgreSQL + Redis

**Ventajas:**
- Control total del entorno
- Performance mas predecible (sin cold starts)
- Base de datos persistente
- Costos fijos mensuales

**Desventajas:**
- Mayor overhead operacional
- Necesitas configurar backups, monitoreo, etc.
- Mas costoso para trafico bajo

**Ideal para:** Aplicacion en crecimiento, necesidades especificas de infraestructura.

### Opcion C: Full Silver Stack [^4^]

**Stack:** Astro/SvelteKit + Cloudflare Workers + Supabase

**Ventajas:**
- Mas ligero y rapido
- Costos potencialmente 40% menores
- Edge deployment global

**Desventajas:**
- Ecosistema menos maduro para integracion de IA
- Menos herramientas integradas

### Recomendacion

Para este proyecto se recomienda **Opcion A (Full Serverless con Vercel)** por:

1. La aplicacion es principalmente lectura de RSS + generacion de IA (workload intermittente)
2. El cron job para fetch de RSS encaja perfecto con serverless
3. Vercel AI SDK esta optimizado para este entorno [^50^]
4. Costos minimos en fase inicial (Hobby plan = $0)
5. Escalamiento sin cambios de arquitectura

---

## 9. Estimacion de Costos

### Escenario: MVP (1 usuario, ~100 noticias/dia)

#### Vercel (Hobby Plan) [^11^][^12^]

| Recurso | Uso estimado | Costo |
|---------|-------------|-------|
| Edge Requests | ~500K/mes | **$0** (incluido en Hobby) |
| CPU Time | ~2 horas/mes | **$0** (incluido: 4h) |
| Function Invocations | ~50K/mes | **$0** (incluido: 1M) |
| Bandwidth | ~5 GB/mes | **$0** (incluido: 100GB) |
| **Total Vercel** | | **$0/mes** |

#### Upstash Redis (Free Tier) [^27^]

| Recurso | Uso estimada | Costo |
|---------|-------------|-------|
| Requests diarias | ~2,000 | **$0** (limite: 10K/dia) |
| Storage | < 1 MB | **$0** (limite: 256MB) |
| **Total Redis** | | **$0/mes** |

#### API de IA

| Modelo | Llamadas/mes | Tokens/llamada | Costo estimado |
|--------|-------------|----------------|----------------|
| GPT-4.1 Nano (clasificacion) | 3,000 | ~500 input | ~$0.15 |
| GPT-4.1 Mini (generacion posts) | 300 | ~2000 input, ~500 output | ~$0.34 |
| **Total IA** | | | **~$0.50/mes** |

#### Base de Datos

| Opcion | Costo |
|--------|-------|
| SQLite (local) | **$0** |
| Supabase Free | **$0** |
| Prisma Postgres | ~$20/mes (cuando se necesite) |

**Total MVP: ~$0-0.50/mes** (usando tiers gratuitos)

### Escenario: Produccion (equipo pequeno, ~500 noticias/dia)

#### Vercel Pro Plan [^11^][^13^]

| Recurso | Uso estimado | Costo |
|---------|-------------|-------|
| Plan Pro (1 developer) | - | **$20/mes** |
| Edge Requests | ~5M/mes | $0 (incluido: 10M) |
| CPU Time | ~15 horas/mes | $0 (incluido: 40h) |
| Function Invocations | ~300K/mes | $0 (incluido: 10M) |
| Bandwidth | ~20 GB/mes | $0 (incluido: 1TB) |
| **Total Vercel** | | **$20/mes** |

#### Upstash Redis (Pay-as-you-go)

| Recurso | Uso estimada | Costo |
|---------|-------------|-------|
| Requests | ~15K/dia (~450K/mes) | **~$5-10/mes** |
| **Total Redis** | | **~$10/mes** |

#### API de IA

| Modelo | Llamadas/mes | Costo estimado |
|--------|-------------|----------------|
| GPT-4.1 Mini (clasificacion) | 15,000 | ~$4.50 |
| GPT-4.1 Mini (generacion posts) | 1,500 | ~$3.60 |
| Claude Sonnet 4.6 (posts premium) | 500 | ~$18.00 |
| **Total IA** | | **~$26/mes** |

#### Base de Datos

| Opcion | Costo |
|--------|-------|
| Supabase Pro | **$25/mes** |
| Prisma Postgres | **~$20/mes** |

**Total Produccion: ~$76-81/mes**

### Optimizaciones de Costos

1. **Usar Batch API de OpenAI**: 50% de descuento para procesamiento no-tiempo-real
2. **Prompt caching**: Hasta 90% de descuento en tokens repetidos
3. **Cachear feeds RSS en Redis**: Evitar fetch innecesarios
4. **Usar GPT-4.1 Nano para clasificacion**: 20x mas barato que GPT-4.1
5. **ISR para dashboard**: Cachear la pagina y regenerar cada 5 minutos

---

## 10. Codigo de Ejemplo

### Estructura de Directorios Recomendada

```
cyber-news-aggregator/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── fetch-feeds/
│   │   │       └── route.ts      # Cron job para fetch RSS
│   │   ├── feeds/
│   │   │   └── route.ts          # API para listar feeds
│   │   ├── articles/
│   │   │   └── route.ts          # API para listar articulos
│   │   └── generate-post/
│   │       └── route.ts          # API para generar post con IA
│   ├── page.tsx                   # Dashboard principal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── news-card.tsx
│   ├── post-editor.tsx
│   └── dashboard.tsx
├── lib/
│   ├── prisma.ts                  # Prisma client singleton
│   ├── redis.ts                   # Upstash Redis client
│   ├── rss-parser.ts              # Parsing de RSS
│   ├── ai-generator.ts            # Generacion con IA
│   ├── scraper-config.ts          # Config de scraping etico
│   └── rate-limiter.ts            # Rate limiting
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### Cliente Prisma Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Servicio de Parsing de RSS

```typescript
// lib/rss-parser.ts
import Parser from 'rss-parser';
import { SCRAPER_CONFIG } from './scraper-config';
import { canFetchFeed, recordFeedFetch } from './rate-limiter';

const parser = new Parser({
  timeout: SCRAPER_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'User-Agent': SCRAPER_CONFIG.USER_AGENT,
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

export interface ParsedArticle {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  imageUrl?: string;
}

export async function parseFeed(
  feedUrl: string
): Promise<ParsedArticle[]> {
  // Verificar rate limit
  const canFetch = await canFetchFeed(feedUrl);
  if (!canFetch) {
    console.log(`Rate limit activo para ${feedUrl}, saltando...`);
    return [];
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    recordFeedFetch(feedUrl);

    return (feed.items || [])
      .slice(0, SCRAPER_CONFIG.MAX_ARTICLES_PER_FEED)
      .map(item => ({
        title: item.title || '',
        link: item.link || '',
        content: item.contentEncoded || item.content || '',
        contentSnippet: item.contentSnippet || '',
        pubDate: item.pubDate || item.isoDate,
        author: item.author || item.creator,
        categories: item.categories || [],
        imageUrl: extractImageUrl(item),
      }));
  } catch (error) {
    console.error(`Error parseando feed ${feedUrl}:`, error);
    return [];
  }
}

function extractImageUrl(item: any): string | undefined {
  // Extraer imagen de media:content, enclosure, o contenido
  if (item.media?.$?.url) return item.media.$.url;
  if (item.enclosure?.url) return item.enclosure.url;
  // Buscar primera imagen en el contenido HTML
  const imgMatch = item.contentEncoded?.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch?.[1];
}
```

### Generador de Posts con IA

```typescript
// lib/ai-generator.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { prisma } from './prisma';

interface GeneratePostOptions {
  articleId: string;
  title: string;
  summary: string;
  source: string;
  tone?: 'professional' | 'casual' | 'educational';
  language?: 'es' | 'en';
}

export async function generateLinkedInPost(
  options: GeneratePostOptions
): Promise<{ content: string; hashtags: string; tokensUsed: number; costUsd: number }> {
  const { articleId, title, summary, source, tone = 'professional', language = 'es' } = options;

  const toneInstructions = {
    professional: 'Usa un tono profesional, corporativo y directo.',
    casual: 'Usa un tono conversacional, cercano y accesible.',
    educational: 'Usa un tono educativo, explicando conceptos tecnicos de forma clara.',
  };

  const languageInstruction = language === 'es' 
    ? 'Escribe el post en espanol.' 
    : 'Write the post in English.';

  const { text, usage } = await generateText({
    model: openai('gpt-4.1-mini'),
    system: `Eres un experto en ciberseguridad y marketing de contenidos que crea posts profesionales para LinkedIn.
    
    Reglas:
    - ${toneInstructions[tone]}
    - ${languageInstruction}
    - Longitud: 150-300 palabras.
    - Incluye un hook atractivo en la primera linea.
    - Usa emojis estrategicamente (maximo 3-4).
    - Incluye 3-5 hashtags relevantes al final en una linea separada.
    - Termina con una pregunta o call-to-action sutil.
    - NO incluyas "Post generado por IA" ni similares.
    - Formato: parrafo introductorio, bullet points si es util, cierre con pregunta.`,
    prompt: `Crea un post para LinkedIn basado en esta noticia de ciberseguridad:

    Titulo: ${title}
    Resumen: ${summary}
    Fuente: ${source}`,
    temperature: 0.7,
    maxTokens: 500,
  });

  // Extraer hashtags del texto generado
  const hashtagMatch = text.match(/#[\w]+/g);
  const hashtags = hashtagMatch ? hashtagMatch.join(' ') : '#Ciberseguridad #Cybersecurity';

  // Calcular costo estimado (GPT-4.1 Mini: $0.40 input, $1.60 output por 1M tokens)
  const tokensUsed = usage.totalTokens;
  const costUsd = (usage.promptTokens * 0.40 + usage.completionTokens * 1.60) / 1_000_000;

  // Guardar en base de datos
  await prisma.linkedInPost.create({
    data: {
      articleId,
      content: text,
      hashtags,
      tone,
      modelUsed: 'gpt-4.1-mini',
      tokensUsed,
      costUsd,
    },
  });

  return { content: text, hashtags, tokensUsed, costUsd };
}
```

### Cron Job para Fetch de Feeds

```typescript
// app/api/cron/fetch-feeds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseFeed } from '@/lib/rss-parser';
import { redis } from '@/lib/redis';

// Configuracion del cron (cada 30 minutos)
// export const dynamic = 'force-dynamic';
// export const maxDuration = 300; // 5 minutos maximo

export async function GET(request: NextRequest) {
  // Verificar authorization header para cron de Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    feedsProcessed: 0,
    articlesAdded: 0,
    errors: [] as string[],
  };

  // Obtener feeds activos
  const feeds = await prisma.feed.findMany({
    where: { isActive: true },
  });

  for (const feed of feeds) {
    try {
      // Verificar si ya se fetcho recientemente
      const lastFetchKey = `feed:lastfetch:${feed.id}`;
      const lastFetch = await redis.get<number>(lastFetchKey);
      const minInterval = 15 * 60 * 1000; // 15 minutos

      if (lastFetch && Date.now() - lastFetch < minInterval) {
        console.log(`Feed ${feed.name} fetchado recientemente, saltando`);
        continue;
      }

      // Parsear feed
      const articles = await parseFeed(feed.url);

      for (const article of articles) {
        if (!article.link) continue;

        // Evitar duplicados
        const exists = await prisma.article.findUnique({
          where: { link: article.link },
        });

        if (exists) continue;

        // Crear articulo
        await prisma.article.create({
          data: {
            feedId: feed.id,
            title: article.title,
            link: article.link,
            summary: article.contentSnippet,
            content: article.content,
            author: article.author,
            publishedAt: article.pubDate ? new Date(article.pubDate) : new Date(),
            imageUrl: article.imageUrl,
            isProcessed: false,
          },
        });

        results.articlesAdded++;
      }

      // Actualizar lastFetched
      await prisma.feed.update({
        where: { id: feed.id },
        data: { lastFetched: new Date() },
      });
      await redis.set(lastFetchKey, Date.now());

      results.feedsProcessed++;

      // Delay respetuoso entre feeds
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMsg = `Error procesando feed ${feed.name}: ${(error as Error).message}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
  }

  return NextResponse.json(results);
}
```

### Configuracion del Cron en Vercel

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/fetch-feeds",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Componente de Dashboard (Next.js Server Component)

```tsx
// app/page.tsx
import { prisma } from '@/lib/prisma';
import { Dashboard } from '@/components/dashboard';
import { redis } from '@/lib/redis';

async function getArticles() {
  const cacheKey = 'dashboard:articles';
  
  // Intentar cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Fetch de base de datos
  const articles = await prisma.article.findMany({
    where: { isProcessed: false },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: {
      feed: { select: { name: true } },
      posts: { select: { id: true, content: true } },
    },
  });

  // Cachear por 5 minutos
  await redis.setex(cacheKey, 300, articles);
  
  return articles;
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          CyberNews Aggregator
        </h1>
        <Dashboard articles={articles} />
      </div>
    </main>
  );
}
```

### Variables de Entorno (.env.local)

```bash
# Base de datos
DATABASE_URL="file:./dev.db"
# Para PostgreSQL: DATABASE_URL="postgresql://user:pass@host/db"

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# OpenAI
OPENAI_API_KEY=sk-your-key

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-your-key

# Google Gemini (opcional)
GOOGLE_GENERATIVE_AI_API_KEY=your-key

# Vercel Cron Secret
CRON_SECRET=your-secret-key-for-cron-auth
```

---

## 11. Referencias y Fuentes

- [^1^] Arno, "Comprehensive Next.js Full Stack App Architecture Guide", 2026. https://arno.surfacew.com/posts/nextjs-architecture
- [^2^] Flex, "Comparison Between Full-server and Serverless Web Apps", 2024. https://www.flex.com.ph/articles/comparison-between-full-server-and-serverless-web-apps
- [^3^] M. Burke, "Understanding Serverless Architecture in Full-Stack Development", Medium, 2024. https://medium.com/@mdburkee/understanding-serverless-architecture-in-full-stack-development-be1d204b0fe8
- [^4^] Mango IT Solutions, "Why Full Stack Development Is the Muscle Modern Web Apps Need to Flex", 2025. https://www.mangoitsolutions.com/why-full-stack-for-web-apps/
- [^5^] Mem0.ai, "Claude Pricing: Every Plan and API Cost (May 2026)", 2026. https://mem0.ai/blog/anthropic-claude-pricing
- [^6^] SiliconData, "Anthropic Claude API Pricing 2026", 2026. https://www.silicondata.com/use-cases/anthropic-claude-api-pricing-2026/
- [^7^] EvoLink, "Claude API Pricing 2026: Latest Anthropic Costs for Opus, Sonnet, Haiku", 2026. https://evolink.ai/blog/claude-api-pricing-guide-2026
- [^8^] Finout, "Anthropic API Pricing in 2026: Complete Guide", 2026. https://www.finout.io/blog/anthropic-api-pricing
- [^9^] OpenRouter, "GPT-4o - API Pricing & Benchmarks", 2026. https://openrouter.ai/openai/gpt-4o
- [^10^] PE Collective, "OpenAI API Pricing 2026", 2026. https://pecollective.com/tools/openai-api-pricing/
- [^11^] FlexPrice, "Breaking down Vercel's 2025 pricing plans quotas and hidden costs", 2026. https://flexprice.io/blog/vercel-pricing-breakdown
- [^12^] SchematicHQ, "Vercel Pricing Plans and Hidden Costs Explained (2026)", 2026. https://schematichq.com/blog/vercel-pricing
- [^13^] TrueFoundry, "Vercel AI Pricing Plans 2026: How Much Does It Cost?", 2026. https://www.truefoundry.com/blog/understanding-vercel-ai-gateway-pricing
- [^26^] RSS.app, "BleepingComputer RSS Feed", 2026. https://rss.app/rss-feed/bleepingcomputer-rss-feed
- [^27^] Noqta.tn, "Upstash Redis and Next.js: Rate Limiting, Caching, and Message Queues", 2026. https://noqta.tn/en/tutorials/upstash-redis-nextjs-rate-limiting-caching-2026
- [^28^] Digital Applied, "Redis Caching Strategies: Next.js Production Guide 2025", 2025. https://www.digitalapplied.com/blog/redis-caching-strategies-nextjs-production
- [^29^] Feedspot, "Top 20 Cybercrime RSS Feeds", 2026. https://rss.feedspot.com/cybercrime_rss_feeds/
- [^30^] Upstash, "Use Cases - Upstash Documentation". https://upstash.com/docs/redis/overall/usecases
- [^31^] SecurityFeeds, "SecFeeds - Cybersecurity RSS Feeds". https://securityfeeds.org/
- [^32^] CodeSignal, "Scraping Best Practices". https://codesignal.com/learn/courses/implementing-scalable-web-scraping-with-python/lessons/scraping-best-practices
- [^35^] ServiceNow, "View RSS Feeds". https://www.servicenow.com/docs/r/washingtondc/security-management/threat-intelligence-security-center/tisc-rss-feeds.html
- [^36^] Feeder, "Follow Krebs on Security". https://feeder.co/discover/42a2f16273/krebsonsecurity-com
- [^38^] Feedspot, "Top 60 Cyber Security News RSS Feeds", 2026. https://rss.feedspot.com/cyber_security_news_rss_feeds/
- [^39^] SurekhaTech, "Build Scalable Web Apps with Next.js & Prisma ORM", 2024. https://www.surekhatech.com/blog/build-scalable-web-apps-nextjs-prisma-orm
- [^41^] Aidan McAlister, "Build a Next.js App with Prisma Postgres", Dev.to, 2025. https://dev.to/aidankmcalister/build-a-nextjs-app-with-prisma-postgres-53g7
- [^43^] Bejamas, "What is Supabase: A Review of Serverless Database Features", 2023. https://bejamas.com/hub/serverless-database/supabase
- [^45^] Prisma, "How to use Prisma ORM and Prisma Postgres with Next.js and Vercel". https://www.prisma.io/docs/guides/frameworks/nextjs
- [^48^] Google AI, "Gemini Developer API pricing", 2026. https://ai.google.dev/gemini-api/docs/pricing
- [^49^] IntuitionLabs, "LLM API Pricing Comparison (2025): OpenAI, Gemini, Claude", 2025. https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025
- [^49^] Robin Wieruch, "Next.js with Prisma and SQLite", 2024. https://www.robinwieruch.de/next-prisma-sqlite/
- [^50^] Vercel, "AI SDK by Vercel - Documentation". https://ai-sdk.dev/docs/introduction
- [^51^] Calpa, "Vercel AI SDK Unified LLM Integration", 2025. https://calpa.me/blog/vercel-ai-sdk-unified-llm-integration/
- [^52^] AI Hero, "Vercel's AI SDK Future-proofs Your AI Stack", 2025. https://www.aihero.dev/vercel-ai-sdk
- [^53^] SummarizeMeeting, "Is Gemini API Free? Pricing, Limits, and What You Need to Know in 2025", 2025. https://summarizemeeting.com/en/blog/is-gemini-api-free-pricing-limits-and-what-you-need-to-know-in-2025
- [^54^] Finout, "Gemini Pricing in 2026 for Individuals, Orgs & Developers", 2026. https://www.finout.io/blog/gemini-pricing-in-2026

---

## 12. Checklist de Implementacion

### Fase 1: Setup Inicial (Semana 1)
- [ ] Crear proyecto Next.js con TypeScript
- [ ] Instalar y configurar TailwindCSS + shadcn/ui
- [ ] Configurar Prisma con SQLite
- [ ] Definir schema de base de datos
- [ ] Crear seeds para feeds de ciberseguridad

### Fase 2: Agregacion RSS (Semana 1-2)
- [ ] Implementar parser de RSS con `rss-parser`
- [ ] Configurar rate limiting con Upstash Redis
- [ ] Implementar cron job en Vercel
- [ ] Agregar logging y manejo de errores
- [ ] Almacenar articulos en base de datos

### Fase 3: Dashboard y UI (Semana 2)
- [ ] Crear pagina principal con lista de noticias
- [ ] Implementar filtros y busqueda
- [ ] Agregar paginacion
- [ ] Diseñar cards de noticias con imagenes

### Fase 4: Integracion IA (Semana 2-3)
- [ ] Configurar Vercel AI SDK
- [ ] Implementar generacion de posts con OpenAI
- [ ] Crear componente de editor de posts
- [ ] Agregar boton de copiar al portapapeles
- [ ] Almacenar posts generados en base de datos

### Fase 5: Optimizacion y Deploy (Semana 3)
- [ ] Implementar caching con Upstash Redis
- [ ] Optimizar queries de Prisma
- [ ] Agregar ISR para pagina principal
- [ ] Deploy a Vercel (Hobby)
- [ ] Configurar variables de entorno
- [ ] Monitorear y ajustar

### Fase 6: Mejoras (Futuro)
- [ ] Clasificacion automatica de noticias por relevancia
- [ ] Estadisticas y analytics
- [ ] Exportacion de posts
- [ ] Integracion con LinkedIn API para publicacion directa
- [ ] Soporte multi-usuario
- [ ] Programacion de posts
