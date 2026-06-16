# CyberPulse — Docker Deployment Guide

Deploy CyberPulse anywhere with Docker in minutes.

---

## Quick Start (1 command)

```bash
git clone <repo-url> cyberpulse
cd cyberpulse
docker compose up -d
```

CyberPulse estará disponible en:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api/news
- **MCP**: http://localhost:3001/api/mcp

---

## Commands

```bash
# Start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Restart
docker compose restart

# Rebuild (after code changes)
docker compose up -d --build

# With API key
docker compose down
CYBERPULSE_API_KEY=your-secret-key docker compose up -d
```

---

## Deploy en Railway (gratis)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Deploy
railway up

# 5. Add env var (optional)
railway variables set CYBERPULSE_API_KEY=your-secret-key
```

---

## Deploy en Render (gratis)

1. Create **New Web Service**
2. Connect your GitHub repo
3. Set:
   - **Runtime**: Docker
   - **Port**: `3001`
   - **Plan**: Free
4. Add env var: `CYBERPULSE_API_KEY` (optional)
5. Click **Deploy**

---

## Deploy en VPS (DigitalOcean, Linode, etc.)

```bash
# SSH to your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone <repo-url> cyberpulse
cd cyberpulse
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CYBERPULSE_API_KEY` | `null` | API key for auth (optional) |
| `SCRAPE_CRON` | `*/15 * * * *` | RSS scrape interval |
| `NODE_ENV` | `production` | Node environment |

---

## API Endpoints (after deploy)

Once deployed, your API will be at `https://your-domain.com/api/...`

```bash
# Health check
curl https://your-domain.com/api/health

# List news
curl https://your-domain.com/api/news

# Generate post
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{"articleId":"1","title":"Test","summary":"Summary","source":"Test","severity":"high","url":"https://test.com","tone":"Professional","format":"News Analysis","language":"en"}'

# MCP endpoint
curl -X POST https://your-domain.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"action":"list_news","params":{"limit":5}}'
```

---

## Integración con Hermes / OpenClaw / MCP

```json
{
  "mcpServers": {
    "cyberpulse": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "X-API-Key": "your-secret-key"
      }
    }
  }
}
```

---

## Troubleshooting

```bash
# Container not starting
docker compose logs

# Database issues
docker compose exec cyberpulse ls -la /app/data/

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```
