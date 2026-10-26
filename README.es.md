<p align="center">
  <img src="app/public/pulse-logo-dark.svg" width="140" alt="CyberPulse logo">
</p>

<h1 align="center">CyberPulse</h1>

<p align="center">
  <strong>Agregador de noticias de ciberseguridad con generador de posts para LinkedIn.</strong><br>
  Consume más de 100 fuentes RSS, clasifica artículos por severidad/categoría y genera contenido listo para publicar.
</p>

<p align="center">
  <a href="README.md">🇬🇧 Read in English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker ready">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20+">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License MIT">
</p>

---

## Índice

- [¿Qué hace CyberPulse?](#qué-hace-cyberpulse)
- [Features](#features)
- [Quick start con Docker](#quick-start-con-docker)
- [Uso sin Docker](#uso-sin-docker)
- [Cómo agregar fuentes RSS](#cómo-agregar-fuentes-rss)
- [Publicar directamente en LinkedIn](#publicar-directamente-en-linkedin)
- [Fuentes RSS incluidas](#fuentes-rss-incluidas-118-fuentes-101-activas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación adicional](#documentación-adicional)
- [Capturas de pantalla](#capturas-de-pantalla)
- [Publicarlo en internet](#publicarlo-en-internet)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

---

## ¿Qué hace CyberPulse?

CyberPulse es una herramienta productiva para profesionales de ciberseguridad que necesitan estar al día y compartir contenido relevante en LinkedIn.

<p align="center">
  <img src=".github/screenshots/01-news-feed.png" width="90%" alt="CyberPulse news feed">
</p>

- **Recopila** noticias de más de 100 fuentes RSS de ciberseguridad.
- **Clasifica** cada artículo por categoría (`VULNERABILITY`, `MALWARE`, `THREAT INTEL`, etc.) y severidad (`critical`, `high`, `medium`, `low`).
- **Genera posts** para LinkedIn en varios formatos y tonos, con negritas reales (HTML).
- **Publica directamente en LinkedIn** desde el generador tras la autorización OAuth.
- **Soporta IA**: conecta tu proveedor OpenAI-compatible (OpenAI, Groq, etc.) para generar posts personalizados; si falla, usa plantillas locales.
- **Expone una API REST y un endpoint MCP** para integrarlo con agentes de IA como Hermes u OpenClaw.
- **Funciona 100 % local** con SQLite y Docker.

---

## Features

- 📰 **118 fuentes RSS incluidas**, 101 activas por defecto.
- 🕰️ **Ventanas de lectura**: últimas 24h, 7 días, 30 días o todo. Los contadores de cada fuente siguen la ventana elegida, y las que no tienen nada para mostrar se repliegan.
- 🔥 **Feed de noticias** con filtros por categoría, fuente, búsqueda y ordenamiento por fecha, severidad o *trending*.
- ✍️ **Generador de posts** con 5 tonos, 6 formatos y soporte EN/ES.
- 🚀 **Publicación directa en LinkedIn** desde el generador.
- 🕐 **Historial / posts guardados** para retener tu contenido generado.
- 🤖 **Generación con IA** configurable desde la UI (API key, modelo, base URL).
- ⚙️ **Fuentes RSS personalizadas** desde la interfaz web.
- 🔑 **API key opcional** para proteger endpoints sensibles.
- 🐳 **Deploy con Docker** en un solo comando.
- 📊 **Estadísticas, health checks y logs** integrados.

---

## Quick start con Docker

```bash
git clone https://github.com/safernandez666/CyberPulse.git
cd CyberPulse/app
docker compose up -d --build
```

Abre http://localhost:3001 en tu navegador.

> Si acabas de reconstruir, usa **Ctrl + F5** o una ventana de incógnito para evitar que el navegador muestre la versión anterior del frontend.

Comandos útiles:

```bash
# Ver estado
docker compose ps

# Ver logs
docker compose logs -f

# Forzar scraping manual
curl -X POST http://localhost:3001/api/scrape

# Ver fuentes activas
curl http://localhost:3001/api/sources

# Detener
docker compose down
```

---

## Uso sin Docker

Requisitos: Node.js 20+ y npm 10+.

```bash
cd CyberPulse/app
npm install
npm run build
npm run server
```

- App: http://localhost:3001
- La base de datos SQLite se crea en `./data/cyberpulse.db`.

---

## Cómo agregar fuentes RSS

Hay tres formas de agregar una nueva fuente.

### Opción 1: Desde la interfaz web (recomendado)

<p align="center">
  <img src=".github/screenshots/04-settings.png" width="60%" alt="CyberPulse panel de configuración">
</p>

1. Abre CyberPulse y haz clic en **Configuración** (icono de engranaje).
2. Ve a la sección **Fuentes RSS personalizadas**.
3. Completa:
   - **Nombre**: el nombre visible de la fuente.
   - **URL del feed RSS**: ej. `https://mi-fuente.com/feed.xml`.
   - **Categoría**: una de las categorías existentes (ver lista más abajo).
4. Haz clic en **Agregar fuente**.
5. Opcionalmente, introduce la **CyberPulse API Key** si protegiste el backend con `CYBERPULSE_API_KEY`.

La nueva fuente se scrapea en el próximo ciclo automático (cada 15 minutos) o puedes forzarlo:

```bash
curl -X POST http://localhost:3001/api/scrape
```

### Opción 2: Mediante la API REST

```bash
# Sin API key configurada
curl -X POST http://localhost:3001/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Nueva Fuente",
    "rssUrl": "https://mi-fuente.com/feed.xml",
    "category": "THREAT INTEL"
  }'

# Con API key configurada
curl -X POST http://localhost:3001/api/sources \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu-clave-secreta" \
  -d '{
    "name": "Mi Nueva Fuente",
    "rssUrl": "https://mi-fuente.com/feed.xml",
    "category": "THREAT INTEL"
  }'
```

### Opción 3: Editar el código

1. Abre `app/server/seeds.ts`.
2. Agrega una entrada al array `RSS_SOURCES`:

```typescript
{
  name: 'Mi Nueva Fuente',
  rssUrl: 'https://mi-fuente.com/feed.xml',
  category: 'THREAT INTEL'
}
```

3. Reconstruye el contenedor:

```bash
docker compose down
docker compose up -d --build
```

### Categorías disponibles

| Categoría | Uso típico |
|-----------|------------|
| `VULNERABILITY` | Vulnerabilidades, parches, advisories |
| `MALWARE` | Malware, ransomware, análisis de muestras |
| `THREAT INTEL` | Inteligencia de amenazas, reportes de actores |
| `DATA BREACH` | Filtraciones de datos, breaches |
| `PHISHING` | Campañas de phishing, engaños |
| `COMPLIANCE` | Cumplimiento normativo |
| `RESEARCH` | Investigación de seguridad |
| `PRIVACY` | Privacidad |
| `POLICY` | Políticas gubernamentales |
| `INDUSTRY` | Noticias de la industria |
| `ALERT` | Alertas de CERT/CISA/NCSC |
| `AWARENESS` | Concientización |
| `EXPLOIT` | Exploits, PoC, zero-days |
| `IOT` | Seguridad IoT |
| `TECH` | Tecnología general relevante |

---

## Publicar directamente en LinkedIn

CyberPulse puede publicar posts generados directamente en tu feed personal de LinkedIn. Usa la API oficial de LinkedIn con OAuth 2.0, así que vos mantenés el control total de tu cuenta.

<p align="center">
  <img src=".github/screenshots/05-linkedin-settings.png" width="60%" alt="Configuración de LinkedIn">
</p>

### 1. Crear una LinkedIn Developer App

1. Andá al [LinkedIn Developer Portal](https://developer.linkedin.com/) y hacé clic en **Create app**.
2. Completá los datos requeridos:
   - **App name**: ej. `CyberPulse`
   - **LinkedIn Page**: tenés que asociar una página de empresa de LinkedIn. Si no tenés una, creá una mínima.
   - **Privacy policy URL**: tu sitio web o perfil de LinkedIn.
3. En la pestaña **Products**, solicitá:
   - **Share on LinkedIn** — aprobación inmediata.
   - **Sign In with LinkedIn using OpenID Connect** — aprobación inmediata.
4. Andá a la pestaña **Auth**:
   - Copiá tu **Client ID** y **Client Secret**.
   - En **OAuth 2.0 settings**, agregá esta URL de redirección:
     ```
     http://localhost:3001/api/linkedin/callback
     ```

### 2. Configurar CyberPulse

1. Abrí CyberPulse y hacé clic en **Configuración**.
2. Desplazate hasta la sección **LinkedIn Account**.
3. Pegá tu **Client ID**, **Client Secret** y la redirect URI (`http://localhost:3001/api/linkedin/callback`).
4. Hacé clic en **Save LinkedIn App**.

### 3. Conectar tu cuenta

1. En la misma sección de LinkedIn Account, hacé clic en **Connect LinkedIn Account**.
2. Autorizá a CyberPulse en el popup de LinkedIn.
3. Cuando veas "LinkedIn Connected", podés cerrar el popup.

### 4. Publicar un post

1. Andá a **Generate Post**, elegí un artículo y generá tu publicación.
2. Hacé clic en **Post to LinkedIn**.
3. Revisá el texto, elegí **Public** o **Connections** y hacé clic en **Publish**.

<p align="center">
  <img src=".github/screenshots/07-linkedin-publish-dialog.png" width="70%" alt="Diálogo de publicación en LinkedIn">
</p>

> **Nota:** los tokens de acceso de LinkedIn expiran aproximadamente a los 60 días. Si deja de funcionar la publicación, reconectá tu cuenta desde Configuración.

---

## Fuentes RSS incluidas (118 fuentes, 101 activas)

CyberPulse incluye 118 feeds de ciberseguridad, 101 habilitados por defecto. Esta lista se genera desde `app/server/seeds.ts` — ejecutá `npm run docs:sources` después de modificarlo.

### ALERT

| Fuente | URL del RSS |
|--------|-------------|
| CERT-EU | https://cert.europa.eu/publications/security-advisories-rss |
| CERT-FR | https://www.cert.ssi.gouv.fr/feed/ |
| INCIBE | https://www.incibe.es/incibe-cert/alerta-temprana/avisos/feed |
| JPCERT/CC | https://www.jpcert.or.jp/english/rss/jpcert-en.rdf |
| JPCERT/CC Blog | https://blogs.jpcert.or.jp/en/atom.xml |
| UK NCSC All | https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml |
| UK NCSC News | https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml |
| UK NCSC Reports | https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml |

### COMPLIANCE

| Fuente | URL del RSS |
|--------|-------------|
| Dark Reading | https://www.darkreading.com/rss.xml |

### DATA BREACH

| Fuente | URL del RSS |
|--------|-------------|
| The Record | https://therecord.media/feed/ |
| Troy Hunt | https://www.troyhunt.com/rss/ |

### EXPLOIT

| Fuente | URL del RSS |
|--------|-------------|
| Exploit-DB | https://www.exploit-db.com/rss.xml |
| Sploitus | https://sploitus.com/rss |
| ZDI Blog | https://www.zerodayinitiative.com/blog?format=rss |
| ZDI Published | https://www.zerodayinitiative.com/rss/published/ |

### INDUSTRY

| Fuente | URL del RSS |
|--------|-------------|
| Cybersecurity Dive | https://www.cybersecuritydive.com/feeds/news/ |
| Infosecurity Magazine | http://www.infosecurity-magazine.com/rss/news/ |

### IOT

| Fuente | URL del RSS |
|--------|-------------|
| Attify Blog | https://blog.attify.com/rss/ |

### MALWARE

| Fuente | URL del RSS |
|--------|-------------|
| Bitdefender | https://www.bitdefender.com/blog/api/rss/hotforsecurity/ |
| Elastic Security Labs | https://www.elastic.co/security-labs/rss/feed.xml |
| Kaspersky Blog | https://www.kaspersky.com/blog/feed/ |
| Malwarebytes Labs | https://blog.malwarebytes.com/feed/ |
| Securelist | https://securelist.com/feed/ |
| SecurityWeek | https://feeds.feedburner.com/securityweek |
| SentinelOne | https://www.sentinelone.com/blog/feed/ |
| Sophos News | https://feeds.feedburner.com/sophos/dgdY |
| WeLiveSecurity | https://www.welivesecurity.com/en/rss/feed/ |

### PHISHING

| Fuente | URL del RSS |
|--------|-------------|
| Krebs on Security | https://krebsonsecurity.com/feed/ |

### POLICY

| Fuente | URL del RSS |
|--------|-------------|
| CyberScoop | https://cyberscoop.com/feed |

### RESEARCH

| Fuente | URL del RSS |
|--------|-------------|
| Ars Technica Security | https://arstechnica.com/security/feed/ |
| Fuzzing Labs | https://webassembly-security.com/feed/ |
| Google Bug Hunters | https://bughunters.google.com/feed/en |
| Google Online Security | https://feeds.feedburner.com/GoogleOnlineSecurityBlog |
| Google Project Zero | https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss |
| InfoSec Write-ups | https://infosecwriteups.com/feed |
| MaskRay | https://maskray.me/blog/atom.xml |
| NVISO Labs | https://blog.nviso.eu/feed/ |
| paper - Last paper | https://paper.seebug.org/rss/ |
| S3cur3Th1sSh1t | https://s3cur3th1ssh1t.github.io/feed.xml |
| STAR Labs | https://starlabs.sg/publications/index.xml |
| Tencent Xuanwu Lab | https://xlab.tencent.com/cn/feed/ |
| Trail of Bits | https://blog.trailofbits.com/feed/ |
| XPN InfoSec Blog | https://blog.xpnsec.com/rss/ |

### TECH

| Fuente | URL del RSS |
|--------|-------------|
| Hacker News Frontpage | https://hnrss.org/frontpage |
| Kali Linux | https://www.kali.org/rss.xml |

### THREAT INTEL

| Fuente | URL del RSS |
|--------|-------------|
| 4hou | https://www.4hou.com/feed |
| Anquanke | https://api.anquanke.com/data/v1/rss |
| Check Point Blog | https://blog.checkpoint.com/feed/ |
| Check Point Research | https://research.checkpoint.com/feed/ |
| Cisco Talos | https://feeds.feedburner.com/feedburner/Talos |
| CrowdStrike Blog | https://www.crowdstrike.com/blog/feed/ |
| Cybersecurity News | https://securityonline.info/feed/ |
| Darknet | http://feeds.feedburner.com/darknethackers |
| GuidePoint Security | https://www.guidepointsecurity.com/feed/ |
| HackerNews.cc | http://hackernews.cc/feed |
| Intelligence Online | https://feeds.feedburner.com/IntelligenceOnline |
| Palo Alto Networks | https://www.paloaltonetworks.com/blog/feed |
| Proofpoint Threat Insight | https://www.proofpoint.com/us/threat-insight-blog.xml |
| RedPacket Security | https://www.redpacketsecurity.com/feed/ |
| Risky Business | https://risky.biz/rss.xml |
| SANS ISC | https://isc.sans.edu/rssfeed.xml |
| SANS ISC Full | https://isc.sans.edu/rssfeed_full.xml |
| Schneier on Security | https://www.schneier.com/feed/atom/ |
| The DFIR Report | https://thedfirreport.com/feed/ |
| The Hacker News | https://feeds.feedburner.com/TheHackersNews |
| ThreatCluster | https://threatcluster.io/feed.xml |
| Threatpost | https://threatpost.com/feed/ |

### VULNERABILITY

| Fuente | URL del RSS |
|--------|-------------|
| Apple Developer Releases | https://developer.apple.com/news/releases/rss/releases.rss |
| Apple Newsroom | https://www.apple.com/newsroom/rss-feed.rss |
| BleepingComputer | https://www.bleepingcomputer.com/feed/ |
| Bugtraq | http://seclists.org/rss/bugtraq.rss |
| CERT Vulnerability Notes | http://www.kb.cert.org/vulfeed |
| CISA Advisories | https://www.cisa.gov/cybersecurity-advisories/all.xml |
| CISA ICS Advisories | https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml |
| CISA ICS Medical Advisories | https://www.cisa.gov/cybersecurity-advisories/ics-medical-advisories.xml |
| Cisco Security Blog | https://blogs.cisco.com/security/feed |
| CVEfeed.io | https://cvefeed.io/rssfeed/latest.xml |
| CXSecurity | https://cxsecurity.com/wlb/rss/all/ |
| Der Flounder | https://derflounder.wordpress.com/feed/ |
| FortiGuard PSIRT | https://www.fortiguard.com/rss/ir.xml |
| HackerOne Hacktivity | https://rss.ricterz.me/hacktivity |
| Intigriti | https://blog.intigriti.com/feed/ |
| Joseph Thacker | https://rez0.blog/feed.xml |
| Microsoft Security | https://www.microsoft.com/en-us/security/blog/feed/ |
| Microsoft Security Update Guide | https://api.msrc.microsoft.com/update-guide/rss |
| NSFocus | http://blog.nsfocus.net/feed/ |
| Palo Alto Security Advisories | https://security.paloaltonetworks.com/rss.xml |
| Pen Test Partners | https://www.pentestpartners.com/feed/ |
| PortSwigger Blog | https://portswigger.net/blog/rss |
| Praetorian | https://www.praetorian.com/blog/feed |
| Qualys Blog | https://blog.qualys.com/feed |
| Rapid7 Blog | https://blog.rapid7.com/rss/ |
| Rapid7 Emergent Threats | https://blog.rapid7.com/tag/emergent-threat-response/rss/ |
| RedesZone | https://www.redeszone.net/feed/ |
| Seebug | https://www.seebug.org/rss/new/ |
| Shubham Shah | https://shubs.io/rss/ |
| Telekom Security | https://github.security.telekom.com/atom.xml |
| Tenable Blog | https://www.tenable.com/blog/feed |
| Trickest CVE | https://github.com/trickest/cve/commits/main.atom |
| Vulners | https://vulners.com/rss.xml |
| Wallarm Lab | https://lab.wallarm.com/feed/ |

### Retiradas (17)

Verificadas como inalcanzables, por eso se incluyen deshabilitadas en lugar de costar una petición en cada scrape. Siguen visibles en Settings y se pueden reactivar cuando quieras.

| Fuente | Motivo |
|--------|--------|
| Appsecco | serves HTML, feed removed |
| ASD ACSC Alerts | connection refused |
| CCN-CERT | HTTP 403 (bot protection) |
| Cyber Kendra | HTTP 403 (bot protection) |
| CyberNews | HTTP 403 (bot protection) |
| ENISA | HTTP 404, no replacement found |
| FBI Cyber | HTTP 403 (bot protection) |
| Fortinet Blog | HTTP 404, no replacement found |
| Google TAG | HTTP 404, folded into blog.google |
| Mandiant | redirects to HTML on cloud.google.com |
| NSA Cybersecurity | HTTP 403 (bot protection) |
| OSI | WAF rejects the request |
| Packet Storm | TLS cert does not match hostname |
| Security Boulevard | HTTP 403 (bot protection) |
| tttang | connection refused |
| VulDB | HTTP 403 (bot protection) |
| Yassine Aboukir | malformed XML entity |

## Publicarlo en internet

CyberPulse es un proceso de larga vida con un archivo SQLite y un cron, así que
necesita un contenedor con disco, **no** una plataforma serverless. Vercel y
similares no pueden ejecutarlo: el filesystem es efímero, así que la base se
perdería, y no hay proceso vivo entre requests para que corra el scraper.

Fly.io, Railway, Render o cualquier VPS chico sirven. Se incluye un `fly.toml`.

### Qué cambia al exponerlo

La lectura queda abierta: cualquiera puede navegar el feed. Todo lo que
escribe, toca LinkedIn, llama a un proveedor de IA o dispara un scrape exige
la API key. La cargás una vez en **Settings → CyberPulse API Key**; quien no
la tenga simplemente no ve esos controles.

Dos variables dejan de ser opcionales cuando la app es alcanzable desde internet:

```bash
CYBERPULSE_API_KEY=$(openssl rand -hex 32)   # sin esto, cualquiera podría publicar en tu LinkedIn
CYBERPULSE_SECRET=$(openssl rand -hex 32)    # cifra las credenciales de LinkedIn guardadas
```

El servidor se niega a arrancar con `NODE_ENV=production` y sin API key. Si
realmente lo querés abierto, poné `CYBERPULSE_ALLOW_NO_AUTH=true` sabiendo que
la publicación en LinkedIn queda sin autenticar.

Guardá bien `CYBERPULSE_SECRET`: si lo perdés, la conexión de LinkedIn
almacenada no se puede descifrar y vas a tener que desconectar y reconectar.

### Fly.io

```bash
cd app
fly launch --no-deploy --copy-config
fly volumes create cyberpulse_data --size 1 --region eze
fly secrets set CYBERPULSE_API_KEY=$(openssl rand -hex 32) \
                CYBERPULSE_SECRET=$(openssl rand -hex 32)
fly deploy
```

El volumen es lo que hace que la base sobreviva a un deploy, y
`auto_stop_machines = false` es lo que mantiene vivo al scraper: una máquina
detenida deja de recolectar sin avisar.

Configurá el redirect URI de LinkedIn como
`https://<tu-app>/api/linkedin/callback`, tanto en la consola de LinkedIn
Developers como en `LINKEDIN_REDIRECT_URI`.

### Endurecimiento ya incluido

- Contenedor sin root (uid 1000), sin compilador ni herramientas en la imagen de runtime.
- Cabeceras de seguridad con `helmet`, incluida una content security policy.
- Rate limiting: 300 lecturas y 20 escrituras por minuto por IP.
- CORS restringido a same-origin salvo que `CYBERPULSE_CORS_ORIGINS` diga otra cosa.
- El proxy de IA sólo alcanza una allowlist de hosts de proveedores, por https.

---

## Desarrollo

```bash
cd app
npm install
npm run dev          # Vite en :3000 + API en :3001
npm test             # 37 tests unitarios (vitest)
npm run build        # typecheck + bundle de producción
npm run lint
npm run docs:sources # regenera las tablas de fuentes de ambos READMEs desde seeds.ts
```

Los tests cubren el manejo de fechas del scraper, el filtrado por ventana
temporal y los helpers de seguridad (escapado de HTML, verificación de
same-origin, allowlist de hosts de IA). El CI corre el build, los tests y
`npm audit --omit=dev` en cada push y pull request.

Después de editar `app/server/seeds.ts`, ejecutá `npm run docs:sources` para
que las tablas de este archivo sigan reflejando lo que realmente se publica.

---

## Estructura del repositorio

```
CyberPulse/
├── app/                  # Aplicación principal (React + Express + SQLite)
│   ├── src/              # Frontend
│   ├── server/           # Backend y scraper
│   ├── public/           # Logo y assets estáticos
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── API.md            # Documentación completa de la API
│   └── DOCKER.md         # Guía detallada de Docker
├── vscode-extension/     # Extensión de VS Code para CyberPulse
├── research/             # Documentación de arquitectura y estrategia de contenido
└── README.md             # Versión en inglés
```

---

## Capturas de pantalla

Algunas capturas de CyberPulse en acción. Haz clic en cualquier imagen para verla en tamaño completo.

| News Feed | Generate Post | History | Settings |
|-----------|---------------|---------|----------|
| <a href=".github/screenshots/01-news-feed.png"><img src=".github/screenshots/01-news-feed.png" width="220"></a> | <a href=".github/screenshots/02-generate-post.png"><img src=".github/screenshots/02-generate-post.png" width="220"></a> | <a href=".github/screenshots/03-history.png"><img src=".github/screenshots/03-history.png" width="220"></a> | <a href=".github/screenshots/04-settings.png"><img src=".github/screenshots/04-settings.png" width="220"></a> |

| LinkedIn Settings | LinkedIn Button | LinkedIn Publish |
|-------------------|-----------------|------------------|
| <a href=".github/screenshots/05-linkedin-settings.png"><img src=".github/screenshots/05-linkedin-settings.png" width="220"></a> | <a href=".github/screenshots/06-linkedin-button.png"><img src=".github/screenshots/06-linkedin-button.png" width="220"></a> | <a href=".github/screenshots/07-linkedin-publish-dialog.png"><img src=".github/screenshots/07-linkedin-publish-dialog.png" width="220"></a> |

---

## Documentación adicional

- [`app/API.md`](app/API.md) – Endpoints REST y MCP completos.
- [`app/DOCKER.md`](app/DOCKER.md) – Guía avanzada de Docker.

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `CYBERPULSE_API_KEY` | `null` | API key opcional para proteger endpoints sensibles |
| `LINKEDIN_CLIENT_ID` | `null` | Client ID de la LinkedIn Developer App (opcional — también se puede configurar en la GUI) |
| `LINKEDIN_CLIENT_SECRET` | `null` | Client Secret de la LinkedIn Developer App (opcional — también se puede configurar en la GUI) |
| `LINKEDIN_REDIRECT_URI` | `http://localhost:3001/api/linkedin/callback` | URI de redirección de OAuth de LinkedIn |
| `SCRAPE_CRON` | `*/15 * * * *` | Intervalo de scraping RSS |
| `NODE_ENV` | `production` | Entorno de Node |

---

## Licencia

MIT © Santiago Fernández
