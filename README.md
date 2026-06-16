<table width="100%" bgcolor="#0a0a0a" style="background-color:#0a0a0a; color:#e5e5e5;">
  <tr>
    <td align="center" style="padding: 2rem 1rem;">
      <img src="app/public/pulse-logo-dark.svg" width="140" alt="CyberPulse logo">
      <h1>CyberPulse</h1>
      <p>
        <strong>Cybersecurity news aggregator with a LinkedIn post generator.</strong><br>
        Consumes 100+ RSS feeds, classifies articles by severity/category, and generates publication-ready content.
      </p>
      <p>
        <a href="README.es.md">🇪🇸 Leer en castellano</a>
      </p>
      <p>
        <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker ready">
        <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20+">
        <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License MIT">
      </p>
    </td>
  </tr>
</table>

---

## Table of Contents

- [What is CyberPulse?](#what-is-cyberpulse)
- [Features](#features)
- [Quick start with Docker](#quick-start-with-docker)
- [Running without Docker](#running-without-docker)
- [How to add RSS sources](#how-to-add-rss-sources)
- [Post directly to LinkedIn](#post-directly-to-linkedin)
- [Built-in RSS sources](#built-in-rss-sources-104-sources)
- [Repository structure](#repository-structure)
- [Additional documentation](#additional-documentation)
- [Screenshots](#screenshots)
- [License](#license)

---

## What is CyberPulse?

CyberPulse is a productivity tool for cybersecurity professionals who need to stay current and share relevant content on LinkedIn.

<p align="center">
  <img src=".github/screenshots/01-news-feed.png" width="90%" alt="CyberPulse news feed">
</p>

- **Collects** news from 100+ cybersecurity RSS feeds.
- **Classifies** each article by category (`VULNERABILITY`, `MALWARE`, `THREAT INTEL`, etc.) and severity (`critical`, `high`, `medium`, `low`).
- **Generates LinkedIn posts** in multiple formats and tones, with real bold text (HTML).
- **Publishes directly to LinkedIn** from the generator after OAuth authorization.
- **Supports AI generation**: connect your OpenAI-compatible provider (OpenAI, Groq, etc.) from the UI; falls back to local templates on failure.
- **Exposes a REST API and an MCP endpoint** for integration with AI agents like Hermes or OpenClaw.
- **Runs 100 % locally** with SQLite and Docker.

---

## Features

- 📰 **100+ built-in RSS feeds**.
- 🔥 **News feed** with filters by category, source, search, and sorting by date, severity or *trending*.
- ✍️ **Post generator** with 5 tones, 6 formats, and EN/ES support.
- 🚀 **Post directly to LinkedIn** from the generator.
- 🕐 **History / saved posts** to keep your generated content.
- 🤖 **AI generation** configurable from the UI (API key, model, base URL).
- ⚙️ **Custom RSS sources** from the web interface.
- 🔑 **Optional API key** to protect sensitive endpoints.
- 🐳 **One-command Docker deploy**.
- 📊 **Stats, health checks, and logs** built in.

---

## Quick start with Docker

```bash
git clone https://github.com/safernandez666/CyberPulse.git
cd CyberPulse/app
docker compose up -d --build
```

Open http://localhost:3001 in your browser.

> After rebuilding, use **Ctrl + F5** or an incognito window to avoid the browser showing a cached frontend.

Useful commands:

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Force a manual scrape
curl -X POST http://localhost:3001/api/scrape

# List active sources
curl http://localhost:3001/api/sources

# Stop
docker compose down
```

---

## Running without Docker

Requirements: Node.js 20+ and npm 10+.

```bash
cd CyberPulse/app
npm install
npm run build
npm run server
```

- App: http://localhost:3001
- SQLite database is created at `./data/cyberpulse.db`.

---

## How to add RSS sources

There are three ways to add a new source.

### Option 1: From the web UI (recommended)

<p align="center">
  <img src=".github/screenshots/04-settings.png" width="60%" alt="CyberPulse settings panel">
</p>

1. Open CyberPulse and click **Settings** (gear icon).
2. Go to the **Custom RSS Sources** section.
3. Fill in:
   - **Name**: display name of the source.
   - **RSS feed URL**: e.g. `https://my-source.com/feed.xml`.
   - **Category**: one of the existing categories (see list below).
4. Click **Add source**.
5. If you protected the backend with `CYBERPULSE_API_KEY`, enter the **CyberPulse API Key** as well.

The new source is scraped in the next automatic cycle (every 15 minutes) or you can force it:

```bash
curl -X POST http://localhost:3001/api/scrape
```

### Option 2: Via the REST API

```bash
# Without API key
curl -X POST http://localhost:3001/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Source",
    "rssUrl": "https://my-source.com/feed.xml",
    "category": "THREAT INTEL"
  }'

# With API key configured
curl -X POST http://localhost:3001/api/sources \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{
    "name": "My New Source",
    "rssUrl": "https://my-source.com/feed.xml",
    "category": "THREAT INTEL"
  }'
```

### Option 3: Edit the code

1. Open `app/server/seeds.ts`.
2. Add an entry to the `RSS_SOURCES` array:

```typescript
{
  name: 'My New Source',
  rssUrl: 'https://my-source.com/feed.xml',
  category: 'THREAT INTEL'
}
```

3. Rebuild the container:

```bash
docker compose down
docker compose up -d --build
```

### Available categories

| Category | Typical use |
|----------|-------------|
| `VULNERABILITY` | Vulnerabilities, patches, advisories |
| `MALWARE` | Malware, ransomware, sample analysis |
| `THREAT INTEL` | Threat intelligence, actor reports |
| `DATA BREACH` | Data leaks, breaches |
| `PHISHING` | Phishing campaigns |
| `COMPLIANCE` | Regulatory compliance |
| `RESEARCH` | Security research |
| `PRIVACY` | Privacy |
| `POLICY` | Government policy |
| `INDUSTRY` | Industry news |
| `ALERT` | CERT/CISA/NCSC alerts |
| `AWARENESS` | Security awareness |
| `EXPLOIT` | Exploits, PoC, zero-days |
| `IOT` | IoT security |
| `TECH` | Relevant general tech |

---

## Post directly to LinkedIn

CyberPulse can publish generated posts straight to your personal LinkedIn feed. It uses LinkedIn's official OAuth 2.0 API, so you keep full control of your account.

<p align="center">
  <img src=".github/screenshots/05-linkedin-settings.png" width="60%" alt="LinkedIn settings">
</p>

### 1. Create a LinkedIn Developer App

1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/) and click **Create app**.
2. Fill in the required details:
   - **App name**: e.g. `CyberPulse`
   - **LinkedIn Page**: you must associate a LinkedIn Company Page. If you don't have one, create a minimal page first.
   - **Privacy policy URL**: your website or LinkedIn profile URL.
3. Under the **Products** tab, request:
   - **Share on LinkedIn** — instant approval.
   - **Sign In with LinkedIn using OpenID Connect** — instant approval.
4. Go to the **Auth** tab:
   - Copy your **Client ID** and **Client Secret**.
   - Under **OAuth 2.0 settings**, add this redirect URL:
     ```
     http://localhost:3001/api/linkedin/callback
     ```

### 2. Configure CyberPulse

1. Open CyberPulse and click **Settings**.
2. Scroll to the **LinkedIn Account** section.
3. Paste your **Client ID**, **Client Secret**, and the redirect URI (`http://localhost:3001/api/linkedin/callback`).
4. Click **Save LinkedIn App**.

### 3. Connect your account

1. In the same LinkedIn Account section, click **Connect LinkedIn Account**.
2. Authorize CyberPulse in the LinkedIn popup.
3. Once you see "LinkedIn Connected", you can close the popup.

### 4. Publish a post

1. Go to **Generate Post**, choose an article, and create your post.
2. Click **Post to LinkedIn**.
3. Review the text, choose **Public** or **Connections**, and click **Publish**.

<p align="center">
  <img src=".github/screenshots/07-linkedin-publish-dialog.png" width="70%" alt="LinkedIn publish dialog">
</p>

> **Note:** LinkedIn access tokens expire after approximately 60 days. If posting stops working, reconnect your account from Settings.

---

## Built-in RSS sources (104 sources)

CyberPulse ships pre-configured with 100+ cybersecurity sources. Some may occasionally fail due to network issues, blocks, or outdated feeds, but working sources stay active.

### ALERT

| Source | RSS URL |
|--------|---------|
| ASD ACSC Alerts | https://www.cyber.gov.au/rss/alerts |
| CERT-EU | https://cert.europa.eu/publications/newsletter%20RSS |
| CERT-FR | https://www.cert.ssi.gouv.fr/feed/ |
| INCIBE | https://www.incibe.es/feed/alertas-tempranas |
| JPCERT/CC | https://www.jpcert.or.jp/english/rss/jpcert-en.rdf |
| JPCERT/CC Blog | https://blogs.jpcert.or.jp/en/atom.xml |
| UK NCSC All | https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml |
| UK NCSC News | https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml |
| UK NCSC Reports | https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml |

### AWARENESS

| Source | RSS URL |
|--------|---------|
| OSI | https://www.osi.es/feed/actualidad |

### COMPLIANCE

| Source | RSS URL |
|--------|---------|
| Dark Reading | https://www.darkreading.com/rss.xml |

### DATA BREACH

| Source | RSS URL |
|--------|---------|
| The Record | https://therecord.media/feed/ |
| Troy Hunt | https://www.troyhunt.com/rss/ |

### EXPLOIT

| Source | RSS URL |
|--------|---------|
| Exploit-DB | https://www.exploit-db.com/rss.xml |
| Packet Storm | https://rss.packetstormsecurity.com/files/ |
| Sploitus | https://sploitus.com/rss |
| ZDI Blog | https://www.zerodayinitiative.com/blog?format=rss |
| ZDI Published | https://www.zerodayinitiative.com/rss/published/ |

### INDUSTRY

| Source | RSS URL |
|--------|---------|
| Cybersecurity Dive | https://www.cybersecuritydive.com/feeds/news/ |
| Infosecurity Magazine | http://www.infosecurity-magazine.com/rss/news/ |
| Security Boulevard | https://securityboulevard.com/feed/ |

### IOT

| Source | RSS URL |
|--------|---------|
| Attify Blog | https://blog.attify.com/rss/ |

### MALWARE

| Source | RSS URL |
|--------|---------|
| Bitdefender | https://www.bitdefender.com/blog/hotforsecurity/feed/ |
| Elastic Security Labs | https://www.elastic.co/security-labs/rss/feed.xml |
| Kaspersky Blog | https://www.kaspersky.com/blog/feed/ |
| Malwarebytes Labs | https://blog.malwarebytes.com/feed/ |
| Securelist | https://securelist.com/feed/ |
| SecurityWeek | https://feeds.feedburner.com/securityweek |
| SentinelOne | https://www.sentinelone.com/feed/ |
| Sophos News | https://news.sophos.com/en-us/feed/ |
| WeLiveSecurity | https://www.welivesecurity.com/en/rss/feed/ |

### PHISHING

| Source | RSS URL |
|--------|---------|
| Krebs on Security | https://krebsonsecurity.com/feed/ |

### POLICY

| Source | RSS URL |
|--------|---------|
| CyberScoop | https://cyberscoop.com/feed |
| ENISA | https://www.enisa.europa.eu/rss/publications |
| NSA Cybersecurity | https://www.nsa.gov/Press-Room/Press-Releases-Statements/feed/ |

### RESEARCH

| Source | RSS URL |
|--------|---------|
| Ars Technica Security | https://arstechnica.com/security/feed/ |
| Google Online Security | https://feeds.feedburner.com/GoogleOnlineSecurityBlog |
| Google Project Zero | https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss |
| Google TAG | https://blog.google/threat-analysis-group/rss/ |
| InfoSec Write-ups | https://infosecwriteups.com/feed |
| STAR Labs | https://starlabs.sg/publications/index.xml |
| Tencent Xuanwu Lab | https://xlab.tencent.com/cn/feed/ |
| Trail of Bits | https://blog.trailofbits.com/feed/ |
| paper - Last paper | https://paper.seebug.org/rss/ |
| tttang | https://www.tttang.com/rss.xml |

### TECH

| Source | RSS URL |
|--------|---------|
| Hacker News Frontpage | https://hnrss.org/frontpage |

### THREAT INTEL

| Source | RSS URL |
|--------|---------|
| 4hou | https://www.4hou.com/feed |
| Anquanke | https://api.anquanke.com/data/v1/rss |
| Check Point Blog | https://blog.checkpoint.com/feed/ |
| Check Point Research | https://research.checkpoint.com/feed/ |
| Cisco Talos | https://feeds.feedburner.com/feedburner/Talos |
| CrowdStrike Blog | https://www.crowdstrike.com/blog/feed/ |
| Cyber Kendra | https://www.cyberkendra.com/feeds/posts/default |
| CyberNews | https://cybernews.com/feed/ |
| Cybersecurity News | https://securityonline.info/feed/ |
| Darknet | http://feeds.feedburner.com/darknethackers |
| FBI Cyber | https://www.fbi.gov/news/feed |
| HackerNews.cc | http://hackernews.cc/feed |
| Intelligence Online | https://feeds.feedburner.com/IntelligenceOnline |
| Mandiant | https://www.mandiant.com/resources/blog/rss.xml |
| Palo Alto Networks | https://www.paloaltonetworks.com/blog/feed |
| Proofpoint Threat Insight | https://www.proofpoint.com/us/threat-insight-blog.xml |
| RedPacket Security | https://www.redpacketsecurity.com/feed/ |
| Risky Business | https://risky.biz/rss.xml |
| SANS ISC | https://isc.sans.edu/rssfeed.xml |
| SANS ISC Full | https://isc.sans.edu/rssfeed_full.xml |
| Schneier on Security | https://www.schneier.com/feed/atom/ |
| The DFIR Report | https://thedfirreport.com/feed/ |
| The Hacker News | https://feeds.feedburner.com/TheHackersNews |
| Threatpost | https://threatpost.com/feed/ |

### VULNERABILITY

| Source | RSS URL |
|--------|---------|
| Apple Developer Releases | https://developer.apple.com/news/releases/rss/releases.rss |
| Apple Newsroom | https://www.apple.com/newsroom/rss-feed.rss |
| Appsecco | https://blog.appsecco.com/feed |
| BleepingComputer | https://www.bleepingcomputer.com/feed/ |
| Bugtraq | http://seclists.org/rss/bugtraq.rss |
| CCN-CERT | https://www.ccn-cert.cni.es/feed/avisos |
| CERT Vulnerability Notes | http://www.kb.cert.org/vulfeed |
| CISA Advisories | https://www.cisa.gov/cybersecurity-advisories/all.xml |
| CISA ICS Advisories | https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml |
| CISA ICS Medical Advisories | https://www.cisa.gov/cybersecurity-advisories/ics-medical-advisories.xml |
| CVEfeed.io | https://cvefeed.io/rssfeed/latest.xml |
| CXSecurity | https://cxsecurity.com/wlb/rss/all/ |
| Cisco Security Blog | https://blogs.cisco.com/security/feed |
| Der Flounder | https://derflounder.wordpress.com/feed/ |
| FortiGuard PSIRT | https://www.fortiguard.com/rss/ir.xml |
| Fortinet Blog | https://www.fortinet.com/blog/feed |
| HackerOne Hacktivity | https://rss.ricterz.me/hacktivity |
| Intigriti | https://blog.intigriti.com/feed/ |
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
| Tenable Blog | https://www.tenable.com/blog/feed |
| Trickest CVE | https://github.com/trickest/cve/commits/main.atom |
| VulDB | https://vuldb.com/en/?rss.recent |
| Vulners | https://vulners.com/rss.xml |

---

## Repository structure

```
CyberPulse/
├── app/                  # Main application (React + Express + SQLite)
│   ├── src/              # Frontend
│   ├── server/           # Backend and scraper
│   ├── public/           # Logo and static assets
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── API.md            # Full API documentation
│   └── DOCKER.md         # Detailed Docker guide
├── vscode-extension/     # VS Code extension for CyberPulse
├── research/             # Architecture and content strategy docs
└── README.md             # This file
```

---

## Screenshots

A few captures of CyberPulse in action. Click any image to view it full size.

| News Feed | Generate Post | History | Settings |
|-----------|---------------|---------|----------|
| <a href=".github/screenshots/01-news-feed.png"><img src=".github/screenshots/01-news-feed.png" width="220"></a> | <a href=".github/screenshots/02-generate-post.png"><img src=".github/screenshots/02-generate-post.png" width="220"></a> | <a href=".github/screenshots/03-history.png"><img src=".github/screenshots/03-history.png" width="220"></a> | <a href=".github/screenshots/04-settings.png"><img src=".github/screenshots/04-settings.png" width="220"></a> |

| LinkedIn Settings | LinkedIn Button | LinkedIn Publish |
|-------------------|-----------------|------------------|
| <a href=".github/screenshots/05-linkedin-settings.png"><img src=".github/screenshots/05-linkedin-settings.png" width="220"></a> | <a href=".github/screenshots/06-linkedin-button.png"><img src=".github/screenshots/06-linkedin-button.png" width="220"></a> | <a href=".github/screenshots/07-linkedin-publish-dialog.png"><img src=".github/screenshots/07-linkedin-publish-dialog.png" width="220"></a> |

---

## Additional documentation

- [`app/API.md`](app/API.md) – Complete REST and MCP endpoints.
- [`app/DOCKER.md`](app/DOCKER.md) – Advanced Docker guide.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CYBERPULSE_API_KEY` | `null` | Optional API key to protect sensitive endpoints |
| `LINKEDIN_CLIENT_ID` | `null` | LinkedIn Developer App Client ID (optional — can also be set in the GUI) |
| `LINKEDIN_CLIENT_SECRET` | `null` | LinkedIn Developer App Client Secret (optional — can also be set in the GUI) |
| `LINKEDIN_REDIRECT_URI` | `http://localhost:3001/api/linkedin/callback` | LinkedIn OAuth redirect URI |
| `SCRAPE_CRON` | `*/15 * * * *` | RSS scraping interval |
| `NODE_ENV` | `production` | Node environment |

---

## License

MIT © Santiago Fernández
