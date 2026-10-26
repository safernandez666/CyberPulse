# =============================================================================
# CyberPulse — Dockerfile
# Toolchain stays in the build stages; production ships runtime files only.
# =============================================================================

# ─── Stage 1: dependencies (needs a C++ toolchain for better-sqlite3) ───────
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

# Full tree, used to build the frontend.
RUN npm ci

# A second, runtime-only tree so the production image never carries devDeps.
# tsx runs the TypeScript server directly and is pure JS, so it belongs here.
RUN mkdir -p /runtime \
    && cp package.json package-lock.json* /runtime/ \
    && cd /runtime \
    && npm ci --omit=dev \
    && npm install tsx

# ─── Stage 2: build the frontend ────────────────────────────────────────────
FROM deps AS frontend-builder

WORKDIR /app
COPY . .
RUN npm run build

# ─── Stage 3: production ────────────────────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# No compiler, no curl: the healthcheck uses node's built-in fetch.
COPY --from=deps     --chown=node:node /runtime/node_modules ./node_modules
COPY --from=deps     --chown=node:node /app/package.json     ./package.json
COPY --from=frontend-builder --chown=node:node /app/dist     ./dist
COPY --chown=node:node server ./server

# The database lives here; mount a volume over it to persist across restarts.
RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Drop root. On Linux bind mounts the host directory must be writable by
# uid 1000, or use a named volume, which inherits this ownership.
USER node

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=120s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "server/index.ts"]
